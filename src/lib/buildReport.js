import { feeOf } from "@/lib/calc";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const d = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "");
const typeLabel = (t) => (t === "in" ? "Tiền vào" : "Tiền ra");

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const isNumeric = (label) =>
  /(tiền|số|phí|số dư|lợi nhuận|chi tiêu)/i.test(label);

export function buildReportData(ctx) {
  const {
    isSummary,
    isHistory,
    expenseOnly,
    profitOnly,
    activeGroup,
    groups,
    ins,
    outs,
    dailyRows,
    historyRows,
    profitRows = [],
    profitTotals,
    totals,
    feeRate = 6,
    outFeeRate = 6,
    isInOut,
    isPayout,
    inoutRate = { in: 6, out: 6 },
  } = ctx;
  const { totalIn, totalOut, fee, feeIn = 0, feeOut = 0, afterFee } = totals;

  if (isHistory) {
    const rows = historyRows.map((t) => [
      groups.find((g) => g.id === t.group_id)?.name || "—",
      d(t.date),
      t.note || "—",
      typeLabel(t.type),
      fmt(t.amount),
      t.deleted_at ? `Đã xoá ${d(t.deleted_at)}` : `Đã sửa ${(t.history || []).length} lần`,
    ]);
    return {
      title: "LỊCH SỬ THAY ĐỔI",
      subtitle: "Các giao dịch đã sửa hoặc xoá",
      columns: ["Nhóm", "Ngày", "Nội dung", "Loại", "Số tiền", "Trạng thái"],
      rows,
      summary: [["Tổng bản ghi", String(rows.length)]],
    };
  }

  if (isSummary) {
    const rows = dailyRows.map((r) => [
      d(r.date),
      fmt(r.totalIn),
      fmt(r.totalOut),
      fmt(r.afterFee ?? r.totalIn - r.totalOut),
    ]);
    return {
      title: "TỔNG CÔNG TY",
      subtitle: "Tổng hợp theo ngày",
      columns: ["Ngày", "Tiền vào", "Tiền ra", "Sau phí"],
      rows,
      summary: [
        ["Tổng vào", fmt(totalIn)],
        ["Tổng ra", fmt(totalOut)],
        ["Tổng phí (vào + ra theo từng nhóm)", fmt(fee)],
        ["Sau phí", fmt(afterFee)],
        ["Số ngày", String(rows.length)],
      ],
    };
  }

  if (profitOnly) {
    return {
      title: activeGroup?.name || "LỢI NHUẬN",
      subtitle: "Lợi nhuận tính theo phí % của các nhóm tổ — tổng lợi nhuận là tổng phí các nhóm tổ",
      columns: ["Ngày", "Nhóm", "Mức phí", "Tiền vào", "Tiền ra", "Lợi nhuận (phí)"],
      rows: profitRows.map((r) => [
        d(r.date),
        r.groupName,
        `${r.rate}%`,
        fmt(r.totalIn),
        fmt(r.totalOut),
        fmt(r.fee),
      ]),
      summary: [
        ["Tổng vào", fmt(profitTotals?.totalIn ?? 0)],
        ["Tổng ra", fmt(profitTotals?.totalOut ?? 0)],
        ["Lợi nhuận tổng (tổng phí các nhóm)", fmt(profitTotals?.fee ?? 0)],
        ["Số dòng", String(profitRows.length)],
      ],
    };
  }

  if (expenseOnly) {
    return {
      title: activeGroup?.name || "CHI TIÊU",
      subtitle: "Bảng chi tiêu",
      columns: ["Ngày", "Nội dung", "Chi tiêu"],
      rows: outs.map((t) => [d(t.date), t.note || "—", fmt(t.amount)]),
      summary: [
        ["Tổng chi tiêu", fmt(totalOut)],
        ["Số khoản", String(outs.length)],
      ],
    };
  }

  if (isPayout) {
    const rows = [];
    const len = Math.max(ins.length, outs.length);
    for (let i = 0; i < len; i++) {
      const a = ins[i];
      const b = outs[i];
      rows.push([
        a ? d(a.date) : "",
        a ? a.note || "—" : "",
        a ? fmt(a.amount) : "",
        b ? d(b.date) : "",
        b ? b.note || "—" : "",
        b ? fmt(b.amount) : "",
      ]);
    }
    return {
      title: "TIỀN XUẤT ĐI",
      subtitle: "Nhận tiền và xuất tiền · Không tính phí",
      columns: ["Ngày", "Nội dung nhận", "Tiền nhận", "Ngày", "Nội dung xuất đi", "Tiền xuất đi"],
      rows,
      summary: [
        ["Tổng nhận", fmt(totalIn)],
        ["Tổng xuất đi", fmt(totalOut)],
        ["Chênh lệch", fmt(totalIn - totalOut)],
        ["Tổng khoản", String(rows.length)],
      ],
    };
  }

  if (isInOut) {
    const feeOf = (t) =>
      (t.amount || 0) * ((t.type === "in" ? inoutRate.in : inoutRate.out) ?? 6) / 100;
    const feeIn = ins.reduce((s, t) => s + (t.amount || 0) * ((inoutRate.in ?? 6) / 100), 0);
    const feeOut = outs.reduce((s, t) => s + (t.amount || 0) * ((inoutRate.out ?? 6) / 100), 0);
    const rows = [...ins, ...outs].map((t) => [
      t.type === "in" ? "Tiền vào" : "Tiền ra",
      d(t.date),
      t.note || "—",
      fmt(t.amount),
      fmt(feeOf(t)),
    ]);
    return {
      title: "RA TIỀN MẶT",
      subtitle: `Sổ riêng · Phí vào ${inoutRate.in}% · Phí ra ${inoutRate.out}%`,
      columns: ["Loại", "Ngày", "Nội dung", "Số tiền", "Phí"],
      rows,
      summary: [
        ["Tổng vào", fmt(totalIn)],
        [`Phí vào (${inoutRate.in}%)`, fmt(feeIn)],
        ["Tổng ra", fmt(totalOut)],
        [`Phí ra (${inoutRate.out}%)`, fmt(feeOut)],
        ["Chênh lệch", fmt(totalIn - totalOut)],
        ["Sau phí", fmt(totalIn - feeIn - totalOut - feeOut)],
        ["Tổng giao dịch", String(rows.length)],
      ],
    };
  }

  const rows = [];
  const len = Math.max(ins.length, outs.length);
  for (let i = 0; i < len; i++) {
    const a = ins[i];
    const b = outs[i];
    rows.push([
      a ? d(a.date) : "",
      a ? a.note || "—" : "",
      a ? fmt(a.amount) : "",
      a ? fmt(feeOf(a.amount, feeRate)) : "",
      b ? d(b.date) : "",
      b ? b.note || "—" : "",
      b ? fmt(b.amount) : "",
      b ? fmt(feeOf(b.amount, outFeeRate)) : "",
    ]);
  }
  return {
    title: activeGroup?.name || "SỔ QUỸ",
    subtitle: `Sổ quỹ · Phí vào ${feeRate}% · Phí ra ${outFeeRate}%`,
    columns: ["Ngày", "Nội dung", "Tiền vào", `Phí vào ${feeRate}%`, "Ngày", "Nội dung", "Tiền ra", `Phí ra ${outFeeRate}%`],
    rows,
    summary: [
      ["Tổng vào", fmt(totalIn)],
      [`Phí vào (${feeRate}%)`, fmt(feeIn)],
      ["Tổng ra", fmt(totalOut)],
      [`Phí ra (${outFeeRate}%)`, fmt(feeOut)],
      ["Sau phí", fmt(afterFee)],
    ],
  };
}

