// Chụp ảnh báo cáo bằng cách để TRÌNH DUYỆT tự vẽ lại bảng.
//
// Bảng được nhúng vào một ảnh SVG (thẻ foreignObject) rồi trình duyệt tự dàn trang và
// vẽ chữ bằng đúng font đang dùng — chữ và vị trí luôn do cùng một bộ máy tính ra nên
// không thể lệch nhau, khác hẳn cách tự dựng lại từng chữ (html2canvas) trước đây.
//
// Ảnh SVG khi tải lên không tự tải được font/file bên ngoài, nên toàn bộ CSS của app
// (và file font, nếu tải được) được nhúng thẳng vào ảnh trước khi vẽ.

// Ảnh gửi Telegram/xem trên điện thoại: bảng càng hẹp thì chữ trong ảnh càng to
// khi xem trên màn hình dọc, nên chỉ để lề mỏng và không thêm khoảng trống thừa.
const SCALE = 2;
const PAD = 14;
const HEADER_H = 52;
const FOOTER_H = 30;
const MAX_WIDTH = 2000;
// Bề rộng tối thiểu cho ảnh dạng khối: khối chữ nhật cần đủ chỗ để các số liệu xếp
// cạnh nhau, hẹp hơn thì ảnh sẽ thành một dải dọc khó đọc.
const MIN_WIDTH = 560;
const LOAD_TIMEOUT = 20000;
const FONT_TIMEOUT = 4000;

const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap";

// Google Fonts chia font theo bộ ký tự; báo cáo chỉ cần latin + tiếng Việt.
const NEEDED_SUBSETS = ["latin", "vietnamese"];

const bufToBase64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
};

const withTimeout = (promise, ms, fallback) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]);

const keepNeededSubsets = (css) => {
  const parts = css.split(/\/\*\s*([a-z-]+)\s*\*\//i);
  if (parts.length < 3) return css;
  let out = "";
  for (let i = 1; i < parts.length; i += 2) {
    if (NEEDED_SUBSETS.includes(parts[i].toLowerCase())) out += parts[i + 1];
  }
  return out || css;
};

let fontCssPromise = null;

// Nhúng thẳng file font vào ảnh (dạng data URI) để ảnh hiển thị đúng font chữ.
// Không tải được font thì bỏ qua — chữ vẫn được vẽ bằng font hệ thống, không bị lệch.
const loadFontCss = () => {
  if (!fontCssPromise) {
    const job = (async () => {
      const res = await fetch(FONT_CSS_URL);
      let css = keepNeededSubsets(await res.text());
      const urls = Array.from(
        new Set(Array.from(css.matchAll(/url\((https:\/\/[^)]+)\)/g), (m) => m[1]))
      );
      const inline = new Map();
      await Promise.all(
        urls.map(async (u) => {
          const r = await fetch(u);
          inline.set(u, `data:font/woff2;base64,${bufToBase64(await r.arrayBuffer())}`);
        })
      );
      css = css.replace(/url\((https:\/\/[^)]+)\)/g, (m, u) => `url(${inline.get(u) || u})`);
      return css;
    })().catch(() => "");
    fontCssPromise = withTimeout(job, FONT_TIMEOUT, "");
  }
  return fontCssPromise;
};

// Ảnh gửi Telegram luôn dùng bố cục dành cho điện thoại: các khối chữ nhật xếp dọc.
// Tailwind đặt phần "bản máy tính" trong @media (min-width: …), mà bản sao khi chụp lại
// nằm cùng khung nhìn với màn hình đang mở — nên phải bỏ hẳn các khối đó để bản chụp
// luôn rơi vào giao diện gốc (khối), không phụ thuộc màn hình đang xem rộng hay hẹp.
const isDesktopMedia = (rule) => {
  if (rule.type !== 4) return false; // 4 = CSSMediaRule
  const cond = rule.media?.mediaText || rule.conditionText || "";
  return /min-width/i.test(cond);
};

// Toàn bộ CSS đang dùng trong app. Bỏ @import (ảnh SVG không tải được file ngoài) và
// gán lại các biến màu/font khai báo ở :root cho gốc của bảng.
const collectAppCss = () => {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch (e) {
      continue;
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) {
      if (rule.type === 2 || rule.type === 3) continue; // @charset, @import
      if (isDesktopMedia(rule)) continue;
      css += (rule.cssText || "") + "\n";
    }
  }
  return css.replace(/:root/g, "#report-root");
};

