import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import AddPhone from "./pages/AddPhone";
import PhoneDetail from "./pages/PhoneDetail";
import EditPhone from "./pages/EditPhone";
import Wallet from "./pages/Wallet";
import Analytics from "./pages/Analytics";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="add" element={<AddPhone />} />
          <Route path="inventory/:id" element={<PhoneDetail />} />
          <Route path="edit/:id" element={<EditPhone />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
