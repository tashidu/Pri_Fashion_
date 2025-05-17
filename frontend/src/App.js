import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
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
import EditCutting from "./pages/EditCutting.js"
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
        <Route path="/sales-products" element={<SalesProductView />} />
        <Route path="/sales-product-gallery" element={<SalesProductImageViewer />} />
        <Route path="/addsupplier" element={<AddSupplier />} />
        <Route path="/viewsuppliers" element={<ViewSuppliers />} />
        <Route path="/addfabric" element={<AddFabric />} />

        <Route path="/edit-fabric/:id" element={<EditFabric />} />
        <Route path="/viewfabric" element={<ViewFabrics />} />
        <Route
          path="/fabric-definitions/:id"
          element={<ViewFabricVariants />}
        />
        <Route
          path="/fabric-inventory/:variantId"
          element={<FabricInventoryDetail />}
        />
        <Route path="/viewcutting" element={<ViewCutting />} />
        <Route path="/cutting-record/:recordId" element={<CuttingRecordDetail />} />
        <Route path="/addcutting" element={<AddCutting />} />
        <Route path="/editcutting/:id" element={<EditCutting />} />
        <Route path="/adddailysewing" element={<AddDailySewingRecord />} />
        <Route path="/daily-sewing-history" element={<ViewDailySewingHistory />} />
        <Route path="/viewproductlist" element={<ViewProductList />} />
        <Route path="/approve-finished-product/:id" element={<ApproveFinishedProduct />} />
        <Route path="/approveproduct-list" element={<ViewApproveProduct />} />
        <Route path="/add-packing-session" element={<AddPackingSession />} />
        <Route path="/view-packing-sessions" element={<ViewPackingSessions />} />
        <Route path="/view-packing-inventory" element={<ViewPackingInventory />} />
        <Route path="/packing-report" element={<PackingReportChart />} />
        <Route path ="/addshop" element={<AddShop/>} />
        <Route path="/shop-analysis" element={<ShopAnalysisDashboard />} />
        <Route path="/addorder" element={<CreateOrder />} />
        <Route path="/order-list" element={<OrderListPage />} />
        <Route path="/owner-orders" element={<OwnerOrdersPage />} />
        <Route path="/sales-team-orders" element={<SalesTeamOrdersPage />} />
        <Route path="/order-analysis" element={<OrderAnalysisPage />} />
        <Route path="/sales-packing-inventory" element={<ViewPackingInventorySales />} />
        <Route path="/sell-product" element={<SellProductPage />} />
      </Routes>
    </Router>
  );
}

export default App;
