import { useState } from "react";
import axios from "axios";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await axios.post("http://127.0.0.1:8000/api/auth/login/", { username, password });
            localStorage.setItem("token", response.data.access);
            localStorage.setItem("role", response.data.role); // Store role in localStorage
            alert("Login successful!");

            // Optionally, you can redirect the user based on their role
            if (response.data.role === "Owner") {
                window.location.href = "/owner-dashboard"; // Example redirect for Owner
            } else if (response.data.role === "Inventory Manager") {
                window.location.href = "/inventory-dashboard"; // Example redirect
            } else if (response.data.role === "Order Coordinator") {
                window.location.href = "/orders-dashboard"; // Example redirect
            } else if (response.data.role === "Sales Team") {
                window.location.href = "/sales-dashboard"; // Example redirect
            }
        } catch (error) {
            alert("Login failed: " + error.response.data.error);
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
        </div>
    );
}

export default Login;
