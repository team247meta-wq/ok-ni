// Lợi nhuận công ty: mỗi ngày, từng nhóm tổ hiển thị tổng tiền vào, tổng tiền ra
// và phí = tổng vào × mức phí (%) của nhóm đó.
// Chỉ tính các nhóm tổ (nhóm thường, không phải nhóm chi tiêu / lợi nhuận / USDT).
// Lợi nhuận tổng = tổng phí của tất cả các nhóm tổ.
export function buildProfitRows(transactions, groups) {
  const byId = new Map(groups.map((g) => [g.id, g]));
  const map = new Map();

  transactions.forEach((t) => {
    const g = byId.get(t.group_id);
    if (!g) return;
    if (g.mode && g.mode !== "full") return;
    const date = (t.date || "").slice(0, 10);
    const key = `${date}|${g.id}`;
    const row =
      map.get(key) ||
      { date, groupId: g.id, groupName: g.name, rate: g.fee_rate ?? 0, totalIn: 0, totalOut: 0 };
    if (t.type === "in") row.totalIn += t.amount || 0;
    else row.totalOut += t.amount || 0;
    map.set(key, row);
  });

  const rows = Array.from(map.values())
    .map((r) => ({ ...r, fee: r.totalIn * (r.rate / 100) }))
    .sort((a, b) =>
      a.date === b.date ? (a.groupName < b.groupName ? -1 : 1) : a.date < b.date ? 1 : -1
    );

  return { rows, totals: profitTotals(rows) };
}

export function filterProfitRows(rows, period) {
  if (!period || period.mode === "all") return rows;
  const key = (date) => (period.mode === "day" ? date : (date || "").slice(0, 7));
  return rows.filter(
    (r) => (!period.from || key(r.date) >= period.from) && (!period.to || key(r.date) <= period.to)
  );
}

export function profitTotals(rows) {
  return rows.reduce(
    (a, r) => ({
      totalIn: a.totalIn + r.totalIn,
      totalOut: a.totalOut + r.totalOut,
      fee: a.fee + r.fee,
    }),
    { totalIn: 0, totalOut: 0, fee: 0 }
  );
}

// Gộp lợi nhuận theo từng tháng: tổng vào, tổng ra và tổng phí (lợi nhuận) của cả tháng.
export function buildMonthlyProfit(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const month = (r.date || "").slice(0, 7);
    const m = map.get(month) || { month, totalIn: 0, totalOut: 0, fee: 0 };
    m.totalIn += r.totalIn;
    m.totalOut += r.totalOut;
    m.fee += r.fee;
    map.set(month, m);
  });
  const list = Array.from(map.values()).sort((a, b) => (a.month < b.month ? 1 : -1));
  return { rows: list, totals: profitTotals(list) };
}

// Gộp lợi nhuận theo từng ngày: tổng vào, tổng ra và tổng phí (lợi nhuận) của cả ngày.
export function buildDailyProfit(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const date = (r.date || "").slice(0, 10);
    const d = map.get(date) || { date, totalIn: 0, totalOut: 0, fee: 0 };
    d.totalIn += r.totalIn;
    d.totalOut += r.totalOut;
    d.fee += r.fee;
    map.set(date, d);
  });
  const list = Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  return { rows: list, totals: profitTotals(list) };
}