import { useState } from "react";
import axios from "axios";

function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const userData = { username, password };  // Create the userData object

    try {
      const response = await axios.post('http://localhost:8000/api/auth/signup/', userData);

      // Ensure the response has the 'data' field
      if (response && response.data) {
        console.log(response.data);  // Successful signup
        // Proceed with user data or success message
      } else {
        console.error('Unexpected response:', response);
      }
    } catch (error) {
      // Handle error if there is an issue with the API request
      console.error('Error during signup:', error);
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
      <button onClick={handleSignup}>Signup</button>
    </div>
  );
}

export default Signup;