// Dựng bản sao bảng ngoài màn hình để đo đúng bề rộng cần thiết cho mọi cột.
const buildClone = (el, fontCss) => {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('[data-capture-exclude="true"]').forEach((n) => n.remove());
  clone.id = "report-root";

  const host = document.createElement("div");
  host.setAttribute(
    "style",
    "position:fixed;left:-20000px;top:0;width:max-content;max-width:none;pointer-events:none;"
  );
  host.appendChild(clone);
  document.body.appendChild(host);

  const width = Math.min(
    Math.max(Math.ceil(clone.getBoundingClientRect().width), MIN_WIDTH),
    MAX_WIDTH
  );
  clone.style.cssText = `width:${width}px;background:#FFFFFF;font-family:'Be Vietnam Pro',ui-sans-serif,system-ui,sans-serif;font-size:16px;line-height:1.5;color:#0F172A;`;
  const height = Math.ceil(clone.getBoundingClientRect().height) + 8;

  const style = document.createElement("style");
  style.textContent = `${collectAppCss()}\n${fontCss}`;
  clone.insertBefore(style, clone.firstChild);

  let html = new XMLSerializer().serializeToString(clone);
  if (!/^<[^>]*\sxmlns=/.test(html)) {
    html = html.replace(/^<([a-zA-Z0-9-]+)/, `<$1 xmlns="http://www.w3.org/1999/xhtml"`);
  }
  document.body.removeChild(host);

  return { html, width, height };
};

const buildSvg = ({ html, width, height }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
  `<foreignObject x="0" y="0" width="${width}" height="${height}">${html}</foreignObject></svg>`;

const loadSvgImage = (svg) =>
  new Promise((resolve, reject) => {
    const bytes = new TextEncoder().encode(svg);
    const img = new Image();
    const timer = setTimeout(() => reject(new Error("Quá lâu không dựng được ảnh")), LOAD_TIMEOUT);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error("Không dựng được ảnh báo cáo"));
    };
    img.src = `data:image/svg+xml;base64,${bufToBase64(bytes.buffer)}`;
  });

const frame = async (body, title, subtitle) => {
  const pad = PAD * SCALE;
  const headerH = title ? HEADER_H * SCALE : 0;
  const footerH = FOOTER_H * SCALE;
  const out = document.createElement("canvas");
  out.width = body.width + pad * 2;
  out.height = body.height + pad * 2 + headerH + footerH;
  const ctx = out.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, out.width, out.height);

  await document.fonts.ready.catch(() => {});

  let y = pad;
  if (title) {
    ctx.fillStyle = "#0F172A";
    ctx.font = `800 ${17 * SCALE}px "Be Vietnam Pro", sans-serif`;
    ctx.fillText(title, pad, y + 17 * SCALE);
    ctx.fillStyle = "#5B6B85";
    ctx.font = `500 ${12 * SCALE}px "Be Vietnam Pro", sans-serif`;
    ctx.fillText(subtitle, pad, y + 36 * SCALE);
    y += headerH;
  }

  ctx.drawImage(body, pad, y);
  y += body.height;

  ctx.fillStyle = "#8494AC";
  ctx.font = `500 ${11 * SCALE}px "Be Vietnam Pro", sans-serif`;
  ctx.fillText(
    `Tiền lại về với người hiền · ${new Date().toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    pad,
    y + 22 * SCALE
  );

  ctx.strokeStyle = "#C9D5E6";
  ctx.lineWidth = 1 * SCALE;
  ctx.strokeRect(pad / 2, pad / 2, out.width - pad, out.height - pad);

  return out;
};

// Chụp khung bảng đang xem thành ảnh PNG.
export const captureReportImage = async ({ targetRef, title = "", subtitle = "" }) => {
  const el = targetRef?.current;
  if (!el) throw new Error("Không tìm thấy vùng nội dung để chụp");

  const fontCss = await loadFontCss();
  const { html, width, height } = buildClone(el, fontCss);
  const img = await loadSvgImage(buildSvg({ html, width, height }));

  const body = document.createElement("canvas");
  body.width = width * SCALE;
  body.height = height * SCALE;
  const bctx = body.getContext("2d");
  bctx.fillStyle = "#FFFFFF";
  bctx.fillRect(0, 0, body.width, body.height);
  bctx.drawImage(img, 0, 0, body.width, body.height);

  const canvas = await frame(body, title, subtitle);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  return { canvas, blob, dataUrl: canvas.toDataURL("image/png") };
};

export const downloadImage = (dataUrl, fileName = "bao-cao") => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${fileName}.png`;
  a.click();
};