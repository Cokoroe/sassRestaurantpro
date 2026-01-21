// src/features/auth/pages/AuthPage.tsx
import { useEffect, useMemo, useState } from "react";
import AuthLayout from "../AuthLayout";
import AuthCard from "../components/AuthCard";
import AlertBanner from "../components/AlertBanner";
import TextInput from "../components/TextInput";
import PasswordInput from "../components/PasswordInput";
import PrimaryButton from "../components/PrimaryButton";

import { useLogin } from "../hooks/useLogin";
import { authService } from "../../../api/services/auth.service";

type View = "login" | "register" | "forgot" | "reset";

type AlertState = {
  type: "success" | "error" | "info" | "warning";
  message: string;
} | null;

const REMEMBER_KEY = "sassfnb_auth_remember_email";
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");

export default function AuthPage() {
  const { login, loading: loginLoading } = useLogin();

  const [view, setView] = useState<View>("login");
  const [alert, setAlert] = useState<AlertState>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    restaurantName: "",
    email: "",
    password: "",
    confirmPassword: "",
    remember: true,
    resetToken: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_KEY);
    if (remembered && !form.email)
      setForm((s) => ({ ...s, email: remembered }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setErrors({});
    setAlert(null);
    setForm((s) => ({
      ...s,
      password: "",
      confirmPassword: "",
      resetToken: "",
    }));
  }, [view]);

  const title = useMemo(() => {
    if (view === "login") return "Đăng nhập";
    if (view === "register") return "Tạo tài khoản quản lý";
    if (view === "forgot") return "Quên mật khẩu";
    return "Đặt lại mật khẩu";
  }, [view]);

  const subtitle = useMemo(() => {
    if (view === "login")
      return "Đăng nhập để quản lý nhà hàng/chi nhánh, nhân sự và vận hành.";
    if (view === "register")
      return "Tạo tài khoản OWNER và khởi tạo nhà hàng đầu tiên trong vài phút.";
    if (view === "forgot")
      return "Nhập email để nhận hướng dẫn đặt lại mật khẩu.";
    return "Nhập token nhận được qua email và thiết lập mật khẩu mới.";
  }, [view]);

  const setField = (name: keyof typeof form, value: string | boolean) => {
    setForm((s) => ({ ...s, [name]: value as any }));
    setErrors((e) => {
      if (!e[name as string]) return e;
      const next = { ...e };
      delete next[name as string];
      return next;
    });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = "Vui lòng nhập email.";
    else if (!isEmail(form.email.trim()))
      e.email = "Email không đúng định dạng.";

    if (view === "login") {
      if (!form.password) e.password = "Vui lòng nhập mật khẩu.";
    }

    if (view === "register") {
      if (!form.fullName.trim()) e.fullName = "Vui lòng nhập họ và tên.";
      if (!form.restaurantName.trim())
        e.restaurantName = "Vui lòng nhập tên nhà hàng/thương hiệu.";
      if (!form.password) e.password = "Vui lòng nhập mật khẩu.";
      else if (form.password.length < 8)
        e.password = "Mật khẩu tối thiểu 8 ký tự.";
      if (form.confirmPassword !== form.password)
        e.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    if (view === "reset") {
      if (!form.resetToken.trim())
        e.resetToken = "Vui lòng nhập token khôi phục.";
      if (!form.password) e.password = "Vui lòng nhập mật khẩu mới.";
      else if (form.password.length < 8)
        e.password = "Mật khẩu tối thiểu 8 ký tự.";
      if (form.confirmPassword !== form.password)
        e.confirmPassword = "Mật khẩu xác nhận không khớp.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAlert(null);
    if (!validate()) return;

    if (form.remember) localStorage.setItem(REMEMBER_KEY, form.email.trim());
    else localStorage.removeItem(REMEMBER_KEY);

    if (view === "login") {
      const res = await login(form.email.trim(), form.password);
      if (!res.ok)
        setAlert({
          type: "error",
          message: res.message ?? "Đăng nhập thất bại.",
        });
      return;
    }

    setSubmitting(true);
    try {
      if (view === "register") {
        await authService.registerOwner({
          email: form.email.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          restaurantName: form.restaurantName.trim(),
        });
        setAlert({
          type: "success",
          message: "Đăng ký thành công. Vui lòng đăng nhập để bắt đầu.",
        });
        setView("login");
        return;
      }

      if (view === "forgot") {
        const res = await authService.forgotPassword(form.email.trim());
        setAlert({
          type: "success",
          message:
            res.message ||
            "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.",
        });
        setView("reset");
        return;
      }

      if (view === "reset") {
        const res = await authService.resetPassword(
          form.resetToken.trim(),
          form.password
        );
        setAlert({
          type: "success",
          message:
            res.message || "Đặt lại mật khẩu thành công. Hãy đăng nhập lại.",
        });
        setView("login");
        return;
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      setAlert({ type: "error", message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const loading = loginLoading || submitting;

  return (
    <AuthLayout>
      <AuthCard title={title} subtitle={subtitle}>
        {alert ? (
          <div className="mb-4">
            <AlertBanner
              type={alert.type}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="grid gap-4">
          {view === "register" ? (
            <>
              <TextInput
                label="Họ và tên"
                value={form.fullName}
                onChange={(e) => setField("fullName", e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
                autoComplete="name"
                disabled={loading}
                error={errors.fullName}
                leftIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 21a8 8 0 0 0-16 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />

              <TextInput
                label="Tên nhà hàng / thương hiệu"
                value={form.restaurantName}
                onChange={(e) => setField("restaurantName", e.target.value)}
                placeholder="Ví dụ: Pho House / Cafe ABC"
                autoComplete="organization"
                disabled={loading}
                error={errors.restaurantName}
                leftIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 21h18M5 21V7l7-4 7 4v14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M9 21v-8h6v8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
            </>
          ) : null}

          <TextInput
            label="Email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="quanly@nhahang.com"
            autoComplete="email"
            disabled={loading}
            error={errors.email}
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h16v16H4V4z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 7l8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
          />

          {view === "reset" ? (
            <TextInput
              label="Token khôi phục"
              value={form.resetToken}
              onChange={(e) => setField("resetToken", e.target.value)}
              placeholder="Dán token nhận được trong email"
              disabled={loading}
              error={errors.resetToken}
            />
          ) : null}

          {view !== "forgot" ? (
            <PasswordInput
              label={view === "reset" ? "Mật khẩu mới" : "Mật khẩu"}
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              placeholder="••••••••"
              autoComplete={
                view === "login" ? "current-password" : "new-password"
              }
              disabled={loading}
              error={errors.password}
            />
          ) : null}

          {view === "register" || view === "reset" ? (
            <PasswordInput
              label={
                view === "reset" ? "Nhập lại mật khẩu mới" : "Xác nhận mật khẩu"
              }
              value={form.confirmPassword}
              onChange={(e) => setField("confirmPassword", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
              error={errors.confirmPassword}
            />
          ) : null}

          {view === "login" ? (
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setField("remember", e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-amber-500 focus:ring-amber-400/40"
                  disabled={loading}
                />
                Ghi nhớ email
              </label>

              {/* subtle link */}
              <button
                type="button"
                onClick={() => setView("forgot")}
                disabled={loading}
                className="text-sm text-white/65 hover:text-white/85 hover:underline underline-offset-4"
              >
                Quên mật khẩu?
              </button>
            </div>
          ) : null}

          <PrimaryButton type="submit" loading={loading}>
            {view === "login" && "Đăng nhập"}
            {view === "register" && "Tạo tài khoản"}
            {view === "forgot" && "Gửi yêu cầu khôi phục"}
            {view === "reset" && "Đặt lại mật khẩu"}
          </PrimaryButton>

          {/* Bottom switch – subtle links */}
          <div className="pt-2 text-center text-sm text-white/65">
            {view === "login" ? (
              <>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className="font-semibold text-amber-300 hover:text-amber-200 hover:underline underline-offset-4"
                  onClick={() => setView("register")}
                  disabled={loading}
                >
                  Đăng ký
                </button>
              </>
            ) : null}

            {view === "register" ? (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  className="font-semibold text-amber-300 hover:text-amber-200 hover:underline underline-offset-4"
                  onClick={() => setView("login")}
                  disabled={loading}
                >
                  Đăng nhập
                </button>
              </>
            ) : null}

            {view === "forgot" || view === "reset" ? (
              <button
                type="button"
                className="font-semibold text-amber-300 hover:text-amber-200 hover:underline underline-offset-4"
                onClick={() => setView("login")}
                disabled={loading}
              >
                Quay lại đăng nhập
              </button>
            ) : null}
          </div>

          <div className="pt-1 text-center text-xs text-white/40">
            Bằng việc tiếp tục, bạn đồng ý với điều khoản sử dụng và chính sách
            bảo mật.
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
