import { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup, Spinner, Table, Badge, Modal } from 'react-bootstrap';
import { FaUser, FaLock, FaUserTag, FaSignInAlt, FaEye, FaEyeSlash, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import RoleBasedNavBar from '../components/RoleBasedNavBar';
import { getUserRole } from '../utils/auth';

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

  // User list state variables
  const [users, setUsers] = useState([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [userListError, setUserListError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState(getUserRole());

  // Edit user modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editPasswordError, setEditPasswordError] = useState("");

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Function to fetch users
  const fetchUsers = async () => {
    // Only fetch users if the current user is an Owner
    if (userRole !== 'Owner') {
      return;
    }

    setUserListLoading(true);
    setUserListError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserListError("You must be logged in to view users");
        setUserListLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:8000/api/auth/users/', {
        headers: {
          'Authorization': `JWT ${token}`
        }
      });

      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUserListError(
        error.response?.data?.error ||
        "Failed to load users. Please try again."
      );
    } finally {
      setUserListLoading(false);
    }
  };

  // Effect to load users when component mounts if user is Owner
  useEffect(() => {
    if (userRole === 'Owner') {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

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

        // Refresh user list if owner is logged in
        if (userRole === 'Owner') {
          fetchUsers();
        }
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

  // Function to handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role_name && user.role_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle edit user (change password)
  const handleEditUser = (user) => {
    setEditUser(user);
    setEditPassword("");
    setEditConfirmPassword("");
    setEditError("");
    setShowEditModal(true);
  };

  // Validate password
  const validateEditPassword = (password) => {
    if (!password) {
      setEditError("Password is required");
      return false;
    } else if (password.length < 6) {
      setEditError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  // Validate confirm password
  const validateEditConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
      setEditError("Please confirm your password");
      return false;
    } else if (confirmPassword !== password) {
      setEditError("Passwords do not match");
      return false;
    }
    return true;
  };

  // Handle save edited user (change password)
  const handleSaveEdit = async () => {
    // Validate passwords
    if (!validateEditPassword(editPassword) ||
        !validateEditConfirmPassword(editPassword, editConfirmPassword)) {
      return;
    }

    setEditLoading(true);
    setEditError("");

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setEditError("You must be logged in to change user password");
        setEditLoading(false);
        return;
      }

      const userData = {
        password: editPassword
      };

      await axios.put(`http://localhost:8000/api/auth/users/${editUser.id}/`, userData, {
        headers: {
          'Authorization': `JWT ${token}`
        }
      });

      // Refresh user list
      fetchUsers();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating user password:", error);
      setEditError(
        error.response?.data?.error ||
        "Failed to update password. Please try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    setDeleteLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setShowDeleteModal(false);
        setDeleteLoading(false);
        return;
      }

      await axios.delete(`http://localhost:8000/api/auth/users/${deleteUserId}/`, {
        headers: {
          'Authorization': `JWT ${token}`
        }
      });

      // Refresh user list
      fetchUsers();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setDeleteLoading(false);
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
        <Container fluid>
          <Row>
            <Col md={12}>
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

                  {/* User List Section - Only visible to Owners */}
                  {userRole === 'Owner' && (
                    <div className="mt-5">
                      <h4 className="mb-3">User List</h4>
                      <div className="mb-3">
                        <InputGroup>
                          <InputGroup.Text>
                            <FaSearch />
                          </InputGroup.Text>
                          <Form.Control
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={handleSearch}
                          />
                        </InputGroup>
                      </div>

                      {userListLoading ? (
                        <div className="text-center p-4">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2">Loading users...</p>
                        </div>
                      ) : userListError ? (
                        <Alert variant="danger">{userListError}</Alert>
                      ) : (
                        <Table hover responsive className="mb-0">
                          <thead>
                            <tr>
                              <th>Username</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th>Joined</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map(user => (
                                <tr key={user.id}>
                                  <td>{user.username}</td>
                                  <td>
                                    <Badge bg={
                                      user.role_name === 'Owner' ? 'danger' :
                                      user.role_name === 'Inventory Manager' ? 'success' :
                                      user.role_name === 'Sales Team' ? 'info' :
                                      user.role_name === 'Order Coordinator' ? 'warning' :
                                      'secondary'
                                    }>
                                      {user.role_name || 'No Role'}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={user.is_active ? 'success' : 'danger'}>
                                      {user.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </td>
                                  <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                                  <td>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => handleEditUser(user)}
                                    >
                                      <FaEdit className="me-1" /> Change Password
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      <FaTrash className="me-1" /> Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center">
                                  {searchTerm ? 'No users match your search' : 'No users found'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      )}
                    </div>
                  )}
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

      {/* Change Password Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editError && <Alert variant="danger">{editError}</Alert>}

          <Form>
            {editUser && (
              <p className="mb-3">
                Changing password for user: <strong>{editUser.username}</strong>
              </p>
            )}

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <Form.Text className="text-muted">
                Password must be at least 6 characters long
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                value={editConfirmPassword}
                onChange={(e) => setEditConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            disabled={editLoading}
          >
            {editLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : "Change Password"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this user? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Deleting...
              </>
            ) : "Delete User"}
          </Button>
        </Modal.Footer>
      </Modal>

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
