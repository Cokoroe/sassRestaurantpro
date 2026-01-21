// src/features/publicOrder/pages/PublicStaticQrEntryPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { publicQrService } from "../../../api/services/publicQr.service";
import { publicOrderService } from "../../../api/services/publicOrder.service";
import { publicSession } from "../publicSession";

export default function PublicStaticQrEntryPage() {
  const nav = useNavigate();
  const { code = "" } = useParams();

  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setErr("QR code không hợp lệ.");
      return;
    }

    (async () => {
      try {
        // ✅ endpoint mới ở BE: /api/v1/public/qr/static/resolve?code=...
        const resolved = await publicQrService.resolveStatic(code);
        const ctx = publicSession.saveFromResolve(resolved);

        // tạo order DRAFT
        const order = await publicOrderService.create({
          outletId: ctx.outletId,
          tableId: ctx.tableId,
          qrSessionId: ctx.qrSessionId,
          note: null,
          people: null,
        });

        nav(`/order/${order.id}`, { replace: true });
      } catch (e: any) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Resolve QR tĩnh thất bại."
        );
      }
    })();
  }, [code, nav]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Đang mở bàn…</h2>
      <p>Vui lòng chờ trong giây lát.</p>
      {err && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #f99" }}>
          {err}
        </div>
      )}
    </div>
  );
}
