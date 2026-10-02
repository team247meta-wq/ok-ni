import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const SHEET_TITLE = "Sổ quỹ Tổ 2 Tuyển dụng";
const TAB_LEDGER = "SỔ QUỸ";
const TAB_SUMMARY = "TỔNG HỢP";

const COLORS = {
  titleBg: "#0F172A",
  titleFg: "#FFFFFF",
  subBg: "#F1F5F9",
  subFg: "#64748B",
  sectionBg: "#E9EFF7",
  sectionFg: "#0F172A",
  headBg: "#1E293B",
  headFg: "#FFFFFF",
  totalBg: "#E2E8F0",
  totalFg: "#0F172A",
  green: "#047857",
  red: "#DC2626",
};

const rgb = (hex) => ({
  red: parseInt(hex.slice(1, 3), 16) / 255,
  green: parseInt(hex.slice(3, 5), 16) / 255,
  blue: parseInt(hex.slice(5, 7), 16) / 255,
});

const MONEY = { numberFormat: { type: "NUMBER", pattern: "#,##0" } };

const vnDate = (v) => {
  const s = String(v || "").slice(0, 10);
  const [y, m, d] = s.split("-");
  return y && m && d ? `${d}/${m}/${y}` : "";
};

const monthLabel = (m) => {
  const [y, mm] = String(m || "").split("-");
  return y ? `Tháng ${mm}/${y}` : "";
};

const vnTime = (iso) =>
  new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });

const feeOf = (amount, rate) => (amount || 0) * ((rate ?? 0) / 100);
// Chỉ nhóm tổ (chế độ "full") mới tính phí.
const hasFee = (g) => !g || !g.mode || g.mode === "full";

const modeLabel = (g) =>
  g.mode === "expense"
    ? "Chi tiêu"
    : g.mode === "profit"
    ? "Lợi nhuận"
    : g.mode === "usdt"
    ? "USDT"
    : "Đầy đủ";

const quoteTab = (title) => `'${String(title).replace(/'/g, "''")}'`;

