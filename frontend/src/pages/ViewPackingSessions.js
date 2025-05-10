import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import RoleBasedNavBar from "../components/RoleBasedNavBar";
import { Card, Table, Form, InputGroup, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { BsBoxSeam, BsSearch, BsCalendar, BsSortDown, BsSortUp, BsExclamationTriangle } from "react-icons/bs";

const ViewPackingSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  // Add resize event listener to update sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch packing sessions on component mount
  useEffect(() => {
    setLoading(true);
    axios
      .get("http://localhost:8000/api/packing/sessions/history/")
      .then((res) => {
        setSessions(res.data);
        setFilteredSessions(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching packing sessions:", err);
        setError("Failed to load packing sessions history.");
        setLoading(false);
      });
  }, []);

  // Filter and sort sessions when search term or sort parameters change
  useEffect(() => {
    let result = [...sessions];

    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(
        (session) =>
          session.product_name?.toLowerCase().includes(lowerCaseSearch) ||
          session.date_formatted?.toLowerCase().includes(lowerCaseSearch) ||
          session.total_packed_quantity?.toString().includes(lowerCaseSearch)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "date") {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortField === "product_name") {
        comparison = (a.product_name || "").localeCompare(b.product_name || "");
      } else if (sortField === "total_packed_quantity") {
        comparison = a.total_packed_quantity - b.total_packed_quantity;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    setFilteredSessions(result);
  }, [sessions, searchTerm, sortField, sortOrder]);

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <>
      <RoleBasedNavBar />
      <div
        style={{
          marginLeft: isSidebarOpen ? "240px" : "70px",
          width: `calc(100% - ${isSidebarOpen ? "240px" : "70px"})`,
          transition: "all 0.3s ease",
          padding: "20px"
        }}
      >
        <h2 className="mb-4">
          <BsBoxSeam className="me-2" />
          Packing Sessions History
        </h2>

        {error && (
          <Alert variant="danger" className="d-flex align-items-center">
            <BsExclamationTriangle className="me-2" size={20} />
            {error}
          </Alert>
        )}

        <Card className="mb-4 shadow-sm" style={{ backgroundColor: "#D9EDFB", borderRadius: "10px" }}>
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <InputGroup className="w-50">
                <InputGroup.Text>
                  <BsSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by product name or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Link to="/add-packing-session">
                <Button variant="primary">Add New Packing Session</Button>
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" className="mb-2" />
                <p>Loading packing sessions...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <Alert variant="info">
                No packing sessions found. {searchTerm && "Try adjusting your search."}
              </Alert>
            ) : (
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th 
                        onClick={() => handleSort("product_name")}
                        style={{ cursor: "pointer" }}
                      >
                        Product Name
                        {sortField === "product_name" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                      <th 
                        onClick={() => handleSort("date")}
                        style={{ cursor: "pointer" }}
                      >
                        Date
                        {sortField === "date" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                      <th>6-Packs</th>
                      <th>12-Packs</th>
                      <th>Extra Items</th>
                      <th 
                        onClick={() => handleSort("total_packed_quantity")}
                        style={{ cursor: "pointer" }}
                      >
                        Total Quantity
                        {sortField === "total_packed_quantity" && (
                          sortOrder === "asc" ? <BsSortUp className="ms-1" /> : <BsSortDown className="ms-1" />
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => (
                      <tr key={session.id}>
                        <td>{session.id}</td>
                        <td>{session.product_name}</td>
                        <td>
                          <BsCalendar className="me-1" />
                          {session.date_formatted}
                        </td>
                        <td>
                          {session.number_of_6_packs > 0 ? (
                            <Badge bg="info">{session.number_of_6_packs}</Badge>
                          ) : (
                            0
                          )}
                        </td>
                        <td>
                          {session.number_of_12_packs > 0 ? (
                            <Badge bg="primary">{session.number_of_12_packs}</Badge>
                          ) : (
                            0
                          )}
                        </td>
                        <td>
                          {session.extra_items > 0 ? (
                            <Badge bg="secondary">{session.extra_items}</Badge>
                          ) : (
                            0
                          )}
                        </td>
                        <td>
                          <Badge bg="success">{session.total_packed_quantity}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default ViewPackingSessions;
