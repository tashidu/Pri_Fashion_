import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, Spinner } from 'react-bootstrap';
import { FaUser, FaLock, FaUserTag, FaSignInAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import RoleBasedNavBar from '../components/RoleBasedNavBar';

function Signup() {
  // State variables
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validated, setValidated] = useState(false);

  // Form validation errors
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [roleError, setRoleError] = useState("");

  // Effect to handle sidebar state based on window size
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Validate username
  const validateUsername = (username) => {
    if (!username || username.trim() === "") {
      setUsernameError("Username is required");
      return false;
    } else if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return false;
    }
    setUsernameError("");
    return true;
  };

  // Validate password
  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Validate confirm password
  const validateConfirmPassword = (confirmPassword) => {
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    }
    setConfirmPasswordError("");
    return true;
  };

  // Validate role
  const validateRole = (role) => {
    if (!role) {
      setRoleError("Please select a role");
      return false;
    }
    setRoleError("");
    return true;
  };

  // Handle form submission
  const handleSignup = async (e) => {
    e.preventDefault();

    // Reset messages
    setError("");
    setSuccess("");

    // Validate form
    const isUsernameValid = validateUsername(username);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    const isRoleValid = validateRole(role);

    if (!isUsernameValid || !isPasswordValid || !isConfirmPasswordValid || !isRoleValid) {
      setValidated(true);
      return;
    }

    setLoading(true);
    const userData = { username, password, role };

    try {
      const response = await axios.post('http://localhost:8000/api/auth/signup/', userData);

      if (response && response.data) {
        setSuccess("Registration successful! You can now log in.");
        // Reset form
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRole("");
        setValidated(false);
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.error || "Registration failed. Please try again.");
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <RoleBasedNavBar />

      {/* Main Content */}
      <div className="main-content" style={{
        marginLeft: isSidebarOpen ? "200px" : "60px",
        transition: "margin-left 0.3s ease",
        paddingTop: "20px"
      }}>
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
              <Card className="shadow-sm border-0 animate-fade-in">
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <h2 className="fw-bold text-primary">New Registration</h2>
                    <p className="text-muted">Create your account to access the system</p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="mb-4 animate-fade-in">
                      {error}
                    </Alert>
                  )}

                  {success && (
                    <Alert variant="success" className="mb-4 animate-fade-in">
                      {success}
                    </Alert>
                  )}

                  <Form noValidate validated={validated} onSubmit={handleSignup}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaUser className="text-primary" />
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            validateUsername(e.target.value);
                          }}
                          isInvalid={!!usernameError}
                          required
                        />
                        <Form.Control.Feedback type="invalid">
                          {usernameError || "Username is required"}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaLock className="text-primary" />
                        </InputGroup.Text>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            validatePassword(e.target.value);
                          }}
                          isInvalid={!!passwordError}
                          required
                        />
                        <Button
                          variant="light"
                          onClick={() => setShowPassword(!showPassword)}
                          className="border"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {passwordError || "Password is required"}
                        </Form.Control.Feedback>
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Password must be at least 6 characters long
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaLock className="text-primary" />
                        </InputGroup.Text>
                        <Form.Control
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            validateConfirmPassword(e.target.value);
                          }}
                          isInvalid={!!confirmPasswordError}
                          required
                        />
                        <Button
                          variant="light"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="border"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {confirmPasswordError || "Please confirm your password"}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Role</Form.Label>
                      <InputGroup>
                        <InputGroup.Text className="bg-light">
                          <FaUserTag className="text-primary" />
                        </InputGroup.Text>
                        <Form.Select
                          value={role}
                          onChange={(e) => {
                            setRole(e.target.value);
                            validateRole(e.target.value);
                          }}
                          isInvalid={!!roleError}
                          required
                        >
                          <option value="">Select Role</option>
                          <option value="Owner">Owner</option>
                          <option value="Inventory Manager">Inventory Manager</option>
                          <option value="Sales Team">Sales Team</option>
                          <option value="Order Coordinator">Order Coordinator</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {roleError || "Please select a role"}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-2 mb-3 animate-button"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Registering...
                        </>
                      ) : (
                        <>
                          <FaSignInAlt className="me-2" /> Register
                        </>
                      )}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
              <div className="text-center mt-3">
                <p className="text-muted small">
                  &copy; {new Date().getFullYear()} Pri Fashion. All rights reserved.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Custom CSS with animations */}
      <style jsx="true">{`
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-button {
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .animate-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

export default Signup;
