import React from "react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const d = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");

const HeadCell = ({ children, className = "" }) => (
  <th className={`border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-[12px] font-bold text-[#475569] ${className}`}>
    {children}
  </th>
);

const Cell = ({ children, className = "", ...rest }) => (
  <td className={`border-b border-[#EDF1F7] px-3 py-1.5 align-middle ${className}`} {...rest}>
    {children}
  </td>
);

export default function ProfitDailyTable({ rows = [], totals, loading }) {
  const t = totals || { totalIn: 0, totalOut: 0, fee: 0 };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[#C9D5E6] bg-white shadow-sm">
      <div className="border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-center">
        <span className="font-display text-lg font-extrabold text-[#0F172A] sm:text-xl">
          LỢI NHUẬN THEO NGÀY
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <HeadCell className="text-left">Ngày</HeadCell>
              <HeadCell className="w-32 text-right">Tiền vào</HeadCell>
              <HeadCell className="w-32 text-right">Tiền ra</HeadCell>
              <HeadCell className="w-36 text-right">Lợi nhuận (phí)</HeadCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[13px] font-medium text-[#94A3B8]">
                  Đang tải dữ liệu…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-[13px] font-medium text-[#94A3B8]">
                  Chưa có dữ liệu ngày nào
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.date} className="odd:bg-[#FBFCFE] hover:bg-[#F8FAFC]">
                  <Cell className="text-[15px] font-semibold text-[#0F172A]">{d(r.date)}</Cell>
                  <Cell className="text-right font-mono text-[14px] tabular-nums text-[#047857]">
                    {fmt(r.totalIn)}
                  </Cell>
                  <Cell className="text-right font-mono text-[14px] tabular-nums text-[#DC2626]">
                    {fmt(r.totalOut)}
                  </Cell>
                  <Cell className="text-right font-mono text-[14px] font-bold tabular-nums text-[#047857]">
                    {fmt(r.fee)}
                  </Cell>
                </tr>
              ))
            )}

            <tr>
              <td colSpan={4} className="h-1.5 bg-white" />
            </tr>
            <tr className="bg-[#F0FFF4]">
              <Cell className="border-t-2 border-[#0E9F6E] text-[13px] font-bold text-[#047857]">
                TỔNG CỘNG
              </Cell>
              <Cell className="border-t-2 border-[#0E9F6E] text-right font-mono text-[14px] font-bold tabular-nums text-[#047857]">
                {fmt(t.totalIn)}
              </Cell>
              <Cell className="border-t-2 border-[#0E9F6E] text-right font-mono text-[14px] font-bold tabular-nums text-[#DC2626]">
                {fmt(t.totalOut)}
              </Cell>
              <Cell className="border-t-2 border-[#0E9F6E] text-right font-mono text-[15px] font-extrabold tabular-nums text-[#047857]">
                {fmt(t.fee)}
              </Cell>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}