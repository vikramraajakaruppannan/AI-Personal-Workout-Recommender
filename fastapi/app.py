from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn
from twilio.rest import Client
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

# Twilio Credentials
twilio_sid = os.getenv("twilio_sid")
twilio_auth_token = os.getenv("twilio_auth_token")
twilio_phone_number = os.getenv("twilio_phone_number")

client = Client(twilio_sid, twilio_auth_token)

# SMTP Email Credentials
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_SENDER = "vikramraajak@gmail.com"
EMAIL_PASSWORD = "uwwn orgx nqwc uhtj"


origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pipline and encoders
pipeline = joblib.load("nlp_fitness_model3.pkl")
label_encoders = joblib.load("label_encoders3.pkl")

# Pydantic Models
class FitnessInput(BaseModel):
    Sex: str
    Age: int
    Height: float
    Weight: float
    Hypertension: str
    Diabetes: str
    BMI: float
    Fitness_Goal: str
    Experience_Level: str
    Activity_Level: str


class WhatsAppRequest(BaseModel):
    phone_number: str
    message: str

class EmailRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str

#model prediction using Random Forest
def predict_fitness(input_data: dict):
    try:
        # Rename 'Fitness_Goal' to match model training key
        if "Fitness_Goal" in input_data:
            input_data["Fitness Goal"] = input_data.pop("Fitness_Goal")

        # Encode categorical features
        categorical_cols = ['Sex', 'Hypertension', 'Diabetes', 'Fitness Goal', 'Experience_Level', 'Activity_Level']
        for col in categorical_cols:
            if col not in input_data:
                raise ValueError(f"Missing required field: {col}")
            try:
                input_data[col] = label_encoders[col].transform([input_data[col]])[0]
            except ValueError as e:
                raise ValueError(f"Invalid value for {col}: {input_data[col]}. Expected one of {list(label_encoders[col].classes_)}")

        # Ensure all 10 features are provided in the correct order
        required_features = ['Sex', 'Age', 'Height', 'Weight', 'Hypertension', 'Diabetes', 'BMI', 
                            'Fitness Goal', 'Activity_Level', 'Experience_Level']
        input_list = [input_data[feat] for feat in required_features]

        # Convert to DataFrame with feature names (Random Forest expects this)
        input_df = pd.DataFrame([input_list], columns=required_features)

        # Make prediction using the pipeline
        predictions = pipeline.predict(input_df)

        # Decode predictions
        decoded_predictions = {}
        output_columns = ['Level', 'Exercises', 'Equipment', 'Diet', 'Recommendation']
        for i, col in enumerate(output_columns):
            pred_class = predictions[0, i]  # MultiOutputClassifier returns a 2D array
            decoded_value = label_encoders[col].inverse_transform([pred_class])[0]
            decoded_predictions[col] = decoded_value

        return decoded_predictions

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction Error: {str(e)}")

# API Routes
@app.post("/")
def predict(data: FitnessInput):
    prediction = predict_fitness(data.dict())
    return prediction

# Send SMS via Twilio
@app.post("/send_sms/")
def send_sms(request: WhatsAppRequest):
    try:
        if not request.phone_number.startswith("+") or not request.phone_number[1:].isdigit():
            raise HTTPException(status_code=400, detail="Invalid phone number format.")
        message = client.messages.create(
            from_=twilio_phone_number,
            body=request.message,
            to=request.phone_number
        )
        return {"status": "success", "message_sid": message.sid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Twilio Error: {str(e)}")

# Send Email via SMTP
@app.post("/send_email/")
def send_email(request: EmailRequest):
    try:
        msg = MIMEMultipart()
        msg["From"] = EMAIL_SENDER
        msg["To"] = request.recipient_email
        msg["Subject"] = request.subject
        msg.attach(MIMEText(request.body, "plain"))
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, request.recipient_email, msg.as_string())
        server.quit()
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email Error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
