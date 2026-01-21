// src/layout/components/AppTopbar.tsx
import React, { useMemo, useState } from "react";
import {
  Menu,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  HelpCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import OutletSwitcher from "./OutletSwitcher";
import { useAppContextStore } from "../../store/useAppContextStore";
import { authService } from "../../api/services/auth.service";
import { tokenStorage, clearAllAuth } from "../../api/token";

interface AppTopbarProps {
  title: string;
  onOpenSidebar: () => void;
}

const AppTopbar: React.FC<AppTopbarProps> = ({ title, onOpenSidebar }) => {
  const navigate = useNavigate();
  const me = useAppContextStore((s) => s.me);
  const clearContext = useAppContextStore((s) => s.clearContext);
  const [open, setOpen] = useState(false);

  const displayName = (me as any)?.fullName ?? (me as any)?.name ?? "User";
  const email = (me as any)?.email ?? "";
  const roles: string[] = (me as any)?.roles ?? [];
  const roleLabel = roles?.[0] ?? "";

  const initials = useMemo(() => {
    const name = String(displayName || "U").trim();
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  const onLogout = async () => {
    try {
      const refresh = tokenStorage.getRefresh();
      if (refresh) await authService.logout(refresh, false);
    } catch {
      // ignore
    } finally {
      clearAllAuth();
      clearContext();
      setOpen(false);
      navigate("/auth/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-sm">
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu size={22} />
          </button>

          <div className="min-w-0">
            <div className="text-[13px] text-slate-500 font-medium">
              Tổng quan hệ thống
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 tracking-tight truncate">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <OutletSwitcher />

          <button className="relative p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-3 px-2 py-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
            >
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-sm font-bold text-slate-900">
                  {displayName}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {roleLabel}
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold shadow-sm">
                {initials || "U"}
              </div>
            </button>

            {open && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-extrabold text-slate-900">
                      {displayName}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {email}
                    </div>
                  </div>

                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <UserIcon size={18} /> Hồ sơ cá nhân
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <Settings size={18} /> Cài đặt tài khoản
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <HelpCircle size={18} /> Hỗ trợ & Tài liệu
                  </button>

                  <div className="h-px bg-slate-100 my-1 mx-2" />

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 font-semibold hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppTopbar;
