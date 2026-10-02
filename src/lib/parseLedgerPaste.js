const HEADER_RULES = [
  { key: "date", re: /ngày|date/i },
  { key: "in", re: /tiền vào|thu vào|vào|thu|^in$/i },
  { key: "out", re: /tiền ra|chi ra|ra|chi|^out$/i },
  { key: "amount", re: /số tiền|amount|tiền/i },
  { key: "note", re: /ghi chú|nội dung|note|diễn giải/i },
];

const isDateCell = (s) =>
  /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}$/.test(s) || /^\d{4}-\d{1,2}-\d{1,2}$/.test(s);

const isNumCell = (s) => /^-?[\d.,\s]+$/.test(s) && /\d/.test(s);

export const parseAmount = (s) => {
  let v = String(s || "").replace(/\s/g, "").replace(/[₫đ]/gi, "");
  if (/^-?\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
  else if (/^-?\d{1,3}(,\d{3})+$/.test(v)) v = v.replace(/,/g, "");
  else v = v.replace(/,/g, ".");
  const n = parseFloat(v);
  return isFinite(n) ? n : 0;
};

const toISO = (s) => {
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const [d, m, y] = s.split(/[\/\-.]/);
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

const headerKey = (c) => {
  if (!c) return null;
  const rule = HEADER_RULES.find((r) => r.re.test(c));
  return rule ? rule.key : null;
};

const headerMap = (cells) => {
  const keys = cells.map(headerKey);
  if (keys.filter(Boolean).length < 2) return null;
  const at = (k) => keys.indexOf(k);
  return { date: at("date"), in: at("in"), out: at("out"), amount: at("amount"), note: at("note") };
};

const splitLine = (line) =>
  line.split(/\t|\|/).map((c) => c.replace(/^"(.*)"$/, "$1").trim());

const pickDate = (cells, idx, fallback) => {
  const at = idx != null && idx >= 0 ? cells[idx] : null;
  if (at && isDateCell(at)) return toISO(at);
  const found = cells.find(isDateCell);
  return found ? toISO(found) : fallback;
};

export function parseLedgerPaste(text, { defaultDate, mode = "full" } = {}) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  const records = [];
  let invalid = 0;
  let map = null;

  const push = (type, amount, note, date) => {
    const amt = Math.abs(amount || 0);
    if (!amt) return false;
    records.push({ type, amount: amt, note: note || "", date });
    return true;
  };

  lines.forEach((line) => {
    const cells = splitLine(line);

    if (!map) {
      const found = headerMap(cells);
      if (found) {
        map = found;
        return;
      }
    }

    if (map) {
      const date = pickDate(cells, map.date, defaultDate);
      const note =
        map.note != null && cells[map.note]
          ? cells[map.note]
          : cells.filter((c, i) => i !== map.date && c && !isNumCell(c)).join(" ");
      const inVal = Math.abs(parseAmount(cells[map.in]));
      const outVal = Math.abs(parseAmount(cells[map.out]));
      const amtVal = parseAmount(cells[map.amount]);

      if (mode === "expense") {
        if (!push("out", outVal || amtVal || inVal, note, date)) invalid++;
      } else if (mode === "profit") {
        if (!push("in", inVal || amtVal || outVal, note, date)) invalid++;
      } else if (map.in != null || map.out != null) {
        let ok = false;
        if (inVal) ok = push("in", inVal, note, date) || ok;
        if (outVal) ok = push("out", outVal, note, date) || ok;
        if (!ok && amtVal) ok = push(amtVal < 0 ? "out" : "in", amtVal, note, date);
        if (!ok) invalid++;
      } else if (!push(amtVal < 0 ? "out" : "in", amtVal, note, date)) {
        invalid++;
      }
      return;
    }

    const rest = [];
    let date = defaultDate;
    cells.forEach((c, i) => {
      if (i < 2 && isDateCell(c)) {
        date = toISO(c);
        return;
      }
      if (c) rest.push(c);
    });
    const numbers = rest.filter(isNumCell).map(parseAmount);
    const note = rest.filter((c) => !isNumCell(c)).join(" ").trim();

    if (mode === "expense" || mode === "profit") {
      if (!push(mode === "expense" ? "out" : "in", numbers[0], note, date)) invalid++;
    } else if (numbers.length >= 2) {
      let ok = false;
      if (numbers[0]) ok = push("in", numbers[0], note, date) || ok;
      if (numbers[1]) ok = push("out", numbers[1], note, date) || ok;
      if (!ok) invalid++;
    } else if (!push(numbers[0] < 0 ? "out" : "in", numbers[0], note, date)) {
      invalid++;
    }
  });

  return { records, invalid };
}