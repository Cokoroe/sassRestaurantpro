// src/features/landing/pages/Homepage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Drawer from "@mui/material/Drawer";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Rating from "@mui/material/Rating";

import {
  Menu,
  X,
  Check,
  ArrowRight,
  Smartphone,
  LayoutDashboard,
  Box,
  Users,
  BarChart3,
  Zap,
  Quote,
  ChevronDown,
  ShieldCheck,
  Zap as ZapIcon,
  Headphones,
} from "lucide-react";

// =======================
// Types & Constants
// =======================
interface NavLink {
  id: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { id: "features", label: "Tính năng" },
  { id: "workflow", label: "Quy trình" },
  { id: "testimonials", label: "Khách hàng" },
  { id: "pricing", label: "Bảng giá" },
  { id: "faq", label: "Hỏi đáp" },
];

const CLIENT_LOGOS = [
  "The Coffee House",
  "Gogi House",
  "Manwah",
  "Kichi Kichi",
  "Phúc Long",
  "Highlands Coffee",
];

const FEATURES = [
  {
    title: "POS Đa nền tảng",
    desc: "Bán hàng mượt mà trên điện thoại, máy tính bảng và PC. Hỗ trợ offline 100%.",
    icon: <Smartphone className="text-blue-600" size={24} />,
  },
  {
    title: "Quản lý Kho & Định lượng",
    desc: "Tự động trừ kho theo định lượng món ăn. Cảnh báo khi nguyên liệu sắp hết.",
    icon: <Box className="text-emerald-600" size={24} />,
  },
  {
    title: "Báo cáo thông minh",
    desc: "Hệ thống báo cáo real-time về doanh thu, lợi nhuận và món bán chạy nhất.",
    icon: <BarChart3 className="text-amber-600" size={24} />,
  },
  {
    title: "QR Order tại bàn",
    desc: "Khách hàng tự gọi món qua mã QR, giảm tải nhân sự và tăng tốc phục vụ.",
    icon: <Zap className="text-purple-600" size={24} />,
  },
  {
    title: "Nhà bếp (KDS)",
    desc: "Màn hình điều phối đơn bếp tập trung, tránh nhầm lẫn và tối ưu thời gian ra món.",
    icon: <LayoutDashboard className="text-rose-600" size={24} />,
  },
  {
    title: "CRM & Loyalty",
    desc: "Quản lý khách hàng, tích điểm nâng hạng và gửi ưu đãi tự động.",
    icon: <Users className="text-cyan-600" size={24} />,
  },
];

const WORKFLOW = [
  {
    title: "Thiết lập thực đơn",
    desc: "Nhập món, cài định lượng và sơ đồ bàn chỉ trong 10 phút.",
  },
  {
    title: "Vận hành bán hàng",
    desc: "Ghi order, in hóa đơn và đồng bộ tức thì xuống bếp.",
  },
  {
    title: "Theo dõi & Tối ưu",
    desc: "Kiểm soát doanh thu, chi phí, khách hàng mọi lúc qua mobile app.",
  },
];

const TESTIMONIALS = [
  {
    name: "Anh Nam Trần",
    role: "Chủ chuỗi Nam Coffee",
    content:
      "SassFnB giúp tôi quản lý 5 chi nhánh một cách nhẹ nhàng. Số liệu chính xác và rất dễ dùng.",
    avatar: "https://i.pravatar.cc/150?u=1",
    rating: 5,
  },
  {
    name: "Chị Lan Hương",
    role: "Quản lý Nhà hàng Fusion",
    content:
      "Tính năng QR Order là cứu cánh giờ cao điểm. Khách rất hài lòng, nhân viên đỡ áp lực.",
    avatar: "https://i.pravatar.cc/150?u=2",
    rating: 5,
  },
  {
    name: "Anh Minh Đức",
    role: "Chủ quán Lẩu Đức",
    content:
      "Báo cáo kho cực kỳ chi tiết, giúp tôi giảm thất thoát nguyên liệu đáng kể.",
    avatar: "https://i.pravatar.cc/150?u=3",
    rating: 4.5,
  },
];

