import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import OwnerDashboard from "./pages/OwnerDashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import OrdersDashboard from "./pages/OrdersDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import AddSupplier from "./pages/AddSupplier";
import AddFabric from "./pages/AddFabric";

import EditFabric from "./pages/EditFabric";
import ViewFabrics from "./pages/ViewFabrics";
import ViewCutting from "./pages/ViewCutting.js";
import ViewFabricVariants from "./pages/ViewFabricVariants";
import AddCutting  from "./pages/AddCutting.js"
import AddDailySewingRecord from "./pages/AddDailySewingRecord";
import ViewDailySewingHistory from './pages/ViewDailySewingHistory';
import ViewProductList from './pages/ViewProductList.js';
import ApproveFinishedProduct from "./pages/ApproveFinishedProduct";
import ViewApproveProduct from "./pages/ViewApproveProduct.js";
import AddPackingSession from "./pages/AddPackingSession.js";
import PackingReportChart from "./pages/PackingReportChart.js";
import AddShop from "./pages/AddShop.js";
import CreateOrder from "./pages/CreateOrder.js";



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
        <Route path="/addsupplier" element={<AddSupplier />} />
        <Route path="/addfabric" element={<AddFabric />} />

        <Route path="/edit-fabric/:id" component={EditFabric} />
        <Route path="/viewfabric" element={<ViewFabrics />} />
        <Route
          path="/fabric-definitions/:id"
          element={<ViewFabricVariants />}
        />
        <Route path="/viewcutting" element={<ViewCutting />} />
        <Route path="/addcutting" element={<AddCutting />} />
        <Route path="/adddailysewing" element={<AddDailySewingRecord />} />
        <Route path="/daily-sewing-history" element={<ViewDailySewingHistory />} />
        <Route path="/viewproductlist" element={<ViewProductList />} />
        <Route path="/approve-finished-product/:id" element={<ApproveFinishedProduct />} /> 
        <Route path="/approveproduct-list" element={<ViewApproveProduct />} /> 
        <Route path="/add-packing-session" element={<AddPackingSession />} />
        <Route path="/packing-report" element={<PackingReportChart />} />
        <Route path ="/addshop" element={<AddShop/>} />
        <Route path="/addorder" element={<CreateOrder />} />


        
       
       



      </Routes>
    </Router>
  );
}

export default App;
