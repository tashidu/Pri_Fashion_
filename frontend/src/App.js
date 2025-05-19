import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import OwnerDashboard from "./pages/OwnerDashboard";
import InventoryDashboard from "./pages/InventoryDashboard";
import OrdersDashboard from "./pages/OrdersDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import SalesProductView from "./pages/SalesProductView";
import SalesProductImageViewer from "./pages/SalesProductImageViewer";
import AddSupplier from "./pages/AddSupplier";
import ViewSuppliers from "./pages/ViewSuppliers";
import AddFabric from "./pages/AddFabric";

import EditFabric from "./pages/EditFabric";
import ViewFabrics from "./pages/ViewFabrics";
import ViewCutting from "./pages/ViewCutting.js";
import ViewFabricVariants from "./pages/ViewFabricVariants";
import FabricInventoryDetail from "./pages/FabricInventoryDetail";
import CuttingRecordDetail from "./pages/CuttingRecordDetail";
import AddCutting from "./pages/AddCutting.js"
import AddDailySewingRecord from "./pages/AddDailySewingRecord";
import ViewDailySewingHistory from './pages/ViewDailySewingHistory';
import ViewProductList from './pages/ViewProductList.js';
import ApproveFinishedProduct from "./pages/ApproveFinishedProduct";
import ViewApproveProduct from "./pages/ViewApproveProduct.js";
import AddPackingSession from "./pages/AddPackingSession.js";
import ViewPackingSessions from "./pages/ViewPackingSessions.js";
import ViewPackingInventory from "./pages/ViewPackingInventory.js";
import ViewPackingInventorySales from "./pages/ViewPackingInventorySales.js";
import SellProductPage from "./pages/SellProductPage.js";
import PackingReportChart from "./pages/PackingReportChart.js";
import AddShop from "./pages/AddShop.js";
import CreateOrder from "./pages/CreateOrder.js";
import OrderListPage from "./pages/OrderListPage.js.js";
import OwnerOrdersPage from "./pages/OwnerOrdersPage.js";
import SalesTeamOrdersPage from "./pages/SalesTeamOrdersPage.js";
import ShopAnalysisDashboard from "./pages/ShopAnalysisDashboard.js";
import OrderAnalysisPage from "./pages/OrderAnalysisPage.js";
import ViewShops from "./pages/ViewShops.js";
import SalesReport from "./pages/SalesReport.js";

