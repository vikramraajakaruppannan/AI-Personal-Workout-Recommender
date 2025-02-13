import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    const [formData, setFormData] = useState({
        Sex: "Male",
        Age: "",
        Height: "",
        Weight: "",
        Hypertension: "No",
        Diabetes: "No",
        BMI: "",
        Fitness_Goal: "Weight Loss",  // Keep this consistent
    });
    

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let updatedFormData = { ...formData, [name]: value };

        if ((name === "Height" || name === "Weight") && updatedFormData.Height && updatedFormData.Weight) {
            const heightInMeters = parseFloat(updatedFormData.Height) / 100;
            const weight = parseFloat(updatedFormData.Weight);
            if (heightInMeters > 0 && weight > 0) {
                updatedFormData.BMI = (weight / (heightInMeters * heightInMeters)).toFixed(1);
            } else {
                updatedFormData.BMI = "";
            }
        }

        setFormData(updatedFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post("http://127.0.0.1:8000/predict", formData);
            setResult(response.data);
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to connect to the backend. Please check if FastAPI is running.");
        }
        setLoading(false);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Personalized Fitness Plan", 10, 10);
        
        let y = 20;
        const addMultiLineText = (label, value) => {
            const splitText = doc.splitTextToSize(`${label}: ${value}`, 180);
            doc.text(splitText, 10, y);
            y += splitText.length * 10;
        };

        addMultiLineText("Level", result.Level);
        addMultiLineText("Exercises", result.Exercises);
        addMultiLineText("Equipment", result.Equipment);
        addMultiLineText("Diet", result.Diet);
        addMultiLineText("Recommendation", result.Recommendation);
        
        doc.save("Fitness_Plan.pdf");
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center">🏋️‍♂️ AI Fitness Recommender</h2>
            <form onSubmit={handleSubmit} className="p-4 shadow rounded bg-light">
                <div className="row">
                    <div className="col-md-6">
                        <label>Sex</label>
                        <select name="Sex" className="form-control" onChange={handleChange}>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label>Age</label>
                        <input type="number" name="Age" className="form-control" onChange={handleChange} required />
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-md-6">
                        <label>Height (cm)</label>
                        <input type="number" name="Height" className="form-control" onChange={handleChange} required />
                    </div>
                    <div className="col-md-6">
                        <label>Weight (kg)</label>
                        <input type="number" step="0.1" name="Weight" className="form-control" onChange={handleChange} required />
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-md-6">
                        <label>Hypertension</label>
                        <select name="Hypertension" className="form-control" onChange={handleChange}>
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label>Diabetes</label>
                        <select name="Diabetes" className="form-control" onChange={handleChange}>
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                        </select>
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-md-6">
                        <label>BMI</label>
                        <input type="number" step="0.1" name="BMI" className="form-control" value={formData.BMI} readOnly />
                    </div>
                </div>

                <div className="mt-3">
                    <label>Fitness Goal</label>
                    <select name="Fitness_Goal" className="form-control" onChange={handleChange}>
                        <option value="Weight Loss">Weight Loss</option>
                        <option value="Weight Gain">Weight Gain</option>
                    </select>
                </div>

                <button type="submit" className="btn btn-primary mt-4 w-100">
                    {loading ? "Processing..." : "Get Recommendation"}
                </button>
            </form>

            {result && (
                <div className="results mt-4 p-3 shadow rounded bg-white">
                    <h2>Personalized Fitness Plan</h2>
                    <p><strong>Level:</strong> {result.Level}</p>
                    <p><strong>Exercises:</strong> {result.Exercises}</p>
                    <p><strong>Equipment:</strong> {result.Equipment}</p>
                    <p><strong>Diet:</strong> {result.Diet}</p>
                    <p><strong>Recommendation:</strong> {result.Recommendation}</p>
                    <button className="btn btn-success mt-3" onClick={downloadPDF}>Download as PDF</button>
                </div>
            )}
        </div>
    );
}

export default App;