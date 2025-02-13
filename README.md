# AI Personal Workout Recommender

## 📌 Overview
The **AI Personal Workout Recommender** is a web-based application that provides personalized fitness and diet recommendations based on user inputs such as age, weight, height, BMI, and fitness goals. It leverages **machine learning** to generate customized workout plans and dietary suggestions.

## 🚀 Features
- Accepts user input (age, height, weight, health conditions, fitness goal, etc.).
- Predicts a personalized **workout routine** and **diet plan**.
- Provides **equipment recommendations** for effective training.
- Displays results on an interactive **web UI**.
- Allows users to **download** their fitness plan as a **PDF**.

## 🛠️ Technologies Used
### **Frontend**
- React.js
- Bootstrap (for styling)
- Axios (for API calls)
- jsPDF (for PDF generation)

### **Backend**
- FastAPI (Python framework for API development)
- Scikit-Learn (Machine Learning model for recommendation)
- Pandas & NumPy (Data processing)
- Joblib (Model serialization)


## 🏗️ Project Structure
```
AI-Fitness-Recommender/
│-- backend/
│   │-- app.py  # FastAPI server
│   │-- nlp_fitness_model2.pkl  # Trained ML model
│   │-- label_encoders2.pkl  # Label encoders for categorical data
│-- frontend/
│   │-- src/
│   │   │-- App.js  # Main React Component
│   │   │-- components/  # UI Components
│-- dataset/
│   │-- gym recommendation.xlsx  # Training dataset
│-- README.md  # Project Documentation
```

## 🔧 Installation & Setup
### **1. Clone the Repository**
```bash
git clone https://github.com/vikramraaja/AI-Personal-Workout-Recommender.git
cd AI-Fitness-Recommender
```
### **2. Set Up the Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
### **3. Set Up the Frontend**
```bash
cd frontend
npm install
npm start
```

## 🔄 Workflow
1. User enters their **personal details**.
2. The **FastAPI backend** processes the request and sends it to the **ML model**.
3. The **ML model** predicts the **workout plan** and **diet recommendations**.
4. The **React frontend** displays the output in a user-friendly format.
5. User can **download the plan as a PDF**.

## 🎯 Target Audience
- Fitness Enthusiasts
- Personal Trainers
- Beginners looking for guidance
- People with specific fitness goals (Weight Loss/Gain)

## 🏋️‍♂️ Gains & Pains
### **Gains**
✔ Personalized fitness recommendations  
✔ AI-driven insights for workouts and diets  
✔ Easy-to-use web interface  

### **Pains**
❌ Limited dataset scope (improving with user data)  
❌ Requires internet access for predictions  

## 📝 Future Improvements
- Add more **fitness goals** (e.g., muscle building, endurance training).
- Integrate a **chatbot** for AI-based fitness coaching.
- Implement **user accounts** for tracking progress.

## 🏆 Conclusion
The **AI Personal Workout Recommender** provides **smart fitness recommendations** based on **ML predictions**, making fitness planning easier for users of all levels. 🚀💪

---
📩 **For queries & contributions, reach out at:** your.email@example.com
