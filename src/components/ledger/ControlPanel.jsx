import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, SlidersHorizontal, Building2, Wallet, History, ArrowLeftRight, Send } from "lucide-react";
import SectionTitle from "@/components/ledger/SectionTitle";
import OverviewPanel from "@/components/ledger/OverviewPanel";
import QuickImport from "@/components/ledger/QuickImport";
import FeeInput from "@/components/ledger/FeeInput";
import InOutFeeForm from "@/components/ledger/InOutFeeForm";
import InOutForm from "@/components/ledger/InOutForm";
import PayoutForm from "@/components/ledger/PayoutForm";
import NoteQuickPicks from "@/components/ledger/NoteQuickPicks";
import { parseAmount } from "@/lib/parseLedgerPaste";

const inputCls =
  "bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg placeholder:text-[#94A3B8] focus-visible:ring-[#2563EB]/30";

const labelCls = "text-[12px] font-bold text-[#64748B] mb-2 block";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));

export default function ControlPanel({
  isSummary,
  isSettle,
  expenseOnly,
  profitOnly,
  usdtOnly,
  usdtTotal,
  activeGroup,
  patchGroup,
  deleteGroup,
  form,
  setForm,
  add,
  importMany,
  settle,
  totalIn,
  totalOut,
  afterFee,
  transactions,
  ins,
  outs,
  canEdit,
  isHistory,
  isInOut,
  isPayout,
  inoutRate,
  onPatchInoutRate,
  onAddInOut,
  onAddPayout,
}) {
  return (
    <aside className="lg:w-[330px] lg:flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-r border-[#C9D5E6]">
      {isSummary || isSettle || isHistory || isInOut || isPayout ? (
        <div className="p-4 border-b border-[#C9D5E6]">
          <div className="flex items-center gap-2 mb-1">
            {isSummary ? (
              <Building2 size={14} className="text-[#1D4ED8]" />
            ) : isInOut ? (
              <ArrowLeftRight size={14} className="text-[#0F766E]" />
            ) : isPayout ? (
              <Send size={14} className="text-[#DC2626]" />
            ) : isHistory ? (
              <History size={14} className="text-[#7C3AED]" />
            ) : (
              <Wallet size={14} className="text-[#B45309]" />
            )}
            <h2 className="font-display text-sm font-bold text-[#0F172A]">
              {isSummary ? "Tổng công ty" : isInOut ? "Ra tiền mặt" : isPayout ? "Tiền xuất đi" : isHistory ? "Lịch sử thay đổi" : "Cần xử lý"}
            </h2>
          </div>
          <p className="text-[13px] leading-relaxed text-[#64748B]">
            {isSummary
              ? "Tổng hợp tiền vào / tiền ra của tất cả các nhóm theo từng ngày. Chế độ chỉ xem."
              : isInOut
              ? "Sổ riêng cho nhập và xuất, kèm phí riêng cho từng bên — không lẫn với dữ liệu các nhóm."
              : isPayout
              ? "Sổ riêng cho tiền nhận và tiền xuất đi — không tính phí, mỗi khoản đều có nội dung."
              : isHistory
              ? "Các giao dịch đã xoá hoặc đã sửa — bấm Khôi phục để trả lại như trước. Chế độ chỉ xem."
              : "Số dư âm / dương của từng nhóm theo ngày để biết khoản công ty cần xử lý. Chế độ chỉ xem."}
          </p>
        </div>
      ) : (
        <>
          <div className="p-4 border-b border-[#C9D5E6]">
            <div className="flex items-center gap-2 mb-1">
              <SlidersHorizontal size={14} className="text-[#B45309]" />
              <h2 className="font-display text-sm font-bold text-[#0F172A]">Cấu hình nhóm</h2>
            </div>
            <p className="text-[13px] leading-relaxed text-[#64748B] mb-4">
              {canEdit
                ? "Đổi tên và mức phí cho nhóm đang chọn."
                : "Chỉ quản trị viên được đổi tên nhóm và mức phí."}
            </p>

            <div className="space-y-4">
              <div>
                <Label className={labelCls}>Tên nhóm</Label>
                <Input
                  value={activeGroup?.name || ""}
                  onChange={(e) => patchGroup({ name: e.target.value })}
                  placeholder="Tên nhóm"
                  disabled={!canEdit}
                  className={`${inputCls} disabled:opacity-60`}
                />
              </div>
              <div>
                <Label className={labelCls}>Phí vào (%)</Label>
                <FeeInput
                  value={activeGroup?.fee_rate ?? 6}
                  onCommit={(v) => patchGroup({ fee_rate: v })}
                  disabled={!canEdit}
                  className={`${inputCls} font-mono tabular-nums disabled:opacity-60`}
                />
              </div>
              <div>
                <Label className={labelCls}>Phí ra (%)</Label>
                <FeeInput
                  value={activeGroup?.out_fee_rate ?? 6}
                  onCommit={(v) => patchGroup({ out_fee_rate: v })}
                  disabled={!canEdit}
                  className={`${inputCls} font-mono tabular-nums disabled:opacity-60`}
                />
              </div>
              {canEdit && (
                <Button
                  onClick={deleteGroup}
                  variant="outline"
                  className="w-full bg-white border-[#CBD5E6] text-[#475569] hover:text-[#DC2626] hover:border-[#DC2626]/40 hover:bg-[#FEF2F2] rounded-lg"
                >
                  <Trash2 size={14} className="mr-2" /> Xoá nhóm này
                </Button>
              )}
            </div>
          </div>

          {profitOnly ? (
            <div className="p-4 border-b border-[#C9D5E6]">
              <SectionTitle hint="Tự động theo mức phí của từng nhóm tổ">Lợi nhuận tự động</SectionTitle>
              <p className="text-[13px] font-medium leading-relaxed text-[#5B6B85]">
                Chỉ tính các nhóm tổ: mỗi ngày một dòng, gồm tên nhóm, mức phí %, tổng tiền vào và phí.
                Lợi nhuận tổng là tổng phí của tất cả các nhóm tổ — đổi mức phí ở tab nhóm để cập nhật lại.
              </p>
            </div>
          ) : (
          <div className="p-4 border-b border-[#C9D5E6]">
            <SectionTitle
              hint={
                usdtOnly
                  ? "Nhập từng lệnh: tên, số U xuất và lãi."
                  : expenseOnly
                  ? "Nhập từng khoản chi cho nhóm đang chọn."
                  : "Nhập tiền vào / ra cho nhóm đang chọn."
              }
            >
              Thêm giao dịch
            </SectionTitle>
            <div className="space-y-4">
              {!expenseOnly && !profitOnly && !usdtOnly && (
                <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#E1E8F2] border border-[#C9D5E6]">
                  <button
                    onClick={() => setForm({ ...form, type: "in" })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
                      form.type === "in" ? "bg-[#0E9F6E] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <ArrowDownCircle size={14} /> Tiền vào
                  </button>
                  <button
                    onClick={() => setForm({ ...form, type: "out" })}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
                      form.type === "out" ? "bg-[#D97706] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <ArrowUpCircle size={14} /> Tiền ra
                  </button>
                </div>
              )}
              {usdtOnly && (
                <div>
                  <Label className={labelCls}>Số U xuất</Label>
                  <Input
                    inputMode="decimal"
                    value={form.usdt}
                    onChange={(e) => setForm({ ...form, usdt: e.target.value })}
                    placeholder="1000"
                    className={`${inputCls} font-mono tabular-nums`}
                  />
                </div>
              )}
              <div>
                <Label className={labelCls}>{usdtOnly ? "Lãi (VNĐ)" : "Số tiền (VNĐ)"}</Label>
                <Input
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="1.500.000"
                  className={`${inputCls} font-mono tabular-nums`}
                />
                {parseAmount(form.amount) > 0 && (
                  <p className="mt-2 font-mono text-[11px] font-semibold tabular-nums text-[#64748B]">
                    = {fmt(parseAmount(form.amount))} ₫
                  </p>
                )}
              </div>
              <div>
                <Label className={labelCls}>{usdtOnly ? "Tên" : "Ghi chú"}</Label>
                <Input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder={usdtOnly ? "Tên lệnh / đối tác…" : "Nội dung…"}
                  className={inputCls}
                />
                {!usdtOnly && (
                  <NoteQuickPicks
                    entityName="Transaction"
                    type={form.type}
                    groupId={activeGroup?.id}
                    onPick={(note) => setForm({ ...form, note })}
                  />
                )}
              </div>
              <div>
                <Label className={labelCls}>Ngày</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={`${inputCls} font-mono`}
                />
              </div>
              <Button
                onClick={add}
                className="w-full bg-[#0E9F6E] hover:bg-[#0B8A5E] text-white font-semibold rounded-lg shadow-sm"
              >
                <Plus size={15} className="mr-2" /> Thêm giao dịch
              </Button>
              {!usdtOnly && (
              <QuickImport
                onImport={importMany}
                hint={
                  expenseOnly
                    ? "Số tiền nhập vào được tính là khoản chi."
                    : profitOnly
                    ? "Số tiền nhập vào được tính là lợi nhuận."
                    : "Số dương = tiền vào, số âm = tiền ra. Dòng không có ngày sẽ dùng ngày ở trên."
                }
              />
              )}
            </div>
          </div>
          )}
        </>
      )}

      {isInOut && (
        <>
          <InOutFeeForm rate={inoutRate} canEdit={canEdit} onChange={onPatchInoutRate} />
          <InOutForm canEdit={canEdit} onAdd={onAddInOut} />
        </>
      )}

      {isPayout && <PayoutForm canEdit={canEdit} onAdd={onAddPayout} />}

      <OverviewPanel
        isSummary={isSummary}
        isSettle={isSettle}
        isInOut={isInOut}
        isPayout={isPayout}
        expenseOnly={expenseOnly}
        profitOnly={profitOnly}
        usdtOnly={usdtOnly}
        usdtTotal={usdtTotal}
        settle={settle}
        totalIn={totalIn}
        totalOut={totalOut}
        afterFee={afterFee}
        transactions={transactions}
        ins={ins}
        outs={outs}
      />
    </aside>
  );
}