// src/layout/components/AppSidebar.tsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { NAV_ITEMS } from "./navConfig";
import { useRbac } from "../../hooks/useRbac";

interface AppSidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggle: () => void; // giữ interface
  onCloseMobile: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  isCollapsed,
  onCloseMobile,
}) => {
  const { hasPermission, getFeatureFlag } = useRbac();
  const location = useLocation();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    const okPerm = item.permission ? hasPermission(item.permission) : true;
    const okFeat = item.feature ? getFeatureFlag(item.feature) : true;
    return okPerm && okFeat;
  });

  // mobile luôn wide; collapse chỉ có tác dụng ở lg+
  const sidebarWidth = isCollapsed
    ? "w-[85vw] max-w-[320px] lg:w-20"
    : "w-[85vw] max-w-[320px] lg:w-72";

  const mobileTranslate = isOpen ? "translate-x-0" : "-translate-x-full";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-transform lg:transition-all duration-300 ease-in-out
          ${sidebarWidth}
          ${mobileTranslate} lg:translate-x-0
          bg-gradient-to-b from-[#0a1530] via-[#09122a] to-[#060a18]
          text-slate-200 border-r border-white/5
        `}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <span className="text-white font-extrabold">S</span>
            </div>

            <div className={`leading-tight ${isCollapsed ? "lg:hidden" : ""}`}>
              <div className="font-bold text-white truncate">SassFnB</div>
              <div className="text-[11px] text-slate-400 truncate">
                Restaurant Console
              </div>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-300/80 hover:text-white p-2 rounded-lg hover:bg-white/5"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) => {
                const active =
                  isActive ||
                  (item.path !== "/app" &&
                    location.pathname.startsWith(item.path));

                return `
                  relative group flex items-center gap-3
                  px-3 py-3 rounded-xl transition-all duration-200
                  ${isCollapsed ? "lg:justify-center" : ""}
                  ${
                    active
                      ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-lg shadow-blue-600/15"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }
                `;
              }}
              title={isCollapsed ? item.label : ""}
              onClick={() => {
                if (window.innerWidth < 1024) onCloseMobile();
              }}
            >
              <span
                className={`
                  shrink-0
                  ${
                    location.pathname.startsWith(item.path)
                      ? "text-white"
                      : "text-slate-400 group-hover:text-blue-300"
                  }
                `}
              >
                {item.icon}
              </span>

              <span
                className={`font-semibold text-[14px] truncate ${
                  isCollapsed ? "lg:hidden" : ""
                }`}
              >
                {item.label}
              </span>

              {isCollapsed && (
                <div
                  className="
                    hidden lg:block
                    absolute left-full ml-3 px-2 py-1 rounded-md
                    bg-[#0f1b38] border border-white/10 text-white text-xs
                    opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all whitespace-nowrap
                  "
                >
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AppSidebar;
