import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setUserRole } from "../utils/auth";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError("Username and password are required!");
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/auth/login/", { username, password });
            localStorage.setItem("token", response.data.access);
            setUserRole(response.data.role);
            setError("");

            const roleRoutes = {
                "Owner": "/owner-dashboard",
                "Inventory Manager": "/inventory-dashboard",
                "Order Coordinator": "/orders-dashboard",
                "Sales Team": "/sales-dashboard"
            };
            navigate(roleRoutes[response.data.role] || "/");
        } catch (error) {
            setError(error.response?.data?.error || "Login failed. Please try again.");
        }
    };

    const styles = {
        container: {
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(to right, rgb(188, 212, 255), rgb(104, 158, 250))",
            padding: "20px",
        },
        card: {
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "15px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            width: "100%",
            maxWidth: "400px",
            textAlign: "center",
        },
        logo: {
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            marginBottom: "15px",
        },
        heading: {
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            color: "#333",
        },
        input: {
            width: "100%",
            padding: "12px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "16px",
            outline: "none",
        },
        button: {
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: "#4CAF50",
            cursor: "pointer",
            transition: "0.3s",
        },
        buttonDisabled: {
            backgroundColor: "#ccc",
            cursor: "not-allowed",
        },
        errorText: {
            color: "#ff4d4d",
            textAlign: "center",
            marginBottom: "10px",
            fontSize: "14px",
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <img src="/logo.jpg" alt="Logo" style={styles.logo} />
                <h2 style={styles.heading}>Login</h2>

                {error && <p style={styles.errorText}>{error}</p>}

                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                    />

                    <button
                        type="submit"
                        disabled={!username || !password}
                        style={{
                            ...styles.button,
                            ...( !username || !password ? styles.buttonDisabled : {}),
                        }}
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
