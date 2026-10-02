import React from "react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));

const d = (s) => {
  if (!s) return "—";
  const [y, m, day] = s.split("-");
  return day ? `${day}/${m}/${y}` : s;
};

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

// Gom các nhóm theo ngày: mỗi ngày là một dải ngang, bên dưới là các nhóm của ngày đó.
const groupByDay = (rows) => {
  const days = [];
  const map = new Map();
  rows.forEach((r) => {
    const key = r.date || "";
    if (!map.has(key)) {
      const day = { date: key, rows: [], fee: 0 };
      map.set(key, day);
      days.push(day);
    }
    const day = map.get(key);
    day.rows.push(r);
    day.fee += r.fee || 0;
  });
  return days;
};

export default function ProfitTable({
  rows = [],
  totals,
  loading,
  groupName = "LỢI NHUẬN CÔNG TY",
  emptyText = "Chưa có nhóm nào có giao dịch trong kỳ này",
}) {
  const t =
    totals ||
    rows.reduce(
      (a, r) => ({
        totalIn: a.totalIn + r.totalIn,
        totalOut: a.totalOut + r.totalOut,
        fee: a.fee + r.fee,
      }),
      { totalIn: 0, totalOut: 0, fee: 0 }
    );

  const days = groupByDay(rows);

  return (
    <div className="overflow-hidden rounded-xl border border-[#C9D5E6] bg-white shadow-sm">
      <div className="border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-center">
        <span className="font-display text-lg font-extrabold text-[#0F172A] sm:text-xl">{groupName}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <HeadCell className="text-left">Nhóm</HeadCell>
              <HeadCell className="w-24 text-right">Mức phí</HeadCell>
              <HeadCell className="w-32 text-right">Tiền vào</HeadCell>
              <HeadCell className="w-32 text-right">Tiền ra</HeadCell>
              <HeadCell className="w-32 text-right">Lợi nhuận (phí)</HeadCell>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-[13px] font-medium text-[#94A3B8]">
                  Đang tải dữ liệu…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-10 text-center text-[13px] font-medium text-[#94A3B8]">
                  {emptyText}
                </td>
              </tr>
            ) : (
              days.map((day) => (
                <React.Fragment key={day.date || "none"}>
                  <tr className="bg-[#F1F5F9]">
                    <td colSpan={4} className="border-y border-[#E2E8F0] px-3 py-2 text-left">
                      <span className="font-mono text-[13px] font-bold tabular-nums text-[#334155]">
                        {d(day.date)}
                      </span>
                      <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                        {day.rows.length} nhóm · Tổng ngày
                      </span>
                    </td>
                    <td className="border-y border-[#E2E8F0] px-3 py-2 text-right font-mono text-[13px] font-bold tabular-nums text-[#047857]">
                      {fmt(day.fee)}
                    </td>
                  </tr>
                  {day.rows.map((r) => (
                    <tr key={`${r.date}-${r.groupId}`} className="odd:bg-[#FBFCFE] hover:bg-[#F8FAFC]">
                      <Cell className="break-words text-[15px] font-medium text-[#0F172A]">
                        {r.groupName}
                      </Cell>
                      <Cell className="text-right font-mono text-[13px] font-semibold tabular-nums text-[#64748B]">
                        {r.rate}%
                      </Cell>
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
                  ))}
                </React.Fragment>
              ))
            )}

            <tr>
              <td colSpan={5} className="h-1.5 bg-white" />
            </tr>
            <tr className="bg-[#F0FFF4]">
              <Cell colSpan={2} className="border-t-2 border-[#0E9F6E] text-[13px] font-bold text-[#047857]">
                TỔNG LỢI NHUẬN
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