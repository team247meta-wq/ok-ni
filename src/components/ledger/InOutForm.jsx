import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDownCircle, ArrowUpCircle, Plus } from "lucide-react";
import SectionTitle from "@/components/ledger/SectionTitle";
import NoteQuickPicks from "@/components/ledger/NoteQuickPicks";
import { parseAmount } from "@/lib/parseLedgerPaste";

const inputCls =
  "bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg placeholder:text-[#94A3B8] focus-visible:ring-[#2563EB]/30";
const labelCls = "text-[12px] font-bold text-[#64748B] mb-2 block";

export default function InOutForm({ canEdit, onAdd }) {
  const [form, setForm] = useState({
    type: "in",
    note: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const amount = parseAmount(form.amount);

  const submit = async () => {
    if (!canEdit) return;
    const ok = await onAdd({ ...form, amount });
    if (ok) setForm((f) => ({ ...f, amount: "", note: "" }));
  };

  return (
    <div className="p-4 border-b border-[#C9D5E6]">
      <SectionTitle hint="Sổ riêng — điền nội dung rồi thêm khoản nhập hoặc xuất.">
        Thêm nhập / xuất
      </SectionTitle>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-[#E1E8F2] border border-[#C9D5E6]">
          <button
            onClick={() => setForm({ ...form, type: "in" })}
            disabled={!canEdit}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
              form.type === "in" ? "bg-[#0E9F6E] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <ArrowDownCircle size={14} /> Nhập
          </button>
          <button
            onClick={() => setForm({ ...form, type: "out" })}
            disabled={!canEdit}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-semibold transition ${
              form.type === "out" ? "bg-[#D97706] text-white shadow-sm" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <ArrowUpCircle size={14} /> Xuất
          </button>
        </div>

        <div>
          <Label className={labelCls}>Nội dung</Label>
          <Input
            value={form.note}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Nội dung…"
            className={inputCls}
          />
          <NoteQuickPicks
            entityName="InOutEntry"
            type={form.type}
            onPick={(note) => setForm({ ...form, note })}
          />
        </div>

        <div>
          <Label className={labelCls}>Số tiền (VNĐ)</Label>
          <Input
            inputMode="decimal"
            value={form.amount}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="1.500.000"
            className={`${inputCls} font-mono tabular-nums`}
          />
        </div>

        <div>
          <Label className={labelCls}>Ngày</Label>
          <Input
            type="date"
            value={form.date}
            disabled={!canEdit}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className={`${inputCls} font-mono`}
          />
        </div>

        <Button
          onClick={submit}
          disabled={!canEdit}
          className="w-full bg-[#0E9F6E] hover:bg-[#0B8A5E] text-white font-semibold rounded-lg shadow-sm"
        >
          <Plus size={15} className="mr-2" /> Thêm {form.type === "in" ? "khoản nhập" : "khoản xuất"}
        </Button>
      </div>
    </div>
  );
}