const cleanTabName = (name) => {
  const s = String(name || "")
    .replace(/[[\]*?/\\:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
  return s || "NHÓM";
};

const uniqueName = (base, used) => {
  let name = base;
  let i = 2;
  while (used.has(name)) name = `${base} (${i++})`;
  used.add(name);
  return name;
};

// ===== dựng nội dung từng trang tính =====

const newTab = (title, lastCol) => ({
  title,
  lastCol,
  rows: [],
  headRows: [],
  sectionRows: [],
  dayRows: [],
  totalRows: [],
  tones: [],
  moneyCols: [],
  colWidths: [],
  frozenRows: 2,
});

const addRow = (tab, cells, kind, tone) => {
  tab.rows.push(cells);
  const row = tab.rows.length - 1;
  if (kind === "head") tab.headRows.push(row);
  else if (kind === "section") tab.sectionRows.push(row);
  else if (kind === "day") tab.dayRows.push(row);
  else if (kind === "total") tab.totalRows.push(row);
  if (tone) tab.tones.push({ row, ...tone });
  return row;
};

const blankRow = (tab) => addRow(tab, []);

// ----- lợi nhuận (giống công thức trên app) -----
const profitTotals = (rows) =>
  rows.reduce(
    (a, r) => ({
      totalIn: a.totalIn + r.totalIn,
      totalOut: a.totalOut + r.totalOut,
      fee: a.fee + r.fee,
    }),
    { totalIn: 0, totalOut: 0, fee: 0 }
  );

const buildProfitRows = (tx, groups) => {
  const byId = new Map(groups.map((g) => [g.id, g]));
  const map = new Map();
  tx.forEach((t) => {
    const g = byId.get(t.group_id);
    if (!g) return;
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
};

const buildDailyProfit = (rows) => {
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
};

const buildMonthlyProfit = (rows) => {
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
};

// ----- trang SỔ QUỸ: toàn bộ giao dịch -----
const buildLedgerTab = (tx, groups, now) => {
  const tab = newTab(TAB_LEDGER, 6);
  tab.colWidths = [190, 100, 95, 130, 60, 120, 240];
  tab.moneyCols = [3, 5];
  tab.frozenRows = 4;

  addRow(tab, ["SỔ QUỸ TỔ 2 TUYỂN DỤNG"]);
  addRow(tab, [`Cập nhật: ${vnTime(now)}`]);
  blankRow(tab);
  addRow(tab, ["Nhóm", "Ngày", "Loại", "Số tiền", "Phí %", "Phí", "Ghi chú"], "head");

  const byId = new Map(groups.map((g) => [g.id, g]));
  tx.forEach((t) => {
    const g = byId.get(t.group_id);
    const applies = hasFee(g);
    const rate = t.type === "in" ? g?.fee_rate ?? 6 : g?.out_fee_rate ?? 6;
    addRow(
      tab,
      [
        g?.name || "—",
        vnDate(t.date),
        t.type === "in" ? "Tiền vào" : "Tiền ra",
        t.amount || 0,
        applies ? rate : "",
        applies ? feeOf(t.amount, rate) : 0,
        t.note || "",
      ],
      null,
      { col: 3, tone: t.type }
    );
  });

  const totalIn = tx.filter((t) => t.type === "in").reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = tx.filter((t) => t.type === "out").reduce((s, t) => s + (t.amount || 0), 0);
  const feeIn = tx
    .filter((t) => t.type === "in" && hasFee(byId.get(t.group_id)))
    .reduce((s, t) => s + feeOf(t.amount, byId.get(t.group_id)?.fee_rate ?? 6), 0);
  const feeOut = tx
    .filter((t) => t.type === "out" && hasFee(byId.get(t.group_id)))
    .reduce((s, t) => s + feeOf(t.amount, byId.get(t.group_id)?.out_fee_rate ?? 6), 0);

  blankRow(tab);
  addRow(tab, ["TỔNG VÀO", "", "", totalIn, "", feeIn, ""], "total");
  addRow(tab, ["TỔNG RA", "", "", totalOut, "", feeOut, ""], "total");
  addRow(tab, ["SAU PHÍ", "", "", totalIn - feeIn - totalOut - feeOut, "", "", ""], "total");
  return tab;
};

// ----- trang riêng cho từng nhóm -----
const buildGroupTab = (group, tx, groups, now, usedNames) => {
  const mode = group.mode || "full";
  const rate = group.fee_rate ?? 6;
  const outRate = group.out_fee_rate ?? 6;
  const mine = tx.filter((t) => t.group_id === group.id);

  const lastCol = mode === "expense" ? 2 : mode === "usdt" ? 3 : 5;
  const tab = newTab(uniqueName(cleanTabName(group.name), usedNames), lastCol);
  tab.frozenRows = 2;

  addRow(tab, [group.name]);
  addRow(tab, [`Cập nhật: ${vnTime(now)}`]);
  blankRow(tab);

  if (mode === "expense") {
    tab.colWidths = [110, 150, 320];
    tab.moneyCols = [1];
    addRow(tab, ["CHI TIÊU"], "section");
    addRow(tab, ["Ngày", "Số tiền", "Nội dung"], "head");
    if (mine.length === 0) addRow(tab, ["Chưa có khoản chi nào"]);

    // Mỗi ngày một khối riêng, kèm tổng của ngày đó.
    const dayMap = new Map();
    mine.forEach((t) => {
      const key = (t.date || "").slice(0, 10);
      const day = dayMap.get(key) || { date: key, items: [], total: 0 };
      day.items.push(t);
      day.total += t.amount || 0;
      dayMap.set(key, day);
    });
    Array.from(dayMap.values())
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach((day) => {
        addRow(tab, [vnDate(day.date), day.total, `${day.items.length} khoản`], "day", {
          col: 1,
          tone: "out",
        });
        day.items.forEach((t) =>
          addRow(tab, ["", t.amount || 0, t.note || ""], null, { col: 1, tone: "out" })
        );
      });

    const total = mine.reduce((s, t) => s + (t.amount || 0), 0);
    blankRow(tab);
    addRow(tab, ["TỔNG CHI TIÊU", total, ""], "total");
    return tab;
  }

  if (mode === "usdt") {
    tab.colWidths = [110, 300, 140, 150];
    tab.moneyCols = [2, 3];
    addRow(tab, ["U XUẤT & LÃI"], "section");
    addRow(tab, ["Ngày", "Tên", "U xuất", "Lãi"], "head");
    if (mine.length === 0) addRow(tab, ["Chưa có lệnh nào"]);
    mine.forEach((t) => addRow(tab, [vnDate(t.date), t.note || "", t.usdt_out || 0, t.amount || 0]));
    const totalUsdt = mine.reduce((s, t) => s + (t.usdt_out || 0), 0);
    const totalProfit = mine.reduce((s, t) => s + (t.amount || 0), 0);
    blankRow(tab);
    addRow(tab, ["TỔNG CỘNG", "", totalUsdt, totalProfit], "total");
    return tab;
  }

  if (mode === "profit") {
    tab.colWidths = [110, 190, 90, 150, 150, 160];
    tab.moneyCols = [3, 4, 5];

    const { rows, totals } = buildProfitRows(tx, groups);
    const daily = buildDailyProfit(rows);
    const monthly = buildMonthlyProfit(rows);

    addRow(tab, ["LỢI NHUẬN THEO NHÓM"], "section");
    addRow(tab, ["Ngày", "Nhóm", "Mức phí", "Tiền vào", "Tiền ra", "Lợi nhuận (phí)"], "head");
    if (rows.length === 0) addRow(tab, ["Chưa có nhóm nào có giao dịch"]);
    rows.forEach((r) =>
      addRow(tab, [vnDate(r.date), r.groupName, `${r.rate}%`, r.totalIn, r.totalOut, r.fee])
    );
    blankRow(tab);
    addRow(tab, ["TỔNG LỢI NHUẬN", "", "", totals.totalIn, totals.totalOut, totals.fee], "total");
    blankRow(tab);

    addRow(tab, ["LỢI NHUẬN THEO NGÀY"], "section");
    addRow(tab, ["Ngày", "", "", "Tiền vào", "Tiền ra", "Lợi nhuận (phí)"], "head");
    daily.rows.forEach((r) => addRow(tab, [vnDate(r.date), "", "", r.totalIn, r.totalOut, r.fee]));
    blankRow(tab);
    addRow(
      tab,
      ["TỔNG CỘNG", "", "", daily.totals.totalIn, daily.totals.totalOut, daily.totals.fee],
      "total"
    );
    blankRow(tab);

    addRow(tab, ["LỢI NHUẬN CẢ THÁNG"], "section");
    addRow(tab, ["Tháng", "", "", "Tiền vào", "Tiền ra", "Lợi nhuận (phí)"], "head");
    monthly.rows.forEach((r) => addRow(tab, [monthLabel(r.month), "", "", r.totalIn, r.totalOut, r.fee]));
    blankRow(tab);
    addRow(
      tab,
      ["TỔNG CỘNG", "", "", monthly.totals.totalIn, monthly.totals.totalOut, monthly.totals.fee],
      "total"
    );
    return tab;
  }

  // chế độ đầy đủ
  tab.colWidths = [110, 100, 140, 70, 130, 260];
  tab.moneyCols = [2, 4];
  addRow(tab, ["SỔ QUỸ"], "section");
  addRow(tab, ["Ngày", "Loại", "Số tiền", "Phí %", "Phí", "Ghi chú"], "head");
  if (mine.length === 0) addRow(tab, ["Chưa có giao dịch nào"]);
  mine.forEach((t) => {
    const r = t.type === "in" ? rate : outRate;
    addRow(
      tab,
      [
        vnDate(t.date),
        t.type === "in" ? "Tiền vào" : "Tiền ra",
        t.amount || 0,
        r,
        feeOf(t.amount, r),
        t.note || "",
      ],
      null,
      { col: 2, tone: t.type }
    );
  });

  const totalIn = mine.filter((t) => t.type === "in").reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = mine.filter((t) => t.type === "out").reduce((s, t) => s + (t.amount || 0), 0);
  const feeIn = feeOf(totalIn, rate);
  const feeOut = feeOf(totalOut, outRate);

  blankRow(tab);
  addRow(tab, ["TỔNG VÀO", "", totalIn, "", "", ""], "total");
  addRow(tab, ["TỔNG RA", "", totalOut, "", "", ""], "total");
  addRow(tab, [`PHÍ VÀO (${rate}%)`, "", "", "", feeIn, ""], "total");
  addRow(tab, [`PHÍ RA (${outRate}%)`, "", "", "", feeOut, ""], "total");
  addRow(tab, ["SAU PHÍ", "", totalIn - feeIn - totalOut - feeOut, "", "", ""], "total");
  return tab;
};

// ----- trang TỔNG HỢP -----
const buildSummaryTab = (groups, tx, now) => {
  const tab = newTab(TAB_SUMMARY, 6);
  tab.colWidths = [190, 95, 110, 140, 140, 120, 140];
  tab.moneyCols = [3, 4, 5, 6];
  tab.frozenRows = 4;

  addRow(tab, ["TỔNG CÁC CTY"]);
  addRow(tab, [`Cập nhật: ${vnTime(now)}`]);
  blankRow(tab);
  addRow(
    tab,
    ["Nhóm", "Chế độ", "Số giao dịch", "Tiền vào", "Tiền ra", "Phí", "Sau phí"],
    "head"
  );

  // Bảng TỔNG CÁC CTY chỉ liệt kê các nhóm thuộc Nhóm tổ (bỏ nhóm khối công ty).
  const perGroup = groups
    .filter((g) => !g.mode || g.mode === "full")
    .map((g) => {
      const ts = tx.filter((t) => t.group_id === g.id);
      const gin = ts.filter((t) => t.type === "in").reduce((s, t) => s + (t.amount || 0), 0);
      const gout = ts.filter((t) => t.type === "out").reduce((s, t) => s + (t.amount || 0), 0);
      const gfee = hasFee(g) ? feeOf(gin, g.fee_rate ?? 6) + feeOf(gout, g.out_fee_rate ?? 6) : 0;
      return { g, count: ts.length, gin, gout, gfee, afterFee: gin - gfee - gout };
    });

  let sumIn = 0;
  let sumOut = 0;
  let sumFee = 0;
  perGroup.forEach((r) => {
    sumIn += r.gin;
    sumOut += r.gout;
    sumFee += r.gfee;
    addRow(tab, [r.g.name, modeLabel(r.g), r.count, r.gin, r.gout, r.gfee, r.afterFee]);
  });

  // Tiền vào trừ phí (lợi nhuận của công ty) rồi trừ tiền ra (khách đang nợ):
  // phần còn lại là tiền công ty còn giữ của khách, phải thanh toán lại.
  const payTotal = perGroup.reduce((s, r) => s + r.afterFee, 0);

  blankRow(tab);
  addRow(
    tab,
    ["TỔNG CỘNG", "", tx.length, sumIn, sumOut, sumFee, sumIn - sumFee - sumOut],
    "total"
  );
  addRow(tab, ["CÔNG TY CẦN THANH TOÁN", "", "", "", "", "", payTotal], "total", {
    col: 6,
    tone: "out",
  });

  return tab;
};

// ===== định dạng =====

const cellFmt = (sheetId, r1, r2, c1, c2, format) => ({
  repeatCell: {
    range: {
      sheetId,
      startRowIndex: r1,
      endRowIndex: r2,
      startColumnIndex: c1,
      endColumnIndex: c2,
    },
    cell: { userEnteredFormat: format },
    fields: Object.keys(format).map((k) => `userEnteredFormat.${k}`).join(","),
  },
});

const formatTab = (tab, sheetId, order) => {
  const reqs = [];
  const last = tab.lastCol + 1;

  // Xoá định dạng cũ trước, tránh màu/nền của lần đồng bộ trước còn sót lại.
  reqs.push({
    repeatCell: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 2000, startColumnIndex: 0, endColumnIndex: 26 },
      cell: {},
      fields: "userEnteredFormat",
    },
  });

  reqs.push({
    mergeCells: {
      range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: last },
      mergeType: "MERGE_ALL",
    },
  });
  reqs.push(
    cellFmt(sheetId, 0, 1, 0, last, {
      horizontalAlignment: "CENTER",
      backgroundColor: rgb(COLORS.titleBg),
      textFormat: { bold: true, fontSize: 14, foregroundColor: rgb(COLORS.titleFg) },
    }),
    cellFmt(sheetId, 1, 2, 0, last, {
      backgroundColor: rgb(COLORS.subBg),
      textFormat: { italic: true, fontSize: 10, foregroundColor: rgb(COLORS.subFg) },
    })
  );

  tab.sectionRows.forEach((r) => {
    reqs.push({
      mergeCells: {
        range: { sheetId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: 0, endColumnIndex: last },
        mergeType: "MERGE_ALL",
      },
    });
    reqs.push(
      cellFmt(sheetId, r, r + 1, 0, last, {
        horizontalAlignment: "CENTER",
        backgroundColor: rgb(COLORS.sectionBg),
        textFormat: { bold: true, fontSize: 12, foregroundColor: rgb(COLORS.sectionFg) },
      })
    );
  });

  tab.headRows.forEach((r) =>
    reqs.push(
      cellFmt(sheetId, r, r + 1, 0, last, {
        backgroundColor: rgb(COLORS.headBg),
        textFormat: { bold: true, foregroundColor: rgb(COLORS.headFg) },
      })
    )
  );

  // Dòng tên ngày (mỗi ngày một khối riêng) — không gộp ô để vẫn thấy tổng ngày.
  tab.dayRows.forEach((r) =>
    reqs.push(
      cellFmt(sheetId, r, r + 1, 0, last, {
        backgroundColor: rgb(COLORS.subBg),
        textFormat: { bold: true, foregroundColor: rgb(COLORS.sectionFg) },
      })
    )
  );

  tab.totalRows.forEach((r) =>
    reqs.push(
      cellFmt(sheetId, r, r + 1, 0, last, {
        backgroundColor: rgb(COLORS.totalBg),
        textFormat: { bold: true, foregroundColor: rgb(COLORS.totalFg) },
      })
    )
  );

  tab.tones.slice(0, 1000).forEach(({ row, col, tone }) =>
    reqs.push(
      cellFmt(sheetId, row, row + 1, col, col + 1, {
        textFormat: { bold: true, foregroundColor: rgb(tone === "in" ? COLORS.green : COLORS.red) },
      })
    )
  );

  tab.moneyCols.forEach((c) =>
    reqs.push(cellFmt(sheetId, tab.frozenRows, Math.max(tab.rows.length, tab.frozenRows + 1), c, c + 1, MONEY))
  );

  tab.colWidths.forEach((px, i) => {
    if (!px) return;
    reqs.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: px },
        fields: "pixelSize",
      },
    });
  });

  reqs.push({
    updateSheetProperties: {
      properties: { sheetId, index: order, gridProperties: { frozenRowCount: tab.frozenRows } },
      fields: "index,gridProperties.frozenRowCount",
    },
  });

  return reqs;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // Bấm từ app thì cần đăng nhập; chạy tự động theo lịch thì dùng quyền hệ thống.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch (e) {
      user = null;
    }
    const db = user ? base44 : base44.asServiceRole;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");
    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };

    const [groups, allTx, settings] = await Promise.all([
      db.entities.Group.list("created_date", 200),
      db.entities.Transaction.list("-date", 2000),
      base44.asServiceRole.entities.Setting.filter({ key: "sheet_id" }),
    ]);

    const tx = allTx.filter((t) => !t.deleted_at);
    const now = new Date().toISOString();

    // --- tìm hoặc tạo file ---
    let sheetId = settings[0]?.value || null;
    if (sheetId) {
      const check = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=spreadsheetId`,
        { headers }
      );
      if (!check.ok) sheetId = null;
    }
    if (!sheetId) {
      const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers,
        body: JSON.stringify({ properties: { title: SHEET_TITLE } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Không tạo được Google Sheet");
      sheetId = data.spreadsheetId;
    }

    // --- dựng nội dung: sổ quỹ chung + mỗi nhóm một trang + tổng hợp ---
    const usedNames = new Set([TAB_LEDGER, TAB_SUMMARY]);
    const tabs = [buildLedgerTab(tx, groups, now)];
    groups.forEach((g) => tabs.push(buildGroupTab(g, tx, groups, now, usedNames)));
    tabs.push(buildSummaryTab(groups, tx, now));

    // --- tạo những trang còn thiếu ---
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties(title,sheetId)`,
      { headers }
    );
    const meta = await metaRes.json();
    if (!metaRes.ok) throw new Error(meta?.error?.message || "Không đọc được Google Sheet");
    const existing = new Set((meta.sheets || []).map((s) => s.properties.title));
    const missing = tabs.filter((t) => !existing.has(t.title));
    if (missing.length) {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          requests: missing.map((t) => ({ addSheet: { properties: { title: t.title } } })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Không tạo được trang tính trong Google Sheet");
      }
    }

    // --- xoá nội dung cũ rồi ghi lại toàn bộ ---
    const clearRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchClear`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ ranges: tabs.map((t) => `${quoteTab(t.title)}!A1:Z2000`) }),
      }
    );
    if (!clearRes.ok) {
      const data = await clearRes.json().catch(() => ({}));
      throw new Error(data?.error?.message || "Không xoá được dữ liệu cũ trong Google Sheet");
    }

    const writeRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: tabs.map((t) => ({
            range: `${quoteTab(t.title)}!A1`,
            majorDimension: "ROWS",
            values: t.rows.map((r) => {
              const cells = r.slice();
              while (cells.length < t.lastCol + 1) cells.push("");
              return cells;
            }),
          })),
        }),
      }
    );
    if (!writeRes.ok) {
      const data = await writeRes.json().catch(() => ({}));
      throw new Error(data?.error?.message || "Không ghi được vào Google Sheet");
    }

    // --- định dạng màu sắc, kiểu số, độ rộng cột ---
    const meta2 = await (
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties(title,sheetId)`,
        { headers }
      )
    ).json();
    const sidOf = new Map((meta2.sheets || []).map((s) => [s.properties.title, s.properties.sheetId]));

    const requests = [
      { updateSpreadsheetProperties: { properties: { locale: "vi_VN" }, fields: "locale" } },
    ];
    tabs.forEach((t, i) => {
      const sid = sidOf.get(t.title);
      if (sid === undefined) return;
      requests.push(...formatTab(t, sid, i));
    });

    const fmtRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ requests }),
    });
    if (!fmtRes.ok) {
      const data = await fmtRes.json().catch(() => ({}));
      throw new Error(data?.error?.message || "Không định dạng được Google Sheet");
    }

    const saved = settings[0];
    if (saved) await base44.asServiceRole.entities.Setting.update(saved.id, { value: sheetId });
    else await base44.asServiceRole.entities.Setting.create({ key: "sheet_id", value: sheetId });

    return Response.json({
      spreadsheetId: sheetId,
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
      groups: groups.length,
      transactions: tx.length,
      tabs: tabs.length,
      updated_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}