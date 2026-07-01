import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-[#f4f6f9]">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