export function buildReportHtml(report) {
  const { title, subtitle, columns, rows, summary } = report;

  const head = columns
    .map(
      (c) =>
        `<th style="padding:8px 10px;background:#0C1425;color:#EEF2F8;font-size:11px;text-transform:uppercase;letter-spacing:.06em;border:1px solid #1E2A44;text-align:${
          isNumeric(c) ? "right" : "left"
        }">${esc(c)}</th>`
    )
    .join("");

  const body = rows.length
    ? rows
        .map(
          (r, i) =>
            `<tr style="background:${i % 2 ? "#F8FAFC" : "#FFFFFF"}">${r
              .map(
                (c, j) =>
                  `<td style="padding:7px 10px;border:1px solid #E2E8F0;font-size:13px;color:#0F172A;font-family:Arial,Helvetica,sans-serif;text-align:${
                    isNumeric(columns[j]) ? "right" : "left"
                  }">${esc(c) || "—"}</td>`
              )
              .join("")}</tr>`
        )
        .join("")
    : `<tr><td colspan="${columns.length}" style="padding:18px;text-align:center;color:#64748B;border:1px solid #E2E8F0;font-size:13px">Chưa có dữ liệu</td></tr>`;

  const summaryRows = (summary || [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:7px 10px;border:1px solid #E2E8F0;font-size:13px;color:#334155">${esc(
          label
        )}</td><td style="padding:7px 10px;border:1px solid #E2E8F0;font-size:13px;font-weight:700;color:#0F172A;text-align:right">${esc(
          value
        )}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:24px;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:820px;margin:0 auto">
    <div style="background:#080D18;border-radius:10px 10px 0 0;padding:18px 20px">
      <p style="margin:0;font-size:18px;font-weight:800;letter-spacing:.08em;color:#EEF2F8;text-transform:uppercase">${esc(
        title
      )}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#8B9AB5">${esc(subtitle || "")} · ${new Date().toLocaleString(
    "vi-VN"
  )}</p>
    </div>
    <div style="background:#FFFFFF;padding:16px;border:1px solid #E2E8F0;border-top:0">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:14px">${summaryRows}</table>
    </div>
    <p style="margin:12px 2px 0;font-size:11px;color:#94A3B8">Báo cáo được gửi tự động từ Sổ quỹ Tổ 2 Tuyển dụng.</p>
  </div>
</body></html>`;
}