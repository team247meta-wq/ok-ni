import { PassThrough } from 'node:stream';
import { Buffer } from 'node:buffer';

const FONT_REG = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/bevietnampro/BeVietnamPro-Regular.ttf';
const FONT_BOLD = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/bevietnampro/BeVietnamPro-Bold.ttf';

const C = {
  ink: '#0F172A',
  sub: '#5B6B85',
  line: '#E2E8F0',
  headBg: '#1E293B',
  headFg: '#FFFFFF',
  band: '#E9EFF7',
  rowAlt: '#FBFCFE',
  totalBg: '#E9EFF7',
  red: '#DC2626',
  green: '#047857',
  amber: '#B45309',
  empty: '#CBD5E1',
  dangerBg: '#FDECEC',
  dangerFg: '#B91C1C',
  foot: '#8494AC',
};

// Ảnh gọn (không full chiều ngang) để khi xem trên điện thoại chữ vẫn to, rõ.
const W = 900;
const PAD = 32;
const COL = { name: PAD, in: 420, out: 570, fee: 720, after: W - PAD };
const HEAD_H = 108;
const SECTION_H = 50;
const TH_H = 46;
const ROW_H = 48;
const GAP = 20;
const FOOT_H = 52;

let cached = null;

// pureimage + opentype.js chạy thuần JS nên dựng được ảnh ngay trên server.
const loadCanvas = async () => {
  if (cached) return cached;
  const [piMod, otMod] = await Promise.all([
    import('npm:pureimage@0.4.18/dist/index.esm.js'),
    import('npm:opentype.js@0.4.3'),
  ]);
  const PImage = piMod.default ?? piMod;
  const opentype = otMod.default ?? otMod;

  const [regBuf, boldBuf] = await Promise.all([
    fetch(FONT_REG).then((r) => r.arrayBuffer()),
    fetch(FONT_BOLD).then((r) => r.arrayBuffer()),
  ]);

  const reg = PImage.registerFont('regular.ttf', 'BVN');
  reg.font = opentype.parse(regBuf);
  reg.loaded = true;

  const bold = PImage.registerFont('bold.ttf', 'BVNB');
  bold.font = opentype.parse(boldBuf);
  bold.loaded = true;

  cached = PImage;
  return PImage;
};

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));
const dmy = (v) => {
  const s = String(v || '').slice(0, 10);
  const [y, m, d] = s.split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};
const vnTime = (iso) =>
  new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });

const fill = (ctx, x, y, w, h, color) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

const rule = (ctx, y) => {
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, y + 0.5);
  ctx.lineTo(W, y + 0.5);
  ctx.stroke();
};

const text = (ctx, value, x, y, { size = 19, bold = false, color = C.ink, align = 'left' } = {}) => {
  ctx.fillStyle = color;
  ctx.font = `${size}pt ${bold ? 'BVNB' : 'BVN'}`;
  ctx.textAlign = align;
  ctx.fillText(String(value), x, y);
};

const money = (n) => `${n < 0 ? '−' : '+'}${fmt(Math.abs(n || 0))}`;
const moneyColor = (n) => (n < 0 ? C.red : C.green);
// Đường cơ sở của chữ trong một dòng, canh giữa theo chiều dọc.
const base = (y) => y + ROW_H / 2 + 7;

const sectionBar = (ctx, y, label) => {
  fill(ctx, 0, y, W, SECTION_H, C.band);
  text(ctx, label, W / 2, y + 34, { size: 22, bold: true, align: 'center' });
  return y + SECTION_H;
};

const headerRow = (ctx, y, labels) => {
  fill(ctx, 0, y, W, TH_H, C.headBg);
  const b = y + 31;
  text(ctx, labels[0], COL.name, b, { size: 18, bold: true, color: C.headFg });
  text(ctx, labels[1], COL.in, b, { size: 18, bold: true, color: C.headFg, align: 'right' });
  text(ctx, labels[2], COL.out, b, { size: 18, bold: true, color: C.headFg, align: 'right' });
  if (labels[3]) text(ctx, labels[3], COL.fee, b, { size: 18, bold: true, color: C.headFg, align: 'right' });
  text(ctx, labels[4], COL.after, b, { size: 18, bold: true, color: C.headFg, align: 'right' });
  return y + TH_H;
};

const emptyRow = (ctx, y, label) => {
  fill(ctx, 0, y, W, ROW_H, '#FFFFFF');
  text(ctx, label, W / 2, base(y), { size: 18, color: C.sub, align: 'center' });
  rule(ctx, y + ROW_H);
  return y + ROW_H;
};

