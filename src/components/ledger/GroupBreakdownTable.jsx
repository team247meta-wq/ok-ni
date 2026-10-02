import React from "react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const signed = (n) => `${n < 0 ? "−" : "+"}${fmt(Math.abs(n))}`;

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

export default function GroupBreakdownTable({ rows, loading }) {
  const totals = rows.reduce(
    (a, r) => ({
      totalIn: a.totalIn + r.totalIn,
      fee: a.fee + r.fee,
      totalOut: a.totalOut + r.totalOut,
      afterFee: a.afterFee + r.afterFee,
    }),
    { totalIn: 0, fee: 0, totalOut: 0, afterFee: 0 }
  );

  // Tiền vào trừ phí (lợi nhuận của công ty) rồi trừ tiền ra (khách đang nợ):
  // phần còn lại là tiền công ty còn giữ của khách, phải thanh toán lại.
  const payTotal = rows.reduce((s, r) => s + r.afterFee, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-[#C9D5E6] bg-white shadow-sm">
      <div className="border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-1.5 text-center">
        <span className="font-display text-lg font-extrabold text-[#0F172A] sm:text-xl">
          TỔNG CÁC CTY
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <HeadCell className="text-left">Nhóm</HeadCell>
              <HeadCell className="w-32 text-right">Tiền vào</HeadCell>
              <HeadCell className="w-32 text-right">Tiền ra</HeadCell>
              <HeadCell className="w-28 text-right">Phí</HeadCell>
              <HeadCell className="w-32 text-right">Sau phí</HeadCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[15px] text-[#64748B]">
                  Đang tải dữ liệu…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-10 text-center">
                  <p className="text-[15px] font-semibold text-[#64748B]">Chưa có giao dịch nào</p>
                  <p className="mt-1 text-[13px] text-[#94A3B8]">
                    Mỗi nhóm dùng mức phí riêng, đặt ở Cấu hình nhóm.
                  </p>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="odd:bg-[#FBFCFE] hover:bg-[#F1F5F9] transition-colors">
                  <Cell className="break-words text-[15px] font-medium text-[#0F172A]">{r.name}</Cell>
                  <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#047857]">
                    {r.totalIn ? `+${fmt(r.totalIn)}` : <span className="text-[#CBD5E1]">—</span>}
                  </Cell>
                  <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#DC2626]">
                    {r.totalOut ? `−${fmt(r.totalOut)}` : <span className="text-[#CBD5E1]">—</span>}
                  </Cell>
                  <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#B45309]">
                    {r.fee ? `−${fmt(r.fee)}` : <span className="text-[#CBD5E1]">—</span>}
                  </Cell>
                  <Cell
                    className={`text-right font-mono text-[15px] font-bold tabular-nums ${
                      r.afterFee < 0 ? "text-[#DC2626]" : "text-[#047857]"
                    }`}
                  >
                    {r.totalIn || r.totalOut ? signed(r.afterFee) : <span className="text-[#CBD5E1]">—</span>}
                  </Cell>
                </tr>
              ))
            )}

            <tr>
              <td colSpan={5} className="h-1.5 bg-white" />
            </tr>
            <tr className="bg-[#E9EFF7]">
              <Cell className="text-[15px] font-bold text-[#0F172A] border-b-0">TỔNG CỘNG</Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#047857] border-b-0">
                +{fmt(totals.totalIn)}
              </Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#DC2626] border-b-0">
                −{fmt(totals.totalOut)}
              </Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#B45309] border-b-0">
                −{fmt(totals.fee)}
              </Cell>
              <Cell
                className={`text-right font-mono text-[15px] font-bold tabular-nums border-b-0 ${
                  totals.afterFee < 0 ? "text-[#DC2626]" : "text-[#047857]"
                }`}
              >
                {signed(totals.afterFee)}
              </Cell>
            </tr>
            <tr className="bg-[#FDECEC]">
              <Cell className="text-[15px] font-bold text-[#B91C1C] border-b-0">
                CÔNG TY CẦN THANH TOÁN TIẾP
              </Cell>
              <Cell className="border-b-0" />
              <Cell className="border-b-0" />
              <Cell className="border-b-0" />
              <Cell className="text-right font-mono text-[15px] font-extrabold tabular-nums text-[#B91C1C] border-b-0">
                {fmt(payTotal)}
              </Cell>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}