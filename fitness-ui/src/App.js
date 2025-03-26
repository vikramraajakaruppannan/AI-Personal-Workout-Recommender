import React, { useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import ResultPage from "./ResultPage";
import translations from "./translations.js";

const Home = () => {
    const [language, setLanguage] = useState("en");
    const [preview, setPreview] = useState(null);
    const [Calories, setCalories] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);
    const t = translations[language];
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        Name: "",
        DOB: "",
        Sex: "Male",
        Age: "",
        Height: "",
        Weight: "",
        Hypertension: "No",
        Diabetes: "No",
        BMI: "",
        Activity_Level: "Sedentary",
        Experience_Level: "Beginner",
        Fitness_Goal: "Weight Loss",
        phoneNumber: "",
        Email: "",
    });

    const [loading, setLoading] = useState(false);

    const calculateCalories = (data) => {
        const { Weight, Height, Age, Sex, Activity_Level } = data;
        if (!Weight || !Height || !Age) return 0;

        const weight = parseFloat(Weight);
        const height = parseFloat(Height);
        const age = parseInt(Age);

        let bmr = Sex === "Male" ? 10 * weight + 6.25 * height - 5 * age + 5 : 10 * weight + 6.25 * height - 5 * age - 161;
        const activityFactor = {
            "Sedentary": 1.2,
            "Lightly Active": 1.375,
            "Moderately Active": 1.55,
            "Very Active": 1.725,
            "Extra Active": 1.9
        }[Activity_Level] || 1.2;

        return Math.round(bmr * activityFactor);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        if (name === "DOB") {
            const birthDate = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();
            if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
            updatedFormData.Age = age || 0;
        }

        if ((name === "Height" || name === "Weight") && updatedFormData.Height && updatedFormData.Weight) {
            const heightInMeters = parseFloat(updatedFormData.Height) / 100;
            const weight = parseFloat(updatedFormData.Weight);
            updatedFormData.BMI = heightInMeters > 0 && weight > 0 ? (weight / (heightInMeters * heightInMeters)).toFixed(1) : 0;
        }

        setFormData(updatedFormData);

        if (updatedFormData.Height && updatedFormData.Weight && updatedFormData.Age && updatedFormData.Sex && updatedFormData.Activity_Level) {
            const calories = calculateCalories(updatedFormData);
            setCalories(calories);
            fetchPreview({ ...updatedFormData, Calories: calories });
        }
    };

    const fetchPreview = async (data) => {
        try {
            const response = await axios.post("https://ai-personal-workout-recommender.onrender.com/", {
                Sex: data.Sex,
                Age: data.Age,
                Height: data.Height,
                Weight: data.Weight,
                Hypertension: data.Hypertension,
                Diabetes: data.Diabetes,
                BMI: data.BMI,
                Fitness_Goal: data.Fitness_Goal,
                Experience_Level: data.Experience_Level,
                Activity_Level: data.Activity_Level
            });
            setPreview(response.data);
        } catch (error) {
            console.error("Preview error:", error.response?.data || error);
            setPreview(null);
            setErrorMsg(error.response?.data?.detail || "Failed to fetch preview.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        try {
            if (!formData.Email) throw new Error("Email is required");
            const Calories = calculateCalories(formData);
            const completeFormData = { ...formData, Calories };
            console.log("Sending data:", completeFormData);
            const response = await axios.post("http://127.0.0.1:8000/", {
                Sex: completeFormData.Sex,
                Age: completeFormData.Age,
                Height: completeFormData.Height,
                Weight: completeFormData.Weight,
                Hypertension: completeFormData.Hypertension,
                Diabetes: completeFormData.Diabetes,
                BMI: completeFormData.BMI,
                Fitness_Goal: completeFormData.Fitness_Goal,
                Experience_Level: completeFormData.Experience_Level,
                Activity_Level: completeFormData.Activity_Level
            });
            navigate("/result", { state: { formData: completeFormData, result: response.data } });
        } catch (error) {
            const errorMsg = error.response?.data?.detail || error.message || "Failed to connect to the backend. Please check if FastAPI is running.";
            console.error("Error:", errorMsg);
            setErrorMsg(errorMsg);
        }
        setLoading(false);
    };

    const bmi = parseFloat(formData.BMI) || 0;
    const bmiPosition = Math.min(Math.max((bmi / 40) * 100, 0), 100);
    const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";

    return (
        <div className="container mt-5">
            <div className="d-flex justify-content-end mb-3">
                <select
                    className="form-select lang-select shadow-sm"
                    onChange={(e) => setLanguage(e.target.value)}
                    value={language}
                >
                    <option value="en">English</option>
                    <option value="ta">தமிழ்</option>
                </select>
            </div>
            <div className="card shadow-lg border-0 fitness-card">
                <div className="card-header text-white text-center py-4">
                    <h2 className="fw-bold">
                        <i className="fas fa-dumbbell me-2"></i> {t.title}
                    </h2>
                </div>
                <div className="card-body p-5">
                    <form onSubmit={handleSubmit} className="p-3">
                        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
                        {preview && (
                            <div className="alert alert-info">
                                Predicted Level: {preview.Level || "N/A"} | Calories: {Calories}
                            </div>
                        )}
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.name}</label>
                                <input
                                    type="text"
                                    name="Name"
                                    className="form-control shadow-sm"
                                    value={formData.Name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.dob}</label>
                                <input
                                    type="date"
                                    name="DOB"
                                    className="form-control shadow-sm"
                                    value={formData.DOB}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.sex}</label>
                                <select
                                    name="Sex"
                                    className="form-select shadow-sm"
                                    value={formData.Sex}
                                    onChange={handleChange}
                                >
                                    <option value="Male">{t.male}</option>
                                    <option value="Female">{t.female}</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.age}</label>
                                <input
                                    type="number"
                                    name="Age"
                                    className="form-control shadow-sm"
                                    value={formData.Age}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.height}</label>
                                <input
                                    type="number"
                                    name="Height"
                                    className="form-control shadow-sm"
                                    value={formData.Height}
                                    onChange={handleChange}
                                    required
                                    min="100"
                                    max="250"
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.weight}</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    name="Weight"
                                    className="form-control shadow-sm"
                                    value={formData.Weight}
                                    onChange={handleChange}
                                    required
                                    min="10"
                                    max="200"
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.hypertension}</label>
                                <select
                                    name="Hypertension"
                                    className="form-select shadow-sm"
                                    value={formData.Hypertension}
                                    onChange={handleChange}
                                >
                                    <option value="No">{t.no}</option>
                                    <option value="Yes">{t.yes}</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.diabetes}</label>
                                <select
                                    name="Diabetes"
                                    className="form-select shadow-sm"
                                    value={formData.Diabetes}
                                    onChange={handleChange}
                                >
                                    <option value="No">{t.no}</option>
                                    <option value="Yes">{t.yes}</option>
                                </select>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.activity_level}</label>
                                <select
                                    name="Activity_Level"
                                    className="form-select shadow-sm"
                                    value={formData.Activity_Level}
                                    onChange={handleChange}
                                >
                                    <option value="Sedentary">{t.sedentary}</option>
                                    <option value="Lightly Active">{t.lessactive}</option>
                                    <option value="Moderately Active">{t.moderate}</option>
                                    <option value="Very Active">{t.active}</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.fitness_goal}</label>
                                <select
                                    name="Fitness_Goal"
                                    className="form-select shadow-sm"
                                    value={formData.Fitness_Goal}
                                    onChange={handleChange}
                                >
                                    <option value="Weight Loss">{t.weight_loss}</option>
                                    <option value="Weight Gain">{t.weight_gain}</option>
                                </select>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.Experience_Level}</label>
                                <select
                                    name="Experience_Level"
                                    className="form-select shadow-sm"
                                    value={formData.Experience_Level}
                                    onChange={handleChange}
                                >
                                    <option value="Beginner">{t.Beginner}</option>
                                    <option value="Intermediate">{t.Intermediate}</option>
                                    <option value="Advanced">{t.Advanced}</option>
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.Calories}</label>
                                <input
                                    type="number"
                                    name="Calories"
                                    className="form-control shadow-sm"
                                    value={Calories}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.phone}</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    className="form-control shadow-sm"
                                    placeholder={t.Enter}
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t.Email}</label>
                                <input
                                    type="email"
                                    name="Email"
                                    className="form-control shadow-sm"
                                    placeholder={t.Email}
                                    value={formData.Email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12 mb-3">
                                <label className="form-label">{t.bmi}</label>
                                <div className="bmi-meter-container">
                                    <div className="bmi-meter">
                                        <div className="bmi-range" style={{ width: "46.25%", left: "0", background: "#00b7eb" }}></div>
                                        <div className="bmi-range" style={{ width: "16%", left: "46.25%", background: "#00cc00" }}></div>
                                        <div className="bmi-range" style={{ width: "12.5%", left: "62.25%", background: "#ffcc00" }}></div>
                                        <div className="bmi-range" style={{ width: "25.25%", left: "74.75%", background: "#ff0000" }}></div>
                                        <div className="bmi-pointer" style={{ left: `${bmiPosition}%`, transform: "translateX(-50%)" }}></div>
                                    </div>
                                </div>
                                <div className="bmi-labels">
                                    <span>0</span>
                                    <span>18.5</span>
                                    <span>25</span>
                                    <span>30</span>
                                    <span>40</span>
                                </div>
                                <div style={{ textAlign: "center", fontSize: "12px", marginTop: "5px" }}>
                                    <p>Your BMI: {bmi ? `${bmi} - ${bmiCategory}` : "N/A"}</p>
                                    <p style={{ margin: "2px 0" }}>
                                        <span style={{ color: "#00b7eb" }}>Underweight</span>: {"<"}18.5 |
                                        <span style={{ color: "#00cc00" }}>Normal</span>: 18.5-24.9 |
                                        <span style={{ color: "#ffcc00" }}>Overweight</span>: 25-29.9 |
                                        <span style={{ color: "#ff0000" }}>Obese</span>: 30+
                                    </p>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary mt-4 w-100 shadow"
                            disabled={loading}
                        >
                            {loading ? (
                                <><i className="fas fa-spinner fa-spin me-2"></i> Processing...</>
                            ) : (
                                <><i className="fas fa-check me-2"></i> {t.submit}</>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/result" element={<ResultPage />} />
            </Routes>
        </Router>
    );
}

export default App;
