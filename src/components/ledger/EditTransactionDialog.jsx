import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { parseAmount } from "@/lib/parseLedgerPaste";

const inputCls =
  "bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg placeholder:text-[#94A3B8] focus-visible:ring-[#2563EB]/30";

const labelCls = "text-[11px] font-bold text-[#64748B] mb-2 block";

export default function EditTransactionDialog({ transaction, onClose, onSave, usdt = false }) {
  const [form, setForm] = useState({
    type: transaction.type || "in",
    amount: String(transaction.amount ?? ""),
    usdt: String(transaction.usdt_out ?? ""),
    note: transaction.note || "",
    date: transaction.date || "",
  });

  const submit = () => {
    const amount = parseAmount(form.amount);
    if (!amount || amount <= 0) return;
    const patch = { type: form.type, amount, note: form.note, date: form.date };
    if (usdt) patch.usdt_out = parseAmount(form.usdt);
    onSave(patch);
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white border-[#C9D5E6] text-[#0F172A] font-body sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[15px] font-bold">
            Sửa giao dịch
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!usdt && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#F1F5F9] border border-[#C9D5E6]">
            <button
              onClick={() => setForm({ ...form, type: "in" })}
              className={`py-2 rounded-md text-[13px] font-semibold transition ${
                form.type === "in" ? "bg-[#0E9F6E] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Tiền vào
            </button>
            <button
              onClick={() => setForm({ ...form, type: "out" })}
              className={`py-2 rounded-md text-[13px] font-semibold transition ${
                form.type === "out" ? "bg-[#D97706] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Tiền ra
            </button>
          </div>
          )}

          {usdt && (
            <div>
              <Label className={labelCls}>Số U xuất</Label>
              <Input
                inputMode="decimal"
                value={form.usdt}
                onChange={(e) => setForm({ ...form, usdt: e.target.value })}
                className={`${inputCls} font-mono tabular-nums`}
              />
            </div>
          )}

          <div>
            <Label className={labelCls}>{usdt ? "Lãi (VNĐ)" : "Số tiền (VNĐ)"}</Label>
            <Input
              inputMode="decimal"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className={`${inputCls} font-mono tabular-nums`}
            />
          </div>

          <div>
            <Label className={labelCls}>{usdt ? "Tên" : "Ghi chú"}</Label>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className={inputCls}
            />
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

          <div className="flex gap-2 pt-1">
            <Button
              onClick={submit}
              className="flex-1 bg-[#0E9F6E] hover:bg-[#0B8A5E] text-white font-semibold rounded-lg"
            >
              <Save size={15} className="mr-2" /> Lưu thay đổi
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-white border-[#CBD5E6] text-[#475569] hover:bg-[#F1F5F9] rounded-lg"
            >
              Huỷ
            </Button>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Bản cũ được lưu lại — vào tab LỊCH SỬ để khôi phục nếu cần.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}