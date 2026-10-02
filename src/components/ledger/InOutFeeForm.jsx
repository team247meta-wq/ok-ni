import React from "react";
import { Label } from "@/components/ui/label";
import SectionTitle from "@/components/ledger/SectionTitle";
import FeeInput from "@/components/ledger/FeeInput";

const inputCls =
  "bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg font-mono tabular-nums disabled:opacity-60";

export default function InOutFeeForm({ rate = { in: 6, out: 6 }, canEdit, onChange }) {
  return (
    <div className="p-4 border-b border-[#C9D5E6]">
      <SectionTitle hint="Áp dụng cho toàn bộ mục nhập và xuất">Phí nhập và xuất</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[12px] font-bold text-[#047857] mb-2 block">Phí nhập (%)</Label>
          <FeeInput
            value={rate.in}
            disabled={!canEdit}
            onCommit={(v) => onChange({ ...rate, in: v })}
            className={inputCls}
          />
        </div>
        <div>
          <Label className="text-[12px] font-bold text-[#DC2626] mb-2 block">Phí xuất (%)</Label>
          <FeeInput
            value={rate.out}
            disabled={!canEdit}
            onCommit={(v) => onChange({ ...rate, out: v })}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}