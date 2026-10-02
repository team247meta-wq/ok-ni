// Nhóm của khối công ty được nhận diện tự động theo tên:
// có "USDT" → nhóm usdt, có "LỢI NHUẬN" → nhóm lợi nhuận, có "CHI TIÊU" → nhóm chi tiêu.
// Các tên còn lại thuộc nhóm tổ (chế độ đầy đủ, tính phí theo % của nhóm).
export function inferGroupMode(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("usdt")) return "usdt";
  if (n.includes("lợi nhuận") || n.includes("loi nhuan")) return "profit";
  if (n.includes("chi tiêu") || n.includes("chi tieu")) return "expense";
  return "full";
}