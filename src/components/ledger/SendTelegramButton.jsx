import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { captureReportImage } from "@/lib/captureReport";

// Chụp bảng chính rồi gửi ảnh vào nhóm Telegram qua bot.
export default function SendTelegramButton({ targetRef, title = "", subtitle = "" }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleSend = async () => {
    setBusy(true);
    try {
      const { blob } = await captureReportImage({ targetRef, title, subtitle });
      const file = new File([blob], "bao-cao.png", { type: "image/png" });
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });

      const res = await base44.functions.invoke("sendTelegramReport", {
        photo_url: file_url,
        caption: [title, subtitle].filter(Boolean).join(" · "),
      });
      if (res.data?.error) throw new Error(res.data.error);

      toast({ title: "Đã gửi ảnh lên nhóm Telegram" });
    } catch (e) {
      toast({
        title: "Không gửi được ảnh",
        description: e?.response?.data?.error || e.message,
        variant: "destructive",
      });
    }
    setBusy(false);
  };

  return (
    <Button
      onClick={handleSend}
      disabled={busy}
      variant="outline"
      className="bg-white border-[#CBD5E6] text-[#0F172A] hover:bg-[#EAF1FB] hover:text-[#229ED9] rounded-lg font-medium"
    >
      {busy ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Send size={15} className="mr-2" />}
      <span className="hidden sm:inline">{busy ? "Đang gửi…" : "Gửi Telegram"}</span>
    </Button>
  );
}