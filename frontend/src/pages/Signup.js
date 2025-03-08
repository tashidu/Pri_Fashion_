import { useState } from "react";
import axios from "axios";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(""); // Add role state

  const handleSignup = async () => {
    const userData = { username, password, role }; // Include role in userData

    try {
      const response = await axios.post('http://localhost:8000/api/auth/signup/', userData);

      if (response && response.data) {
        console.log(response.data);  // Successful signup
        alert("Signup successful!");
      } else {
        console.error("Unexpected response:", response);
      }
    } catch (error) {
      console.error("Error during signup:", error);
    }
  };

  return (
    <div>
      <h2>Signup</h2>
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
      
      {/* Role selection dropdown */}
      <select onChange={(e) => setRole(e.target.value)}>
        <option value="">Select Role</option>
        <option value="Owner">Owner</option>
        <option value="Inventory Manager">Inventory Manager</option>
        <option value="Sales Team">Sales Team</option>
        <option value="Order Coordinator">Order Coordinator</option>
      </select>

      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;
