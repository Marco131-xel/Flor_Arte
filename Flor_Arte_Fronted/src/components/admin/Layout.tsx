import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import "../../styles/admin/style.css";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-layout">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="admin-body">
        <Sidebar open={sidebarOpen} />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default AdminLayout;