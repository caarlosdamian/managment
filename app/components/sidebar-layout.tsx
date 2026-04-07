import { Outlet } from "react-router";
import { Sidebar } from "./sidebar";

export default function SidebarLayout() {
  return (
    <div className="app-layout" id="app-layout">
      <Sidebar />
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
