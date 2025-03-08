import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // React Router's useNavigate hook for redirection

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate(); // Hook to navigate programmatically

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/auth/login/", { username, password });
            localStorage.setItem("token", response.data.access);
            localStorage.setItem("role", response.data.role); // Store role in localStorage
            alert("Login successful!");

            // Redirect based on the role
            const role = response.data.role;
            if (role === "Owner") {
                navigate("/owner-dashboard"); // Redirect to Owner Dashboard
            } else if (role === "Inventory Manager") {
                navigate("/inventory-dashboard"); // Redirect to Inventory Dashboard
            } else if (role === "Order Coordinator") {
                navigate("/orders-dashboard"); // Redirect to Order Dashboard
            } else if (role === "Sales Team") {
                navigate("/sales-dashboard"); // Redirect to Sales Dashboard
            }
        } catch (error) {
            alert("Login failed: " + error.response.data.error);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <input
                type="text"
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}

export default Login;
