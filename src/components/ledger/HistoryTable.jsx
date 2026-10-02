import React from "react";
import { RotateCcw, Trash2 } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const d = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");

const thCls = "px-2 py-1.5 text-[12px] font-bold text-[#64748B]";

const changeText = (t) => {
  if (t.deleted_at) return "Đã xoá";
  const hist = t.history || [];
  const last = hist[hist.length - 1];
  if (!last) return "";
  const parts = [];
  if ((last.amount || 0) !== (t.amount || 0)) parts.push(`${fmt(last.amount)} → ${fmt(t.amount)}`);
  if ((last.note || "") !== (t.note || "")) parts.push(`"${last.note || "—"}" → "${t.note || "—"}"`);
  if ((last.date || "") !== (t.date || "")) parts.push(`${d(last.date)} → ${d(t.date)}`);
  if ((last.type || "") !== (t.type || ""))
    parts.push(`${last.type === "in" ? "Vào" : "Ra"} → ${t.type === "in" ? "Vào" : "Ra"}`);
  return parts.join(" · ") || "Đã sửa";
};

export default function HistoryTable({ rows = [], groups = [], loading, onRestore, onPurge, canEdit }) {
  const nameOf = (id) => groups.find((g) => g.id === id)?.name || "—";

  return (
    <div className="rounded-xl border border-[#C9D5E6] bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr>
              <th colSpan={6} className="border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-center">
                <span className="font-display text-lg font-extrabold text-[#0F172A] sm:text-xl">
                  Lịch sử thay đổi
                </span>
              </th>
            </tr>
            <tr className="bg-[#E9EFF7]">
              <th className={`${thCls} text-left w-44`}>Nhóm</th>
              <th className={`${thCls} text-left w-28`}>Ngày</th>
              <th className={`${thCls} text-left`}>Nội dung</th>
              <th className={`${thCls} text-right w-32`}>Số tiền</th>
              <th className={`${thCls} text-left w-64`}>Thay đổi</th>
              <th className={`${thCls} text-center w-44`}>Khôi phục</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[15px] text-[#64748B]">Đang tải dữ liệu…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <p className="text-[15px] font-semibold text-[#64748B]">Chưa có thay đổi nào</p>
                  <p className="mt-1 text-[13px] text-[#94A3B8]">
                    Giao dịch bị xoá hoặc sửa sẽ xuất hiện ở đây để khôi phục lại.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((t) => (
                <tr key={t.id} className="odd:bg-[#FBFCFE] hover:bg-[#F1F5F9] transition-colors">
                  <td className="border-b border-[#EDF1F7] px-2 py-1.5 text-[15px] text-[#64748B]">
                    <span className="block truncate max-w-[170px]">{nameOf(t.group_id)}</span>
                  </td>
                  <td className="border-b border-[#EDF1F7] px-2 py-1.5 font-mono text-[13px] tabular-nums text-[#64748B]">
                    {d(t.date)}
                  </td>
                  <td className="border-b border-[#EDF1F7] px-2 py-1.5 text-[15px] font-medium text-[#0F172A]">
                    <span className="block truncate max-w-[240px]">{t.note || "—"}</span>
                  </td>
                  <td
                    className={`border-b border-[#EDF1F7] px-2 py-1.5 text-right font-mono text-[15px] font-bold tabular-nums ${
                      t.type === "in" ? "text-[#047857]" : "text-[#DC2626]"
                    }`}
                  >
                    {t.type === "in" ? "+" : "−"}
                    {fmt(t.amount)}
                  </td>
                  <td className="border-b border-[#EDF1F7] px-2 py-1.5 text-[13px] text-[#64748B]">
                    <span className="block truncate max-w-[240px]">{changeText(t)}</span>
                  </td>
                  <td className="border-b border-[#EDF1F7] px-2 py-1.5">
                    {canEdit ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onRestore(t)}
                          className="flex items-center gap-1.5 rounded-md border border-[#CBD5E6] px-2.5 py-1 text-[12px] font-semibold text-[#475569] hover:text-[#047857] hover:border-[#047857]/40 transition"
                          title="Khôi phục lại như trước"
                        >
                          <RotateCcw size={13} /> Khôi phục
                        </button>
                        {t.deleted_at && (
                          <button
                            onClick={() => onPurge(t.id)}
                            className="text-[#94A3B8] hover:text-[#DC2626] transition"
                            title="Xoá vĩnh viễn"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-center text-[11px] text-[#94A3B8]">Chỉ quản trị viên</p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}