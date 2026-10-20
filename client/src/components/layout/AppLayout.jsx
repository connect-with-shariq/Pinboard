import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LiveProvider } from "../../context/LiveContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// Logged-in shell: sidebar on the left, top bar, page content
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false); // sidebar on phones
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <LiveProvider>
      <div className="shell">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        {menuOpen && <div className="shell__scrim" onClick={() => setMenuOpen(false)} />}
        <div className="shell__main">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="shell__content">
            <Outlet />
          </main>
        </div>
      </div>
    </LiveProvider>
  );
}
