import React from "react";
import { TrendingUp, Receipt, TrendingDown, Wallet, Send } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));

const StatCard = ({ label, value, sub, tone, Icon, accent }) => (
  <div className="relative overflow-hidden rounded-xl border border-[#C9D5E6] bg-white p-3 shadow-sm">
    <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-[#64748B]">{label}</p>
        <p className={`mt-1 font-mono text-xl font-bold tabular-nums break-all sm:text-2xl ${tone}`}>{value}</p>
        {sub && <p className="mt-1 text-[12px] font-medium text-[#94A3B8] truncate">{sub}</p>}
      </div>
      <div className="shrink-0 rounded-lg border border-[#C9D5E6] bg-[#E9EFF7] p-2">
        <Icon size={15} className={tone} />
      </div>
    </div>
  </div>
);

export default function StatCards({ totalIn, totalOut, fee, afterFee, feeRate, feeHint, count, maxOut = 0, maxIn = 0, usdtTotal = 0, grossIn = 0, mode = "full" }) {
  if (mode === "expense") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <StatCard
          label="Tổng chi tiêu" value={fmt(totalOut)} sub={`${count} khoản chi`}
          tone="text-[#DC2626]" Icon={TrendingDown} accent="bg-[#DC2626]"
        />
        <StatCard
          label="Khoản chi lớn nhất" value={fmt(maxOut)} sub="Trong nhóm này"
          tone="text-[#B45309]" Icon={Receipt} accent="bg-[#B45309]"
        />
      </div>
    );
  }

  if (mode === "payout") {
    const diff = (totalIn || 0) - (totalOut || 0);
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <StatCard
          label="Tổng nhận" value={fmt(totalIn)} sub={`${count} khoản nhận`}
          tone="text-[#047857]" Icon={TrendingUp} accent="bg-[#047857]"
        />
        <StatCard
          label="Tổng xuất đi" value={fmt(totalOut)} sub="Tiền đã xuất đi"
          tone="text-[#DC2626]" Icon={Send} accent="bg-[#DC2626]"
        />
        <StatCard
          label="Chênh lệch" value={fmt(diff)} sub="Nhận − xuất đi · không tính phí"
          tone={diff < 0 ? "text-[#DC2626]" : "text-[#1D4ED8]"} Icon={Wallet} accent={diff < 0 ? "bg-[#DC2626]" : "bg-[#1D4ED8]"}
        />
      </div>
    );
  }

  if (mode === "usdt") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <StatCard
          label="Tổng U xuất" value={fmt(usdtTotal)} sub={`${count} lệnh`}
          tone="text-[#B45309]" Icon={Receipt} accent="bg-[#B45309]"
        />
        <StatCard
          label="Tổng lãi" value={fmt(totalIn)} sub="Lãi của các lệnh"
          tone="text-[#047857]" Icon={TrendingUp} accent="bg-[#047857]"
        />
        <StatCard
          label="Lệnh lãi lớn nhất" value={fmt(maxIn)} sub="Trong nhóm này"
          tone="text-[#1D4ED8]" Icon={Wallet} accent="bg-[#1D4ED8]"
        />
      </div>
    );
  }

  if (mode === "profit") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        <StatCard
          label="Lợi nhuận tổng" value={fmt(totalIn)} sub="Tổng phí của các nhóm"
          tone="text-[#047857]" Icon={TrendingUp} accent="bg-[#047857]"
        />
        <StatCard
          label="Tổng vào" value={fmt(grossIn)} sub={`${count} dòng theo ngày · nhóm`}
          tone="text-[#1D4ED8]" Icon={Wallet} accent="bg-[#1D4ED8]"
        />
        <StatCard
          label="Tổng ra" value={fmt(totalOut)} sub="Chi phí đã trừ"
          tone="text-[#DC2626]" Icon={TrendingDown} accent="bg-[#DC2626]"
        />
        <StatCard
          label="Phí lớn nhất" value={fmt(maxIn)} sub="Trong kỳ này"
          tone="text-[#B45309]" Icon={Receipt} accent="bg-[#B45309]"
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
      <StatCard
        label="Tổng vào" value={fmt(totalIn)} sub={`${count} giao dịch`}
        tone="text-[#047857]" Icon={TrendingUp} accent="bg-[#047857]"
      />
      <StatCard
        label="Tổng phí" value={fmt(fee)} sub={feeHint || "Phí vào + phí ra"}
        tone="text-[#B45309]" Icon={Receipt} accent="bg-[#B45309]"
      />
      <StatCard
        label="Tổng ra" value={fmt(totalOut)} sub="Chi phí đã trừ"
        tone="text-[#DC2626]" Icon={TrendingDown} accent="bg-[#DC2626]"
      />
      <StatCard
        label="Sau phí" value={fmt(afterFee)} sub="Vào − phí vào − ra − phí ra"
        tone={afterFee < 0 ? "text-[#DC2626]" : "text-[#047857]"} Icon={Wallet} accent={afterFee < 0 ? "bg-[#DC2626]" : "bg-[#047857]"}
      />
    </div>
  );
}