// src/layout/AppLayout.tsx
import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AppSidebar from "./components/AppSidebar";
import AppTopbar from "./components/AppTopbar";
import { authService } from "../api/services/auth.service";
import { tokenStorage, clearAllAuth } from "../api/token";
import { useAppContextStore } from "../store/useAppContextStore";
import { useRbac } from "../hooks/useRbac";

export type AppLayoutContext = {
  setTitle: (t: string) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export default function AppLayout() {
  const navigate = useNavigate();
  const { refresh: refreshRbac } = useRbac();
  const hydrateFromMe = useAppContextStore((s) => s.hydrateFromMe);

  const [title, setTitle] = useState("Bảng điều khiển");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // drawer mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // collapse desktop

  // responsive collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(false);
        return;
      }
      if (window.innerWidth < 1280) setIsSidebarCollapsed(true);
      else setIsSidebarCollapsed(false);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // bootstrap: nếu có token -> /me hydrate + refresh RBAC
  useEffect(() => {
    const run = async () => {
      const access = tokenStorage.getAccess();
      if (!access) return;

      try {
        const me = await authService.me();
        hydrateFromMe(me as any);
        await refreshRbac();
      } catch {
        clearAllAuth();
        navigate("/auth/login", { replace: true });
      }
    };

    run();
  }, [hydrateFromMe, navigate, refreshRbac]);

  const toggleSidebar = () => setIsSidebarCollapsed((v) => !v);

  // hamburger: mobile mở drawer, desktop toggle collapse
  const handleHamburger = () => {
    if (window.innerWidth < 1024) setIsSidebarOpen(true);
    else setIsSidebarCollapsed((v) => !v);
  };

  const closeMobileSidebar = () => setIsSidebarOpen(false);

  const ctxValue = useMemo<AppLayoutContext>(
    () => ({ setTitle, isSidebarCollapsed, toggleSidebar }),
    [isSidebarCollapsed]
  );

  const marginClass = isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72";

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <AppSidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        onCloseMobile={closeMobileSidebar}
      />

      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${marginClass}`}
      >
        <AppTopbar title={title} onOpenSidebar={handleHamburger} />

        {/* ✅ NỀN CONTENT LAM NHẠT (full width) */}
        <div className="bg-slate-100 min-h-[calc(100vh-64px)]">
          <main className="p-4 lg:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Outlet context={ctxValue} />
          </main>
        </div>
      </div>
    </div>
  );
}
