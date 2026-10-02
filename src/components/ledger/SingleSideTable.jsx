import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const d = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");

const thCls = "px-3 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#475569]";

// Mỗi ngày là một bảng riêng: gom các khoản theo ngày, ngày mới nhất lên trước.
const groupByDay = (items) => {
  const map = new Map();
  items.forEach((t) => {
    const key = (t.date || "").slice(0, 10);
    const day = map.get(key) || { date: key, items: [], total: 0 };
    day.items.push(t);
    day.total += t.amount || 0;
    map.set(key, day);
  });
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
};

export default function SingleSideTable({
  items = [],
  total = 0,
  loading,
  onRemove,
  onEdit,
  canEdit,
  groupName = "",
  sideLabel = "",
  totalLabel = "",
  sign = "+",
  tone = "text-[#B91C1C]",
  bandTone = "bg-[#FEF2F2] text-[#B91C1C]",
  emptyText = "Chưa có dữ liệu",
}) {
  const days = groupByDay(items);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="bg-[#0F172A] px-4 py-2.5 text-center">
        <span className="block break-words font-display text-[17px] font-extrabold tracking-tight text-white sm:text-lg">
          {groupName}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                colSpan={3}
                className={`border-b border-[#E2E8F0] py-2 text-center text-[13px] font-bold uppercase tracking-[0.08em] ${bandTone}`}
              >
                {sideLabel}
              </th>
            </tr>
            <tr className="bg-[#F8FAFC]">
              <th className={`${thCls} text-left`}>Nội dung</th>
              <th className={`${thCls} text-right`}>Số tiền</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-[15px] text-[#64748B]">
                  Đang tải dữ liệu…
                </td>
              </tr>
            ) : days.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 text-center">
                  <p className="text-[15px] font-semibold text-[#64748B]">{emptyText}</p>
                  <p className="mt-1 text-[13px] text-[#94A3B8]">Thêm ở bảng điều khiển bên trái.</p>
                </td>
              </tr>
            ) : (
              days.map((day) => (
                <React.Fragment key={day.date || "none"}>
                  <tr className="bg-[#F1F5F9]">
                    <td className="border-y border-[#E2E8F0] px-3 py-2 text-left">
                      <span className="font-mono text-[13px] font-bold tabular-nums text-[#334155]">
                        {d(day.date)}
                      </span>
                      <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        {day.items.length} khoản
                      </span>
                    </td>
                    <td className="whitespace-nowrap border-y border-[#E2E8F0] px-3 py-2 text-right">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        Tổng ngày
                      </span>
                      <span className={`ml-2 font-mono text-[13px] font-bold tabular-nums ${tone}`}>
                        {fmt(day.total)}
                      </span>
                    </td>
                    <td className="border-y border-[#E2E8F0]" />
                  </tr>
                  {day.items.map((t) => (
                    <tr key={t.id} className="group/row bg-white transition-colors hover:bg-[#F8FAFC]">
                      <td className="border-b border-[#EEF2F6] px-3 py-2.5 text-[14px] font-medium text-[#0F172A]">
                        {t.note || <span className="text-[#CBD5E1]">—</span>}
                      </td>
                      <td
                        className={`whitespace-nowrap border-b border-[#EEF2F6] px-3 py-2.5 text-right font-mono text-[15px] font-bold tabular-nums ${tone}`}
                      >
                        {sign}
                        {fmt(t.amount)}
                      </td>
                      <td className="border-b border-[#EEF2F6] px-2 py-2.5 text-center">
                        {canEdit && (
                          <div className="flex items-center justify-center gap-1.5 opacity-0 transition group-hover/row:opacity-100">
                            <button
                              onClick={() => onEdit(t)}
                              className="text-[#94A3B8] hover:text-[#B45309]"
                              title="Sửa"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => onRemove(t.id)}
                              className="text-[#94A3B8] hover:text-[#DC2626]"
                              title="Xoá"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}

            <tr>
              <td colSpan={3} className="h-1 bg-white" />
            </tr>
            <tr className="bg-[#F8FAFC]">
              <td className="border-t-2 border-[#0F172A] px-3 py-2.5 text-right text-[13px] font-bold uppercase tracking-wide text-[#0F172A]">
                {totalLabel}
              </td>
              <td
                className={`whitespace-nowrap border-t-2 border-[#0F172A] px-3 py-2.5 text-right font-mono text-[15px] font-bold tabular-nums ${tone}`}
              >
                {fmt(total)}
              </td>
              <td className="border-t-2 border-[#0F172A]" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}