import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import axios from "axios";
import confetti from "canvas-confetti";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDumbbell, faFilePdf, faSms, faArrowLeft, faEnvelope, faBolt, faUndo } from "@fortawesome/free-solid-svg-icons";
import "./ResultPage.css";

const ResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { formData, result: initialResult } = location.state || {};

    const [isLoadingSMS, setIsLoadingSMS] = useState(false);
    const [isLoadingEmail, setIsLoadingEmail] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [messages, setMessages] = useState([{
        text: "⚡ Welcome to your Fitness Boost! Click 'Optimize Plan' to enhance your fitness output or ask me anything about your plan!",
        sender: "bot"
    }]);
    const [chatInput, setChatInput] = useState("");
    const [originalResult] = useState(initialResult);
    const [optimizedResult, setOptimizedResult] = useState(initialResult);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isOptimized, setIsOptimized] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    if (!formData || !initialResult) {
        return <h2 className="text-center mt-5">No results found. Please go back and generate a recommendation.</h2>;
    }

    const downloadPDF = () => {
        const doc = new jsPDF({
            unit: "mm",
            format: "a4",
            margins: { top: 15, bottom: 15, left: 15, right: 15 },
        });

        doc.setFillColor(255, 99, 71);
        doc.rect(0, 0, 210, 20, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text("Personalized Fitness Plan", 15, 15);

        let y = 25;

        doc.setFillColor(230, 240, 255);
        doc.rect(15, y, 180, 8, "F");
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.setFont("helvetica", "bold");
        doc.text("User Information", 20, y + 6);
        y += 12;

        doc.setFontSize(11);
        const userDetails = [
            ["Name", formData.Name],
            ["DOB", formData.DOB],
            ["Sex", formData.Sex],
            ["Age", formData.Age],
            ["Height (cm)", formData.Height],
            ["Weight (kg)", formData.Weight],
            ["BMI", formData.BMI],
            ["Diabetes", formData.Diabetes],
            ["Hypertension", formData.Hypertension],
            ["Fitness Goal", formData.Fitness_Goal],
            ["Activity Level", formData.Activity_Level],
            ["Experience Level", formData.Experience_Level],
            ["Calories (Kcal)", formData.Calories || "N/A"],
            ["Phone Number", formData.phoneNumber],
            ["Email", formData.Email],
        ];

        let xLeft = 20, xRight = 105;
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.2);
        userDetails.forEach(([label, value], index) => {
            let x = index < 8 ? xLeft : xRight;
            let yPos = y + (index % 8) * 10;
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 51, 102);
            doc.text(`${label}:`, x, yPos);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const wrappedValue = doc.splitTextToSize(`${value || "N/A"}`, 75);
            doc.text(wrappedValue, x + 35, yPos);
            if (yPos > 260) {
                doc.addPage();
                y = 15;
                yPos = y + (index % 8) * 10;
            }
        });

        y += 85;

        if (y > 260) {
            doc.addPage();
            y = 15;
        }
        doc.setFillColor(200, 230, 201);
        doc.rect(15, y, 180, 8, "F");
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Fitness Plan", 20, y + 6);
        y += 12;

        doc.setFontSize(11);
        const fitnessDetails = [
            ["Recommended Level", `${optimizedResult.Level} (BMI: ${formData.BMI})`],
            ["Exercises", optimizedResult.Exercises],
            ["Equipment", optimizedResult.Equipment],
            ["Diet", optimizedResult.Diet],
        ];

        fitnessDetails.forEach(([label, value]) => {
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 100, 0);
            doc.text(`${label}:`, 20, y);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            const wrappedText = doc.splitTextToSize(`${value || "N/A"}`, 170);
            doc.text(wrappedText, 25, y + 5);
            y += wrappedText.length * 7 + 8;
            doc.line(15, y - 4, 195, y - 4);
            if (y > 260) {
                doc.addPage();
                y = 15;
            }
        });

        if (y > 260) {
            doc.addPage();
            y = 15;
        }
        doc.setFillColor(255, 204, 204);
        doc.rect(15, y, 180, 8, "F");
        doc.setFontSize(14);
        doc.setTextColor(204, 0, 102);
        doc.setFont("helvetica", "bold");
        doc.text("Recommendations", 20, y + 6);
        y += 12;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);

        const recommendations = (optimizedResult.Recommendation || "N/A")
            .split(". ")
            .filter(Boolean)
            .map(sentence => `• ${sentence.trim()}.`);

        const formattedText = doc.splitTextToSize(recommendations.join("\n"), 170);
        doc.text(formattedText, 20, y);

        doc.save("Fitness_Plan.pdf");
    };

    const sendSMS = async () => {
        if (!formData.phoneNumber.startsWith("+")) {
            setErrorMsg("Phone number must include a country code (e.g., +1234567890)");
            return;
        }

        const phoneNumber = formData.phoneNumber.replace(/\s/g, "");
        if (!/^\+\d{10,15}$/.test(phoneNumber)) {
            setErrorMsg("Invalid phone number format. Please use E.164 format (e.g., +1234567890).");
            return;
        }

        const message = `📢 Your Fitness Plan 📢\n
        🏋️ Goal: ${formData.Fitness_Goal}\n
        👤 Age: ${formData.Age} | Sex: ${formData.Sex}\n
        📏 Height: ${formData.Height} cm | ⚖️ Weight: ${formData.Weight} kg\n
        📊 BMI: ${formData.BMI} | Diabetes: ${formData.Diabetes} | Hypertension: ${formData.Hypertension}\n
        🔥 Workout Level: ${optimizedResult.Level} (BMI: ${formData.BMI})\n
        🏃 Exercises: ${optimizedResult.Exercises}\n
        🏋️ Equipment: ${optimizedResult.Equipment}\n
        🍎 Diet: ${optimizedResult.Diet}\n
        Stay Fit & Healthy! 💪`.replace(/\s+/g, " ");

        setIsLoadingSMS(true);
        try {
            const response = await axios.post("https://ai-personal-workout-recommender.onrender.com/send_sms/", {
                phone_number: phoneNumber,
                message
            });
            console.log("SMS sent:", response.data);
            setErrorMsg(null);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (error) {
            console.error("❌ Error sending SMS:", error.response?.data || error);
            setErrorMsg(`Failed to send SMS: ${error.response?.data?.detail || error.message}`);
        }
        setIsLoadingSMS(false);
    };

    const sendEmail = async () => {
        const email = formData.Email;
        if (!email) {
            setErrorMsg("Email address is missing.");
            return;
        }

        const emailData = {
            recipient_email: email,
            subject: "Your Personalized Fitness Plan",
            body: `🏋️ Goal: ${formData.Fitness_Goal}
                    👤 Age: ${formData.Age} | Sex: ${formData.Sex}
                    📏 Height: ${formData.Height} cm | ⚖️ Weight: ${formData.Weight} kg
                    📊 BMI: ${formData.BMI} | Diabetes: ${formData.Diabetes} | Hypertension: ${formData.Hypertension}
                    🔥 Workout Level: ${optimizedResult.Level} (BMI: ${formData.BMI})
                    🏃 Exercises: ${optimizedResult.Exercises}
                    🏋️ Equipment: ${optimizedResult.Equipment}
                    🍎 Diet: ${optimizedResult.Diet}\n
                   Stay Fit & Healthy! 💪`,
        };

        setIsLoadingEmail(true);
        try {
            const response = await axios.post("https://ai-personal-workout-recommender.onrender.com/send_email/", emailData);
            console.log("Email sent:", response.data);
            setErrorMsg(null);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } catch (error) {
            console.error("Email request failed:", error.response?.data || error);
            setErrorMsg(`Failed to send email: ${error.response?.data?.detail || error.message}`);
        }
        setIsLoadingEmail(false);
    };

    const optimizePlan = async () => {
        setIsOptimizing(true);
        const apiKey = "AIzaSyBv-JyT31LmIcEuVqJBvHfv2qezyTbPYG0"; // Replace with your actual Gemini API key

        try {
            const rawOutput = `Level: ${optimizedResult.Level}\nExercises: ${optimizedResult.Exercises}\nEquipment: ${optimizedResult.Equipment}\nDiet: ${optimizedResult.Diet}\nRecommendation: ${optimizedResult.Recommendation}`;
            const response = await axios.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent",
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Optimize this fitness plan to enhance effectiveness and personalization, maintaining the original Level and providing specific Exercises, Equipment, and a detailed Diet structured like this example: Diet: Vegetables: (Carrots, Sweet Potato, and Lettuce); Protein Intake: (Red meats, poultry, fish, eggs, dairy products, legumes, and nuts); Juice: (Fruit juice, watermelon juice, carrot juice, apple juice and mango juice). Replace any "N/A" with appropriate content based on the Level. Keep the Recommendation detailed as provided.\n\nCurrent plan to optimize:\n${rawOutput}\n\nUser context: Goal: ${formData.Fitness_Goal}, Age: ${formData.Age}, Sex: ${formData.Sex}, BMI: ${formData.BMI}, Activity Level: ${formData.Activity_Level}, Experience Level: ${formData.Experience_Level}, Calories: ${formData.Calories || "Not specified"}`
                                },
                            ],
                        },
                    ],
                },
                {
                    headers: {
                        "x-goog-api-key": apiKey,
                        "Content-Type": "application/json",
                    },
                }
            );
            const optimizedText = response.data.candidates[0].content.parts[0].text.replace(/\*/g, "");
            console.log("Raw Gemini Response:", optimizedText);

            const newResult = { ...optimizedResult, Level: originalResult.Level };
            const lines = optimizedText.split("\n").filter(line => line.trim());
            let currentField = null;
            const fields = { Exercises: [], Equipment: [], Diet: [], Recommendation: [] };

            lines.forEach((line) => {
                if (line.toLowerCase().includes("exercises:")) {
                    currentField = "Exercises";
                    fields[currentField].push(line.replace(/.*exercises.*:/i, "").trim());
                } else if (line.toLowerCase().includes("equipment:")) {
                    currentField = "Equipment";
                    fields[currentField].push(line.replace(/.*equipment.*:/i, "").trim());
                } else if (line.toLowerCase().includes("diet:")) {
                    currentField = "Diet";
                    fields[currentField].push(line.replace(/.*diet.*:/i, "").trim());
                } else if (line.toLowerCase().includes("recommendation:")) {
                    currentField = "Recommendation";
                    fields[currentField].push(line.replace(/.*recommendation.*:/i, "").trim());
                } else if (currentField && line.trim()) {
                    fields[currentField].push(line.trim());
                }
            });

            newResult.Exercises = fields.Exercises.join("\n") || optimizedResult.Exercises;
            newResult.Equipment = fields.Equipment.join("\n") || optimizedResult.Equipment;
            newResult.Diet = fields.Diet.join("\n") || optimizedResult.Diet;
            newResult.Recommendation = fields.Recommendation.join("\n") || optimizedResult.Recommendation;

            setOptimizedResult({ ...newResult });
            setIsOptimized(true);
            setMessages(prev => [...prev, { text: "✨ Plan optimized successfully! Check your updated fitness plan above.", sender: "bot" }]);
        } catch (error) {
            console.error("Gemini API optimization error:", error.response ? error.response.data : error.message);
            setMessages(prev => [...prev, { text: "⚠️ Failed to optimize: " + (error.response ? error.response.data.error.message : error.message), sender: "bot" }]);
        } finally {
            setIsOptimizing(false);
        }
    };

    const revertToOriginal = () => {
        setOptimizedResult({ ...originalResult });
        setIsOptimized(false);
        setMessages(prev => [...prev, { text: "🔄 Reverted to your original fitness plan!", sender: "bot" }]);
    };

    const sendChatMessage = async () => {
        if (!chatInput.trim()) return;
        setMessages([...messages, { text: chatInput, sender: "user" }]);
        const messageLower = chatInput.toLowerCase();

        const apiKey = "AIzaSyBv-JyT31LmIcEuVqJBvHfv2qezyTbPYG0"; // Replace with your actual Gemini API key

        try {
            const response = await axios.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent",
                {
                    contents: [
                        {
                            parts: [
                                {
                                    text: `${chatInput}\n\nContext: User fitness plan - Level: ${optimizedResult.Level}, Exercises: ${optimizedResult.Exercises}, Diet: ${optimizedResult.Diet}, Goal: ${formData.Fitness_Goal}`
                                },
                            ],
                        },
                    ],
                },
                {
                    headers: {
                        "x-goog-api-key": apiKey,
                        "Content-Type": "application/json",
                    },
                }
            );
            const reply = response.data.candidates[0].content.parts[0].text;
            setMessages(prev => [...prev, { text: reply, sender: "bot" }]);
        } catch (error) {
            console.error("Gemini API query error:", error.response ? error.response.data : error.message);
            const fallbackResponses = {
                "how do i do squats": "Stand with feet shoulder-width apart, push your hips back, and lower your body until thighs are parallel to the ground. Keep your chest up!",
                "swap running": "You can replace running with cycling or swimming for a similar cardio effect.",
                "what’s my diet": `Your diet recommendation is: ${optimizedResult.Diet}.`,
                "help": "I can assist with exercises, diet, or plan adjustments. What do you need?"
            };
            const message = messageLower;
            const fallback = Object.entries(fallbackResponses).find(([key]) => message.includes(key));
            setMessages(prev => [...prev, { text: fallback ? fallback[1] : "Hmm, I’m not sure—try asking about exercises or diet!", sender: "bot" }]);
        }
        setChatInput("");
    };

    const formattedRecommendations = optimizedResult.Recommendation
        ? optimizedResult.Recommendation.split("\n").filter(line => line.trim()).map((line, index) => <li key={index}>{line}</li>)
        : null;

    return (
        <div className="container mt-4 mb-4">
            <div className="card shadow-lg border-0 fitness-card">
                <div className="card-header text-white text-center">
                    <h2 className="fw-bold">
                        <FontAwesomeIcon icon={faDumbbell} className="me-2" /> Your Personalized Fitness Plan
                    </h2>
                </div>
                <div className="card-body">
                    <h4 className="mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: "#333" }}>User Information</h4>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(formData).map(([key, value], index) => (
                                    <tr key={index}>
                                        <td>{key.replace(/_/g, " ")}</td>
                                        <td>{value || "N/A"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h4 className="mb-3" style={{ fontFamily: "'Poppins', sans-serif", color: "#333" }}>Fitness Plan & Recommendations</h4>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(optimizedResult).map(([key, value], index) => (
                                    <tr key={index}>
                                        <td>{key.replace(/_/g, " ")}</td>
                                        <td>
                                            {key === "Recommendation" && value ? (
                                                <ul className="recommendation-list">{formattedRecommendations}</ul>
                                            ) : (
                                                <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{value || "N/A"}</pre>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {errorMsg && <div className="alert alert-danger mt-3">{errorMsg}</div>}

                    <div className="d-flex justify-content-center btn-group mt-4">
                        <button className="pulse-btn btn-download" onClick={downloadPDF}>
                            <FontAwesomeIcon icon={faFilePdf} /> Download as PDF
                        </button>
                        <button
                            className="pulse-btn btn-sms"
                            onClick={sendSMS}
                            disabled={isLoadingSMS}
                        >
                            {isLoadingSMS ? <FontAwesomeIcon icon={faSms} spin /> : <FontAwesomeIcon icon={faSms} />}
                            Send as SMS
                        </button>
                        <button className="pulse-btn btn-back" onClick={() => navigate("/")}>
                            <FontAwesomeIcon icon={faArrowLeft} /> Go Back
                        </button>
                        <button
                            className="pulse-btn btn-email"
                            onClick={sendEmail}
                            disabled={isLoadingEmail}
                        >
                            {isLoadingEmail ? <FontAwesomeIcon icon={faEnvelope} spin /> : <FontAwesomeIcon icon={faEnvelope} />}
                            Send via Email
                        </button>
                        <button
                            className="pulse-btn btn-optimize"
                            onClick={optimizePlan}
                            disabled={isOptimizing}
                            style={{ background: "linear-gradient(135deg, #ff8c00, #ff4500)" }}
                        >
                            {isOptimizing ? <FontAwesomeIcon icon={faBolt} spin /> : <FontAwesomeIcon icon={faBolt} />}
                            Optimize Plan
                        </button>
                        <button
                            className="pulse-btn btn-revert"
                            onClick={revertToOriginal}
                            disabled={!isOptimized || isOptimizing}
                            style={{ background: "linear-gradient(135deg, #4682b4, #1e90ff)" }}
                        >
                            <FontAwesomeIcon icon={faUndo} /> Revert to Original
                        </button>
                    </div>
                </div>
            </div>

            <div className={`chat-panel ${chatOpen ? "chat-panel-open" : ""}`}>
                <div className="chat-panel-header">
                    <span>Fitness Boost</span>
                    <button className="chat-close-btn" onClick={() => setChatOpen(false)}>×</button>
                </div>
                <div className="chat-panel-body">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.sender === "user" ? "user-message" : "bot-message"}`}>
                            <span>{msg.text}</span>
                        </div>
                    ))}
                </div>
                <div className="chat-panel-input">
                    <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                        placeholder="Type your question..."
                    />
                    <button onClick={sendChatMessage}>➤</button>
                </div>
            </div>

            <div className="chat-toggle-btn" onClick={() => setChatOpen(!chatOpen)}>
                <FontAwesomeIcon icon={faBolt} className="chat-toggle-icon" />
            </div>
        </div>
    );
};

export default ResultPage;