// Import the ProtectedRoute component
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - accessible without login */}
        <Route path="/signup" element={<Signup />} />
        <Route path="" element={<Login />} />

        {/* Owner routes */}
        <Route path="/owner-dashboard" element={
          <ProtectedRoute allowedRoles={['Owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/owner-orders" element={
          <ProtectedRoute allowedRoles={['Owner']}>
            <OwnerOrdersPage />
          </ProtectedRoute>
        } />

        {/* Inventory Manager routes */}
        <Route path="/inventory-dashboard" element={
          <ProtectedRoute allowedRoles={['Inventory Manager']}>
            <InventoryDashboard />
          </ProtectedRoute>
        } />
        <Route path="/addsupplier" element={
          <ProtectedRoute allowedRoles={['Inventory Manager']}>
            <AddSupplier />
          </ProtectedRoute>
        } />
        <Route path="/viewsuppliers" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <ViewSuppliers />
          </ProtectedRoute>
        } />
        <Route path="/addfabric" element={
          <ProtectedRoute allowedRoles={['Inventory Manager']}>
            <AddFabric />
          </ProtectedRoute>
        } />
        <Route path="/edit-fabric/:id" element={
          <ProtectedRoute allowedRoles={['Inventory Manager']}>
            <EditFabric />
          </ProtectedRoute>
        } />
        <Route path="/viewfabric" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <ViewFabrics />
          </ProtectedRoute>
        } />
        <Route path="/fabric-definitions/:id" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <ViewFabricVariants />
          </ProtectedRoute>
        } />
        <Route path="/fabric-inventory/:variantId" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <FabricInventoryDetail />
          </ProtectedRoute>
        } />
        <Route path="/viewcutting" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <ViewCutting />
          </ProtectedRoute>
        } />
        <Route path="/cutting-record/:recordId" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <CuttingRecordDetail />
          </ProtectedRoute>
        } />
        <Route path="/addcutting" element={
          <ProtectedRoute allowedRoles={['Inventory Manager']}>
            <AddCutting />
          </ProtectedRoute>
        } />
        <Route path="/adddailysewing" element={
          <ProtectedRoute allowedRoles={['Inventory Manager']}>
            <AddDailySewingRecord />
          </ProtectedRoute>
        } />
        <Route path="/daily-sewing-history" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <ViewDailySewingHistory />
          </ProtectedRoute>
        } />
        <Route path="/viewproductlist" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <ViewProductList />
          </ProtectedRoute>
        } />
        <Route path="/approve-finished-product/:id" element={
          <ProtectedRoute allowedRoles={['Owner']}>
            <ApproveFinishedProduct />
          </ProtectedRoute>
        } />
        <Route path="/approveproduct-list" element={
          <ProtectedRoute allowedRoles={['Owner']}>
            <ViewApproveProduct />
          </ProtectedRoute>
        } />
        <Route path="/add-packing-session" element={
          <ProtectedRoute allowedRoles={['Inventory Manager']}>
            <AddPackingSession />
          </ProtectedRoute>
        } />
        <Route path="/view-packing-sessions" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner']}>
            <ViewPackingSessions />
          </ProtectedRoute>
        } />
        <Route path="/view-packing-inventory" element={
          <ProtectedRoute allowedRoles={['Inventory Manager', 'Owner', 'Sales Team', 'Order Coordinator']}>
            <ViewPackingInventory />
          </ProtectedRoute>
        } />
        <Route path="/packing-report" element={
          <ProtectedRoute allowedRoles={['Owner', 'Inventory Manager']}>
            <PackingReportChart />
          </ProtectedRoute>
        } />

        {/* Order Coordinator routes */}
        <Route path="/orders-dashboard" element={
          <ProtectedRoute allowedRoles={['Order Coordinator']}>
            <OrdersDashboard />
          </ProtectedRoute>
        } />

        {/* Sales Team routes */}
        <Route path="/sales-dashboard" element={
          <ProtectedRoute allowedRoles={['Sales Team']}>
            <SalesDashboard />
          </ProtectedRoute>
        } />
        <Route path="/sales-products" element={
          <ProtectedRoute allowedRoles={['Sales Team']}>
            <SalesProductView />
          </ProtectedRoute>
        } />
        <Route path="/sales-product-gallery" element={
          <ProtectedRoute allowedRoles={['Sales Team']}>
            <SalesProductImageViewer />
          </ProtectedRoute>
        } />
        <Route path="/sales-packing-inventory" element={
          <ProtectedRoute allowedRoles={['Sales Team']}>
            <ViewPackingInventorySales />
          </ProtectedRoute>
        } />
        <Route path="/sell-product" element={
          <ProtectedRoute allowedRoles={['Sales Team']}>
            <SellProductPage />
          </ProtectedRoute>
        } />
        <Route path="/sales-team-orders" element={
          <ProtectedRoute allowedRoles={['Sales Team']}>
            <SalesTeamOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/viewshops" element={
          <ProtectedRoute allowedRoles={['Sales Team']}>
            <ViewShops />
          </ProtectedRoute>
        } />
        <Route path="/sales-report" element={
          <ProtectedRoute allowedRoles={['Sales Team', 'Inventory Manager', 'Owner']}>
            <SalesReport />
          </ProtectedRoute>
        } />

        {/* Shared routes */}
        <Route path="/addshop" element={
          <ProtectedRoute allowedRoles={['Owner', 'Sales Team']}>
            <AddShop />
          </ProtectedRoute>
        } />
        <Route path="/shop-analysis" element={
          <ProtectedRoute allowedRoles={['Owner', 'Sales Team']}>
            <ShopAnalysisDashboard />
          </ProtectedRoute>
        } />
        <Route path="/addorder" element={
          <ProtectedRoute allowedRoles={['Order Coordinator', 'Sales Team']}>
            <CreateOrder />
          </ProtectedRoute>
        } />
        <Route path="/order-list" element={
          <ProtectedRoute allowedRoles={['Order Coordinator', 'Sales Team', 'Owner']}>
            <OrderListPage />
          </ProtectedRoute>
        } />
        <Route path="/order-analysis" element={
          <ProtectedRoute allowedRoles={['Owner', 'Sales Team']}>
            <OrderAnalysisPage />
          </ProtectedRoute>
        } />

        {/* Catch-all route for invalid URLs - redirect to login or dashboard based on auth status */}
        <Route path="*" element={
          <ProtectedRoute>
            {/* This will redirect to the appropriate dashboard based on user role */}
            {/* If not logged in, the ProtectedRoute will redirect to login */}
            <Navigate to="/" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
