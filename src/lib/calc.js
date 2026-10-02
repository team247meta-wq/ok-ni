// ===== Công thức tính toán chuẩn cho toàn bộ app =====
// Phí vào   = Tiền vào × mức phí vào (%) của nhóm
// Phí ra    = Tiền ra  × mức phí ra (%) của nhóm
// Sau phí   = Tiền vào − Phí vào − Tiền ra − Phí ra
// Lợi nhuận công ty = tổng phí vào (phí ra chỉ tham khảo, KHÔNG cộng vào lợi nhuận)
// Nhóm Chi tiêu / Lợi nhuận / USDT không áp dụng phí.

export const feeOf = (amount, rate) => (amount || 0) * ((rate ?? 0) / 100);

// Chỉ nhóm tổ (chế độ "full") mới tính phí.
export const hasFee = (group) => !group || !group.mode || group.mode === "full";

export const afterFeeOf = ({ totalIn = 0, feeIn = 0, totalOut = 0, feeOut = 0 }) =>
  totalIn - feeIn - totalOut - feeOut;