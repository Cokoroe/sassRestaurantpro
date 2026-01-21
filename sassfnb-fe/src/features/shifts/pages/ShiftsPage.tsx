// src/features/shifts/pages/ShiftsPage.tsx
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { AppLayoutContext } from "../../../layout/AppLayout";
import TemplatesPanel from "../sections/TemplatesPanel";
import SchedulePanel from "../sections/SchedulePanel";

export default function ShiftsPage() {
  const { setTitle } = useOutletContext<AppLayoutContext>();

  useEffect(() => {
    setTitle?.("Quản lý ca làm");
  }, [setTitle]);

  const [tab, setTab] = useState<"templates" | "schedule">("templates");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-2 rounded-xl border ${
            tab === "templates" ? "bg-black text-white" : "bg-white"
          }`}
          onClick={() => setTab("templates")}
        >
          Ca mẫu
        </button>
        <button
          className={`px-3 py-2 rounded-xl border ${
            tab === "schedule" ? "bg-black text-white" : "bg-white"
          }`}
          onClick={() => setTab("schedule")}
        >
          Xếp lịch
        </button>
      </div>

      {tab === "templates" ? <TemplatesPanel /> : <SchedulePanel />}
    </div>
  );
}
