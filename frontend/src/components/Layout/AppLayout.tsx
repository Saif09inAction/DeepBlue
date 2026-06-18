import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        {/* key={pathname} forces React to fully unmount + remount the page on every navigation */}
        <main key={location.pathname} className="flex-1 overflow-y-auto grid-pattern">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