const PRICING = [
  {
    title: "Starter",
    price: "199,000",
    desc: "Dành cho quán nhỏ, xe đẩy",
    features: [
      "1 Cửa hàng",
      "Tối đa 5 nhân sự",
      "POS cơ bản",
      "Báo cáo doanh thu",
    ],
    highlight: false,
  },
  {
    title: "Professional",
    price: "499,000",
    desc: "Dành cho nhà hàng vừa và lớn",
    features: [
      "1 Cửa hàng",
      "Không giới hạn nhân sự",
      "Quản lý Kho & KDS",
      "QR Order & CRM",
      "Hỗ trợ 24/7",
    ],
    highlight: true,
  },
  {
    title: "Enterprise",
    price: "999,000",
    desc: "Giải pháp cho chuỗi cửa hàng",
    features: [
      "Không giới hạn chi nhánh",
      "Quản lý tập trung",
      "API tích hợp riêng",
      "Chuyên gia tư vấn 1-1",
    ],
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Hệ thống có hoạt động được khi mất mạng không?",
    a: "Có. SassFnB hỗ trợ chế độ Offline. Dữ liệu sẽ tự đồng bộ khi có mạng trở lại.",
  },
  {
    q: "Tôi có được dùng thử trước khi mua không?",
    a: "Có. Bạn được dùng thử miễn phí 14 ngày đầy đủ tính năng.",
  },
  {
    q: "Có mất thêm phí cài đặt ban đầu không?",
    a: "Không. Chúng tôi hỗ trợ cài đặt và hướng dẫn sử dụng miễn phí cho khách hàng mới.",
  },
];

// =======================
// Sub-components
// =======================
const DashboardMock: React.FC = () => (
  <div className="relative w-full max-w-2xl mx-auto perspective-1000">
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform rotate-y-[-12deg] rotate-x-[5deg] transition-transform duration-700 hover:rotate-0">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-4 bg-white rounded-md h-6 border border-slate-200" />
      </div>

      <div className="p-6 grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-4">
          <div className="h-8 bg-blue-100 rounded-lg w-full" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-slate-100 rounded w-full" />
            ))}
          </div>
        </div>

        <div className="col-span-9 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div className="h-2 w-1/2 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-3/4 bg-blue-600/20 rounded" />
              </div>
            ))}
          </div>

          <div className="h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center">
            <div className="w-full px-8 flex items-end gap-2 h-32">
              {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 bg-blue-500/20 rounded-t-md"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="absolute -bottom-8 -left-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce-slow">
      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
        <Check size={20} />
      </div>
      <div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Hoàn thành đơn
        </div>
        <div className="text-sm font-black">Bàn số 05 - 450,000đ</div>
      </div>
    </div>
  </div>
);

