import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { setUserRole } from "../utils/auth";
import {
  Container, Row, Col, Form, Button,
  InputGroup, Alert, Spinner
} from 'react-bootstrap';
import {
  FaUser, FaLock, FaSignInAlt, FaTshirt,
  FaBoxes
} from 'react-icons/fa';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    // Check for saved credentials on component mount
    useEffect(() => {
        const savedUsername = localStorage.getItem("rememberedUsername");
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!username || !password) {
            setError("Username and password are required!");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("http://127.0.0.1:8000/api/auth/login/", { username, password });

            // Handle remember me functionality
            if (rememberMe) {
                localStorage.setItem("rememberedUsername", username);
            } else {
                localStorage.removeItem("rememberedUsername");
            }

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
            setLoading(false);
        }
    };



    return (
        <div className="login-page">
            <Container fluid className="p-0 m-0">
                <Row className="g-0 min-vh-100">
                    {/* Left side - decorative panel */}
                    <Col md={6} className="d-none d-md-flex bg-primary position-relative">
                        <div className="login-left-panel d-flex flex-column justify-content-center align-items-center text-white p-5">
                            <div className="text-center mb-5">
                                <FaTshirt className="mb-3 animate-logo-spin" style={{ fontSize: '5rem', opacity: 0.9 }} />
                                <h1 className="display-4 fw-bold animate-fade-in" style={{ animationDelay: '0.2s' }}>Pri Fashion</h1>
                                <p className="lead animate-fade-in" style={{ animationDelay: '0.4s' }}>Garment Management System</p>
                            </div>

                        </div>

                        {/* Decorative shapes with animation */}
                        <div className="position-absolute top-0 end-0 mt-4 me-4 d-none d-lg-block">
                            <div className="bg-white opacity-25 rounded-circle animate-float" style={{ width: '150px', height: '150px' }}></div>
                        </div>
                        <div className="position-absolute bottom-0 start-0 mb-4 ms-4 d-none d-lg-block">
                            <div className="bg-white opacity-25 rounded-circle animate-float-reverse" style={{ width: '100px', height: '100px' }}></div>
                        </div>
                    </Col>

                    {/* Right side - login form */}
                    <Col md={6} className="d-flex align-items-center justify-content-center">
                        <div className="login-form-container p-4 p-md-5" style={{ maxWidth: '500px', width: '100%' }}>
                            <div className="text-center mb-4">
                                <img
                                    src="/logo.jpg"
                                    alt="Pri Fashion Logo"
                                    className="mb-3 shadow-sm animate-logo"
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '12px',
                                        objectFit: 'cover'
                                    }}
                                />
                                <h2 className="fw-bold text-primary animate-fade-in" style={{ animationDelay: '0.3s' }}>Welcome Back</h2>
                                <p className="text-muted animate-fade-in" style={{ animationDelay: '0.5s' }}>Sign in to your account</p>
                            </div>

                            {error && (
                                <Alert variant="danger" className="mb-4">
                                    {error}
                                </Alert>
                            )}

                            <Form onSubmit={handleLogin}>
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
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Password</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text className="bg-light">
                                            <FaLock className="text-primary" />
                                        </InputGroup.Text>
                                        <Form.Control
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <Button
                                            variant="light"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="border"
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </Button>
                                    </InputGroup>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Check
                                        type="checkbox"
                                        label="Remember my username"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    type="submit"
                                    className="w-100 py-2 mb-3 animate-button"
                                    disabled={loading || !username || !password}
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
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            <FaSignInAlt className="me-2" /> Sign In
                                        </>
                                    )}
                                </Button>

                                <div className="text-center mt-4">
                                    <p className="text-muted small">
                                        &copy; {new Date().getFullYear()} Pri Fashion. All rights reserved.
                                    </p>
                                </div>
                            </Form>
                        </div>
                    </Col>
                </Row>
            </Container>

            {/* Custom CSS with animations */}
            <style jsx="true">{`
                .login-page {
                    min-height: 100vh;
                    background-color: #f8f9fa;
                }

                .login-left-panel {
                    background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
                    height: 100%;
                }

                .feature-icon {
                    width: 45px;
                    height: 45px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Animation keyframes */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }

                @keyframes floatReverse {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(15px); }
                    100% { transform: translateY(0px); }
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }

                @keyframes slideInFromLeft {
                    from { opacity: 0; transform: translateX(-30px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Animation classes */
                .animate-feature {
                    animation: slideInFromLeft 0.6s ease-out forwards;
                    opacity: 0;
                }

                .animate-fade-in {
                    animation: fadeIn 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }

                .animate-float-reverse {
                    animation: floatReverse 7s ease-in-out infinite;
                }

                .animate-logo {
                    animation: pulse 2s ease-in-out infinite;
                }

                .animate-logo-spin {
                    animation: spin 20s linear infinite;
                    transform-origin: center;
                }

                .animate-button {
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .animate-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                }

                @media (max-width: 767.98px) {
                    .login-form-container {
                        padding: 2rem !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default Login;
