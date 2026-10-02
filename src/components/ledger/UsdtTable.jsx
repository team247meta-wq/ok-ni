import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const d = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "");

const HeadCell = ({ children, className = "" }) => (
  <th className={`px-2 py-1.5 text-[12px] font-bold text-[#64748B] ${className}`}>{children}</th>
);

const Cell = ({ children, className = "" }) => (
  <td className={`border-b border-[#EDF1F7] px-2 py-1.5 align-middle ${className}`}>{children}</td>
);

export default function UsdtTable({
  items,
  totalUsdt,
  totalProfit,
  loading,
  onRemove,
  onEdit,
  canEdit,
  groupName = "LỢI NHUẬN USDT",
}) {
  return (
    <div className="rounded-xl border border-[#C9D5E6] bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[720px]">
          <thead>
            <tr>
              <th colSpan={5} className="border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-center">
                <span className="font-display text-lg font-extrabold text-[#0F172A] sm:text-xl">{groupName}</span>
              </th>
            </tr>
            <tr className="bg-[#E9EFF7]">
              <HeadCell className="text-left w-20">Ngày</HeadCell>
              <HeadCell className="text-left">Tên</HeadCell>
              <HeadCell className="text-right w-40">U xuất</HeadCell>
              <HeadCell className="text-right w-40">Lãi</HeadCell>
              <HeadCell className="w-12" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[15px] text-[#64748B]">Đang tải dữ liệu…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <p className="text-[15px] font-semibold text-[#64748B]">Chưa có lệnh nào</p>
                  <p className="mt-1 text-[13px] text-[#94A3B8]">Thêm từng lệnh: tên, số U xuất và lãi ở bảng điều khiển bên trái.</p>
                </td>
              </tr>
            ) : (
              items.map((t) => (
                <tr key={t.id} className="group/row odd:bg-[#FBFCFE] hover:bg-[#F1F5F9] transition-colors">
                  <Cell className="font-mono text-[13px] tabular-nums text-[#64748B]">{d(t.date)}</Cell>
                  <Cell className="text-[15px] font-medium text-[#0F172A]">
                    <span className="block truncate max-w-[280px]">{t.note || "—"}</span>
                  </Cell>
                  <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#B45309]">
                    {t.usdt_out ? fmt(t.usdt_out) : <span className="text-[#CBD5E1]">—</span>}
                  </Cell>
                  <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#047857]">
                    {fmt(t.amount)}
                  </Cell>
                  <Cell className="text-center">
                    {canEdit ? (
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition">
                        <button onClick={() => onEdit(t)} className="text-[#94A3B8] hover:text-[#B45309]" title="Sửa">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onRemove(t.id)} className="text-[#94A3B8] hover:text-[#DC2626]" title="Xoá">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ) : null}
                  </Cell>
                </tr>
              ))
            )}

            <tr>
              <td colSpan={5} className="h-1.5 bg-white" />
            </tr>
            <tr className="bg-[#E9EFF7]">
              <Cell colSpan={2} className="text-[15px] font-bold text-[#0F172A] border-b-0">
                TỔNG CỘNG
              </Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#B45309] border-b-0">
                {fmt(totalUsdt)}
              </Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#047857] border-b-0">
                {fmt(totalProfit)}
              </Cell>
              <Cell className="border-b-0" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}