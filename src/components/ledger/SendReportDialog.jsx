import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { buildReportHtml } from "@/lib/buildReport";

const inputCls =
  "bg-white border-[#CBD5E6] text-[#0F172A] placeholder:text-[#94A3B8] rounded-lg focus-visible:ring-[#2563EB]/30";

export default function SendReportDialog({ open, onClose, report, defaultTo }) {
  const { toast } = useToast();
  const [to, setTo] = useState(defaultTo || "");
  const [subject, setSubject] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const target = to.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(target)) {
      toast({ title: "Email người nhận không hợp lệ", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("sendLedgerReportEmail", {
        to: target,
        subject: subject.trim() || `${report.title} · ${report.subtitle}`,
        html: buildReportHtml(report),
      });
      if (res.data?.error) throw new Error(res.data.error);
      toast({
        title: "Đã gửi báo cáo",
        description: `${report.rows.length} dòng · từ Gmail đã liên kết tới ${target}`,
      });
      onClose();
    } catch (e) {
      toast({
        title: "Không gửi được email",
        description: e?.response?.data?.error || e.message,
        variant: "destructive",
      });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-white border-[#C9D5E6] text-[#0F172A] max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <Mail size={18} className="text-[#0E9F6E]" /> Gửi báo cáo qua Gmail
          </DialogTitle>
          <DialogDescription className="text-[#64748B]">
            Nội dung email là bảng đầy đủ của tab đang xem: <b>{report.title}</b> ({report.rows.length} dòng).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-[#64748B] text-[11px] font-bold">Gửi tới</Label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="email@example.com"
              className={inputCls}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#64748B] text-[11px] font-bold">Tiêu đề</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`${report.title} · ${report.subtitle}`}
              className={inputCls}
            />
          </div>
          <p className="text-[11px] text-[#64748B]">
            Email được gửi từ địa chỉ Gmail bạn đã liên kết với app.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-white border-[#CBD5E6] text-[#475569] hover:bg-[#F1F5F9] rounded-lg"
          >
            Huỷ
          </Button>
          <Button
            onClick={send}
            disabled={sending}
            className="bg-[#0E9F6E] text-white hover:bg-[#0B8A5E] font-semibold rounded-lg"
          >
            {sending ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Mail size={15} className="mr-2" />}
            {sending ? "Đang gửi…" : "Gửi báo cáo"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}