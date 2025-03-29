import { useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import OwnerNavBar from '../components/OwnerNavBar';

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
    <>
      {/* Sidebar */}
      <OwnerNavBar />

      {/* Main Content */}
      <div className="container mt-5" style={{ marginLeft: "200px", transition: "margin-left 0.3s ease" }}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-center mb-4">New Registration</h2>
                <div className="form-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <select
                    className="form-control"
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="">Select Role</option>
                    <option value="Owner">Owner</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Sales Team">Sales Team</option>
                    <option value="Order Coordinator">Order Coordinator</option>
                  </select>
                </div>
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleSignup}
                >
                  Signup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;
