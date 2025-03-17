import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import OwnerDashboard from "./pages/OwnerDashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import OrdersDashboard from "./pages/OrdersDashboard";
import SalesDashboard from "./pages/SalesDashboard"
import AddSupplier from './pages/AddSupplier';
import AddFabric from './pages/AddFabric';

import EditFabric from './pages/EditFabric';
import ViewFabrics from './pages/ViewFabrics';
import SupplierDetails from "./pages/SupplierDetails";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<Signup />} />
                <Route path="" element={<Login />} />
                <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        <Route path="/inventory-dashboard" element={<InventoryDashboard />} />
        <Route path="/orders-dashboard" element={<OrdersDashboard />} />
        <Route path="/sales-dashboard" element={<SalesDashboard />} />
        <Route path="/addsupplier" element ={<AddSupplier/>}/>
        <Route path="/addfabric" element ={<AddFabric/>}/>
 
        <Route path="/edit-fabric/:id" component={EditFabric} />
        <Route path="/viewfabric" element ={<ViewFabrics/>}/>
        <Route path="/supplier/:id" element={<SupplierDetails />} />



            </Routes>
        </Router>
    );
}

export default App;
