import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardPaste, Check } from "lucide-react";

export default function QuickImport({ onImport, hint }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await onImport(text);
    setBusy(false);
    if (ok) setText("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#CBD5E6] text-[13px] font-semibold text-[#64748B] hover:text-[#0E9F6E] hover:border-[#0E9F6E] hover:bg-[#ECFDF5] transition-colors"
      >
        <ClipboardPaste size={14} /> Nhập nhanh nhiều dòng
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[#C9D5E6] bg-[#E9EFF7] p-3 space-y-3">
      <p className="text-[11px] leading-relaxed text-[#64748B]">
        Dán trực tiếp từ Excel (Ctrl+V). Mỗi dòng một khoản:{" "}
        <span className="font-mono font-semibold text-[#0F172A]">Ngày | Số tiền | Ghi chú</span> — dòng tiêu đề và ô trống
        được tự bỏ qua.
      </p>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={
          "Ngày\tTiền vào\tTiền ra\tGhi chú\n20/09/2026\t1.500.000\t\tHoa hồng\n20/09/2026\t\t300.000\tThưởng"
        }
        className="bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg font-mono text-xs placeholder:text-[#94A3B8] focus-visible:ring-[#2563EB]/30"
      />
      {hint && <p className="text-[11px] text-[#64748B]">{hint}</p>}
      <div className="flex gap-2">
        <Button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="flex-1 bg-[#0E9F6E] hover:bg-[#0B8A5E] text-white font-semibold rounded-lg"
        >
          <Check size={15} className="mr-2" /> {busy ? "Đang nhập…" : "Nhập"}
        </Button>
        <Button
          onClick={() => {
            setOpen(false);
            setText("");
          }}
          variant="outline"
          className="bg-white border-[#CBD5E6] text-[#475569] hover:bg-[#F1F5F9] rounded-lg"
        >
          Đóng
        </Button>
      </div>
    </div>
  );
}