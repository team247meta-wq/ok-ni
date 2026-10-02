import React from "react";
import SectionTitle from "@/components/ledger/SectionTitle";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));

export default function OverviewPanel({
  isSummary,
  isSettle,
  isInOut,
  isPayout,
  expenseOnly,
  profitOnly,
  usdtOnly,
  usdtTotal = 0,
  settle,
  totalIn,
  totalOut,
  afterFee,
  transactions,
  ins,
  outs,
}) {
  return (
    <div className="p-4">
      <SectionTitle>{isSummary ? "Tổng quan công ty" : isInOut ? "Tổng quan nhập và xuất" : isPayout ? "Tổng quan nhận và xuất đi" : isSettle ? "Tổng quan ngày" : "Tổng quan nhóm"}</SectionTitle>
      <div className="space-y-2 text-sm">
        {isPayout ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Khoản nhận</span>
              <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{ins.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Khoản xuất đi</span>
              <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{outs.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tổng nhận</span>
              <span className="font-mono font-semibold tabular-nums text-[#047857]">{fmt(totalIn)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tổng xuất đi</span>
              <span className="font-mono font-semibold tabular-nums text-[#DC2626]">{fmt(totalOut)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#C9D5E6]">
              <span className="font-semibold text-[#0F172A]">Chênh lệch</span>
              <span className={`font-mono font-bold tabular-nums ${totalIn - totalOut < 0 ? "text-[#DC2626]" : "text-[#047857]"}`}>
                {fmt(totalIn - totalOut)}
              </span>
            </div>
          </>
        ) : isSettle ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Giao dịch trong ngày</span>
              <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{settle.count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tiền vào</span>
              <span className="font-mono font-semibold tabular-nums text-[#047857]">{fmt(settle.totalIn)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tiền ra</span>
              <span className="font-mono font-semibold tabular-nums text-[#DC2626]">{fmt(settle.totalOut)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#C9D5E6]">
              <span className="font-semibold text-[#0F172A]">Số dư sau phí trong ngày</span>
              <span
                className={`font-mono font-bold tabular-nums ${
                  settle.afterFee < 0 ? "text-[#DC2626]" : "text-[#047857]"
                }`}
              >
                {fmt(settle.afterFee)}
              </span>
            </div>
          </>
        ) : expenseOnly ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Số khoản chi</span>
              <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{outs.length}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#C9D5E6]">
              <span className="font-semibold text-[#0F172A]">Tổng chi tiêu</span>
              <span className="font-mono font-bold tabular-nums text-[#DC2626]">{fmt(totalOut)}</span>
            </div>
          </>
        ) : usdtOnly ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Số lệnh</span>
              <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{ins.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tổng U xuất</span>
              <span className="font-mono font-semibold tabular-nums text-[#B45309]">{fmt(usdtTotal)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#C9D5E6]">
              <span className="font-semibold text-[#0F172A]">Tổng lãi</span>
              <span className="font-mono font-bold tabular-nums text-[#047857]">{fmt(totalIn)}</span>
            </div>
          </>
        ) : profitOnly ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Số khoản lợi nhuận</span>
              <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{ins.length}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#C9D5E6]">
              <span className="font-semibold text-[#0F172A]">Lợi nhuận tổng</span>
              <span className="font-mono font-bold tabular-nums text-[#047857]">{fmt(totalIn)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Giao dịch</span>
              <span className="font-mono font-semibold tabular-nums text-[#0F172A]">{transactions.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tiền vào</span>
              <span className="font-mono font-semibold tabular-nums text-[#047857]">{fmt(totalIn)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tiền ra</span>
              <span className="font-mono font-semibold tabular-nums text-[#DC2626]">{fmt(totalOut)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-[#C9D5E6]">
              <span className="font-semibold text-[#0F172A]">Sau phí</span>
              <span className={`font-mono font-bold tabular-nums ${afterFee < 0 ? "text-[#DC2626]" : "text-[#047857]"}`}>{fmt(afterFee)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}