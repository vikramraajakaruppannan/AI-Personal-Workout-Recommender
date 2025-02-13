from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import uvicorn

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Only allow frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load trained model and encoders
pipeline = joblib.load("nlp_fitness_model2.pkl")
label_encoders = joblib.load("label_encoders2.pkl")

# Define request model
class FitnessInput(BaseModel):
    Sex: str
    Age: int
    Height: float
    Weight: float
    Hypertension: str
    Diabetes: str
    BMI: float
    Fitness_Goal: str  # Now only 'Weight Loss' or 'Weight Gain'

# Function to preprocess input and predict
def predict_fitness(input_data: dict):
    try:
        # Standardize key names
        if "Fitness_Goal" in input_data:
            input_data["Fitness_Goal"] = input_data.pop("Fitness Goal")  # Rename key
        
        # Encode categorical input values
        for col in ['Sex', 'Hypertension', 'Diabetes', 'Fitness Goal']:
            input_data[col] = label_encoders[col].transform([input_data[col]])[0]

        # Convert input to DataFrame
        input_df = pd.DataFrame([input_data])

        # Predict
        prediction = pipeline.predict(input_df)

        # Convert predictions back to labels
        result = {}
        output_cols = ['Level', 'Exercises', 'Equipment', 'Diet', 'Recommendation']
        for idx, col in enumerate(output_cols):
            result[col] = label_encoders[col].inverse_transform([prediction[0][idx]])[0]

        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict")
def predict(data: FitnessInput):
    prediction = predict_fitness(data.dict())
    return prediction

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