// Một dòng số liệu: số tiền luôn có dấu và màu âm/dương.
const dataRow = (ctx, y, r) => {
  const b = base(y);
  fill(ctx, 0, y, W, ROW_H, r.alt ? C.rowAlt : '#FFFFFF');
  text(ctx, r.name, COL.name, b, { size: 19 });
  text(ctx, r.in ? `+${fmt(r.in)}` : '—', COL.in, b, {
    bold: true,
    color: r.in ? C.green : C.empty,
    align: 'right',
  });
  text(ctx, r.out ? `−${fmt(r.out)}` : '—', COL.out, b, {
    bold: true,
    color: r.out ? C.red : C.empty,
    align: 'right',
  });
  if (r.fee !== null) {
    text(ctx, r.fee ? `−${fmt(r.fee)}` : '—', COL.fee, b, {
      bold: true,
      color: r.fee ? C.amber : C.empty,
      align: 'right',
    });
  }
  text(ctx, r.after === null || r.after === undefined ? '—' : money(r.after), COL.after, b, {
    bold: true,
    color: r.after === null || r.after === undefined ? C.empty : moneyColor(r.after),
    align: 'right',
  });
  rule(ctx, y + ROW_H);
  return y + ROW_H;
};

const totalRow = (ctx, y, { label, in: vIn, out: vOut, fee, after, danger = false, offset = 0 }) => {
  const b = base(y);
  fill(ctx, 0, y, W, ROW_H, danger ? C.dangerBg : C.totalBg);
  const color = danger ? C.dangerFg : C.ink;
  text(ctx, label, COL.name + offset, b, { size: 19, bold: true, color });
  if (vIn !== undefined && vIn !== null) {
    text(ctx, `+${fmt(vIn)}`, COL.in, b, { bold: true, color: danger ? C.dangerFg : C.green, align: 'right' });
  }
  if (vOut !== undefined && vOut !== null) {
    text(ctx, `−${fmt(vOut)}`, COL.out, b, { bold: true, color: danger ? C.dangerFg : C.red, align: 'right' });
  }
  if (fee !== undefined && fee !== null) {
    text(ctx, `−${fmt(fee)}`, COL.fee, b, { bold: true, color: danger ? C.dangerFg : C.amber, align: 'right' });
  }
  if (after !== undefined && after !== null) {
    text(ctx, money(after), COL.after, b, {
      bold: true,
      color: danger ? C.dangerFg : moneyColor(after),
      align: 'right',
    });
  }
  return y + ROW_H;
};

export const renderReportPng = async ({
  title,
  subtitle,
  groups,
  groupTotals,
  days,
  dayTotals,
  payTotal,
  updatedAt,
}) => {
  const PImage = await loadCanvas();

  const groupRowCount = Math.max(groups.length, 1);
  const dayRowCount = Math.max(days.length, 1);

  const height =
    HEAD_H +
    (SECTION_H + TH_H + groupRowCount * ROW_H + GAP + 2 * ROW_H + 28) +
    (SECTION_H + TH_H + dayRowCount * ROW_H + GAP + ROW_H + 28) +
    FOOT_H;

  const img = PImage.make(W, height);
  const ctx = img.getContext('2d');

  fill(ctx, 0, 0, W, height, '#FFFFFF');

  // Tiêu đề
  fill(ctx, 0, 0, W, HEAD_H, C.ink);
  text(ctx, title, PAD, 54, { size: 27, bold: true, color: '#FFFFFF' });
  text(ctx, subtitle, PAD, 88, { size: 17, color: '#CBD5E1' });

  let y = HEAD_H;

  // Bảng tổng hợp theo nhóm
  y = sectionBar(ctx, y, 'TỔNG CÁC CTY');
  y = headerRow(ctx, y, ['Nhóm', 'Tiền vào', 'Tiền ra', 'Phí', 'Sau phí']);
  if (groups.length === 0) {
    y = emptyRow(ctx, y, 'Chưa có giao dịch nào');
  } else {
    groups.forEach((r, i) => {
      y = dataRow(ctx, y, { ...r, alt: i % 2 === 1 });
    });
  }
  y += GAP;
  y = totalRow(ctx, y, {
    label: 'TỔNG CỘNG',
    in: groupTotals.totalIn,
    out: groupTotals.totalOut,
    fee: groupTotals.fee,
    after: groupTotals.afterFee,
  });
  y = totalRow(ctx, y, { label: 'CÔNG TY CẦN THANH TOÁN', after: payTotal, danger: true });
  y += 28;

  // Bảng theo ngày
  y = sectionBar(ctx, y, 'TỔNG HỢP THEO NGÀY');
  y = headerRow(ctx, y, ['Ngày', 'Tiền vào', 'Tiền ra', null, 'Sau phí']);
  if (days.length === 0) {
    y = emptyRow(ctx, y, 'Chưa có giao dịch nào');
  } else {
    days.forEach((r, i) => {
      y = dataRow(ctx, y, { ...r, fee: null, alt: i % 2 === 1 });
    });
  }
  y += GAP;
  y = totalRow(ctx, y, {
    label: 'TỔNG CỘNG',
    in: dayTotals.totalIn,
    out: dayTotals.totalOut,
    after: dayTotals.afterFee,
  });
  y += 28;

  text(ctx, `Tiền lại về với người hiền · Cập nhật: ${vnTime(updatedAt)}`, PAD, y + 32, {
    size: 15,
    color: C.foot,
  });

  const stream = new PassThrough();
  const chunks = [];
  stream.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve) => stream.on('end', resolve));
  await PImage.encodePNGToStream(img, stream);
  await done;

  return new Uint8Array(Buffer.concat(chunks));
};

export { dmy, fmt, vnTime };