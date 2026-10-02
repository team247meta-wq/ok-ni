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

export default function DailySummaryTable({ rows, totals, loading, groupName = "TỔNG CÔNG TY" }) {
  const { totalIn, totalOut, afterFee = totalIn - totalOut } = totals;

  return (
    <div className="overflow-hidden rounded-xl border border-[#C9D5E6] bg-white shadow-sm">
      <div className="border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-center">
        <span className="font-display text-lg font-extrabold text-[#0F172A] sm:text-xl">
          {groupName}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <HeadCell className="text-left">Ngày</HeadCell>
              <HeadCell className="w-32 text-right">Tiền vào</HeadCell>
              <HeadCell className="w-32 text-right">Tiền ra</HeadCell>
              <HeadCell className="w-32 text-right">Sau phí</HeadCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[15px] text-[#64748B]">
                  Đang tải dữ liệu…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center">
                  <p className="text-[15px] font-semibold text-[#64748B]">Chưa có giao dịch nào</p>
                  <p className="mt-1 text-[13px] text-[#94A3B8]">
                    Thêm giao dịch ở các nhóm để xem tổng hợp theo ngày.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const diff = r.afterFee ?? r.totalIn - r.totalOut;
                return (
                  <tr key={r.date} className="odd:bg-[#FBFCFE] hover:bg-[#F1F5F9] transition-colors">
                    <Cell className="font-mono text-[13px] tabular-nums text-[#64748B]">{d(r.date)}</Cell>
                    <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#047857]">
                      {r.totalIn ? `+${fmt(r.totalIn)}` : <span className="text-[#CBD5E1]">—</span>}
                    </Cell>
                    <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#DC2626]">
                      {r.totalOut ? `−${fmt(r.totalOut)}` : <span className="text-[#CBD5E1]">—</span>}
                    </Cell>
                    <Cell
                      className={`text-right font-mono text-[15px] font-bold tabular-nums ${
                        diff < 0 ? "text-[#DC2626]" : "text-[#047857]"
                      }`}
                    >
                      {fmt(diff)}
                    </Cell>
                  </tr>
                );
              })
            )}

            <tr>
              <td colSpan={4} className="h-1.5 bg-white" />
            </tr>
            <tr className="bg-[#E9EFF7]">
              <Cell className="text-[15px] font-bold text-[#0F172A] border-b-0">TỔNG CỘNG</Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#047857] border-b-0">
                {fmt(totalIn)}
              </Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#DC2626] border-b-0">
                {fmt(totalOut)}
              </Cell>
              <Cell
                className={`text-right font-mono text-[15px] font-bold tabular-nums border-b-0 ${
                  afterFee < 0 ? "text-[#DC2626]" : "text-[#047857]"
                }`}
              >
                {fmt(afterFee)}
              </Cell>
            </tr>
            <tr className="bg-[#FDECEC]">
              <Cell
                colSpan={3}
                className="border-b-0 text-right text-[13px] font-bold uppercase tracking-wide text-[#B91C1C]"
              >
                Công ty cần thanh toán tiếp
              </Cell>
              <Cell className="border-b-0 text-right font-mono text-[15px] font-extrabold tabular-nums text-[#B91C1C]">
                {fmt(afterFee)}
              </Cell>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}