// =======================
// Main Page
// =======================
const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const sectionIds = useMemo(() => NAV_LINKS.map((x) => x.id), []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });

    // ===== Intersection observer (stable) =====
    const observerOptions: IntersectionObserverInit = {
      root: null,
      // trừ chiều cao navbar để tránh nhảy
      rootMargin: "-90px 0px -40% 0px",
      threshold: [0.2, 0.35, 0.5, 0.65],
    };

    const observer = new IntersectionObserver((entries) => {
      // chọn entry có intersectionRatio lớn nhất để tránh nhảy liên tục
      let best: IntersectionObserverEntry | null = null;

      for (const e of entries) {
        if (!e.isIntersecting) continue;
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      }

      if (best?.target?.id) setActiveSection(best.target.id);
    }, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, [sectionIds]);

  const handleAuth = () => navigate("/auth");

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const offset = 80; // height navbar
    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({ top, behavior: "smooth" });
    setIsMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navbar */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 h-20 transition-all duration-300 flex items-center ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-100"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span
              className={`text-xl font-black tracking-tight ${
                isScrolled ? "text-slate-900" : "text-white"
              }`}
            >
              SassFnB
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`text-sm font-bold transition-colors relative py-2 ${
                  activeSection === link.id
                    ? "text-blue-600"
                    : isScrolled
                    ? "text-slate-600 hover:text-blue-600"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAuth}
              className={`hidden sm:block text-sm font-bold transition-colors ${
                isScrolled
                  ? "text-slate-900 hover:text-blue-600"
                  : "text-white hover:text-white/80"
              }`}
            >
              Đăng nhập
            </button>

            <button
              onClick={handleAuth}
              className="px-6 h-11 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Dùng thử miễn phí
            </button>

            <button
              onClick={() => setIsMobileOpen(true)}
              className={`lg:hidden p-2 rounded-lg ${
                isScrolled ? "text-slate-900" : "text-white"
              }`}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      >
        <div className="w-72 p-6 flex flex-col h-full bg-white">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xl font-black text-slate-900">Menu</span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-900"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="w-full text-left py-3 text-lg font-bold text-slate-600 hover:text-blue-600 flex items-center justify-between group"
              >
                {link.label}
                <ArrowRight
                  size={18}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-3">
            <button
              onClick={handleAuth}
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold"
            >
              Đăng nhập
            </button>
            <button
              onClick={handleAuth}
              className="w-full h-12 rounded-xl bg-blue-600 text-white font-bold"
            >
              Bắt đầu ngay
            </button>
          </div>
        </div>
      </Drawer>

      {/* Hero Section */}
      <header className="relative min-h-screen bg-[#0a192f] overflow-hidden flex items-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[100px] animate-pulse-slow" />
        </div>

        <div className="container mx-auto px-4 pt-20 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
              <span className="text-xs font-black text-blue-400 uppercase tracking-widest">
                Sẵn sàng cho kỷ nguyên số F&amp;B
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
              Quản lý nhà hàng <br />
              <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8">
                Thông minh
              </span>{" "}
              &amp; Tinh gọn
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-lg leading-relaxed">
              Giải pháp POS All-in-One dành cho nhà hàng, café và chuỗi F&amp;B.
              Giảm 30% chi phí vận hành, tăng 50% hiệu suất bếp.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAuth}
                className="px-10 h-16 bg-blue-600 text-white rounded-2xl text-lg font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:-translate-y-1 active:scale-95"
              >
                Dùng thử 14 ngày
              </button>

              <button
                onClick={handleAuth}
                className="px-10 h-16 bg-white/5 text-white border border-white/10 rounded-2xl text-lg font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
              >
                Xem demo live{" "}
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck size={18} className="text-blue-500" />
                <span className="text-sm font-bold">Bảo mật PCI</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ZapIcon size={18} className="text-amber-500" />
                <span className="text-sm font-bold">Tốc độ 0.5s</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Headphones size={18} className="text-emerald-500" />
                <span className="text-sm font-bold">Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <DashboardMock />
          </div>
        </div>
      </header>

      {/* Social Proof */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">
            Được tin dùng bởi hơn 2,000+ thương hiệu hàng đầu
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
            {CLIENT_LOGOS.map((logo, i) => (
              <span
                key={i}
                className="text-xl font-black text-slate-300 hover:text-slate-900 transition-colors cursor-default"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50/50 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-20 space-y-4">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">
              Tính năng vượt trội
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Mọi công cụ bạn cần <br /> để bứt phá doanh thu
            </h3>
            <p className="text-slate-500 text-lg">
              Hệ thống đồng bộ khép kín từ khâu đặt bàn đến báo cáo tài chính.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="group p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-2 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                  {f.icon}
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {f.title}
                </h4>
                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="workflow"
        className="py-24 bg-[#0a192f] text-white scroll-mt-24"
      >
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-20 items-center">
          <div className="flex-1 space-y-12">
            <div className="space-y-4">
              <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest">
                Quy trình vận hành
              </h2>
              <h3 className="text-4xl md:text-5xl font-black">
                Triển khai dễ dàng <br /> Quản lý nhàn tênh
              </h3>
            </div>

            <div className="space-y-10 relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/5" />
              {WORKFLOW.map((w, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0 font-black text-xl shadow-lg shadow-blue-600/20">
                    {i + 1}
                  </div>
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xl font-bold">{w.title}</h4>
                    <p className="text-slate-400 leading-relaxed max-w-md">
                      {w.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 w-full lg:w-auto">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop"
                alt="Workflow"
                className="rounded-[3rem] shadow-2xl opacity-80"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-64 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Real-time Stats
                  </span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-black">125 Đơn hàng</div>
                  <div className="text-xs text-slate-400">
                    Đang hoạt động toàn hệ thống
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">
              Khách hàng nói gì
            </h2>
            <h3 className="text-4xl font-black text-slate-900 leading-tight">
              Được yêu thích bởi các chủ quán
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 flex flex-col gap-6 relative"
              >
                <Quote
                  className="text-blue-600/10 absolute top-8 right-8"
                  size={64}
                  fill="currentColor"
                />
                <Rating
                  value={t.rating}
                  precision={0.5}
                  readOnly
                  size="small"
                />
                <p className="text-lg italic text-slate-700 leading-relaxed flex-1">
                  "{t.content}"
                </p>
                <div className="flex items-center gap-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-2xl object-cover"
                  />
                  <div>
                    <h5 className="font-black text-slate-900">{t.name}</h5>
                    <p className="text-xs text-slate-500 font-bold">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-24 bg-slate-900 text-white scroll-mt-24"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-sm font-black text-blue-500 uppercase tracking-widest">
              Bảng giá minh bạch
            </h2>
            <h3 className="text-4xl font-black">
              Lựa chọn gói phù hợp với bạn
            </h3>
            <p className="text-slate-400">
              Không phí ẩn, không cam kết dài hạn, hủy bất cứ lúc nào.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {PRICING.map((p, i) => (
              <div
                key={i}
                className={`p-10 rounded-[3rem] flex flex-col gap-8 transition-all duration-300 ${
                  p.highlight
                    ? "bg-blue-600 shadow-2xl shadow-blue-600/20 scale-105 border-0"
                    : "bg-white/5 border border-white/10 hover:bg-white/10"
                }`}
              >
                {p.highlight && (
                  <span className="self-start px-3 py-1 bg-white text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                    Phổ biến nhất
                  </span>
                )}

                <div>
                  <h4 className="text-xl font-black mb-2">{p.title}</h4>
                  <p
                    className={`text-sm ${
                      p.highlight ? "text-white/80" : "text-slate-400"
                    }`}
                  >
                    {p.desc}
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">{p.price}</span>
                  <span className="text-sm opacity-60">đ/tháng</span>
                </div>

                <ul className="space-y-4 flex-1">
                  {p.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-sm font-medium"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          p.highlight
                            ? "bg-white/20"
                            : "bg-blue-600/20 text-blue-400"
                        }`}
                      >
                        <Check size={12} strokeWidth={4} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleAuth}
                  className={`w-full h-14 rounded-2xl font-black text-sm transition-all ${
                    p.highlight
                      ? "bg-white text-blue-600 hover:scale-[1.02]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  Chọn gói {p.title}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white scroll-mt-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">
              Câu hỏi thường gặp
            </h2>
            <h3 className="text-4xl font-black text-slate-900 leading-tight">
              Giải đáp thắc mắc
            </h3>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <Accordion
                key={i}
                elevation={0}
                sx={{
                  "&:before": { display: "none" },
                  borderRadius: "1.5rem !important",
                  border: "1px solid #f1f5f9",
                  overflow: "hidden",
                  mb: 2,
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ChevronDown size={20} className="text-blue-600" />
                  }
                  sx={{ p: 3, "& .MuiAccordionSummary-content": { m: 0 } }}
                >
                  <span className="font-bold text-slate-900">{faq.q}</span>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <p className="text-slate-500 leading-relaxed">{faq.a}</p>
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-900 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-10">
          <h3 className="text-4xl md:text-6xl font-black text-white leading-tight">
            Sẵn sàng nâng tầm vận hành <br /> cho nhà hàng của bạn?
          </h3>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Gia nhập cộng đồng hơn 2,000 khách hàng thành công cùng SassFnB ngay
            hôm nay.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleAuth}
              className="px-12 h-16 bg-white text-blue-600 rounded-2xl text-lg font-black shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              Đăng ký ngay
            </button>
            <button
              onClick={handleAuth}
              className="px-12 h-16 bg-blue-700 text-white rounded-2xl text-lg font-black hover:bg-blue-800 transition-all"
            >
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-24 pb-12 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-16 mb-20">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-lg">S</span>
                </div>
                <span className="text-xl font-black text-white">SassFnB</span>
              </div>
              <p className="text-sm leading-relaxed">
                Giải pháp quản lý F&amp;B thông minh. Tinh gọn, hiệu quả và tin
                cậy.
              </p>

              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                    title="Social"
                  >
                    <Smartphone size={18} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className="text-white font-black uppercase text-xs tracking-widest mb-8">
                Sản phẩm
              </h5>
              <ul className="space-y-4 text-sm font-medium">
                {[
                  "Tính năng",
                  "Bảng giá",
                  "Tài liệu hướng dẫn",
                  "Cập nhật hệ thống",
                ].map((l) => (
                  <li
                    key={l}
                    className="hover:text-blue-500 cursor-pointer transition-colors"
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-black uppercase text-xs tracking-widest mb-8">
                Công ty
              </h5>
              <ul className="space-y-4 text-sm font-medium">
                {[
                  "Về chúng tôi",
                  "Tuyển dụng",
                  "Tin tức F&B",
                  "Liên hệ hỗ trợ",
                ].map((l) => (
                  <li
                    key={l}
                    className="hover:text-blue-500 cursor-pointer transition-colors"
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-black uppercase text-xs tracking-widest mb-8">
                Đăng ký bản tin
              </h5>
              <p className="text-sm mb-6">
                Nhận bí quyết kinh doanh F&B hiệu quả hàng tuần.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email của bạn"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors">
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold">
            <p>© 2026 SassFnB Solutions. Bảo lưu mọi quyền.</p>
            <div className="flex gap-8">
              <span className="hover:text-white cursor-pointer transition-colors">
                Chính sách bảo mật
              </span>
              <span className="hover:text-white cursor-pointer transition-colors">
                Điều khoản sử dụng
              </span>
              <span className="hover:text-white cursor-pointer transition-colors">
                Sitemap
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
