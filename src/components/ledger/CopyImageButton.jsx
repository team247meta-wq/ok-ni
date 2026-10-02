import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Download, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { captureReportImage, downloadImage } from "@/lib/captureReport";

export default function CopyImageButton({ targetRef, fileName = "so-quy", title = "", subtitle = "" }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [blob, setBlob] = useState(null);
  const [copied, setCopied] = useState(false);
  const previewRef = useRef(null);

  const download = (dataUrl) => downloadImage(dataUrl, fileName);

  const legacyCopy = () => {
    const img = previewRef.current;
    if (!img) return false;
    try {
      const range = document.createRange();
      range.selectNode(img);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand("copy");
      sel.removeAllRanges();
      return ok;
    } catch (e) {
      return false;
    }
  };

  const copyImage = async (b) => {
    try {
      window.focus();
      if (b && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": b })]);
        return true;
      }
    } catch (e) {}
    return legacyCopy();
  };

  const handleCopy = async () => {
    if (!targetRef?.current) return;
    setBusy(true);
    try {
      const { dataUrl, blob: b } = await captureReportImage({ targetRef, title, subtitle });
      setPreview(dataUrl);
      setBlob(b);
      const ok = await copyImage(b);
      setCopied(ok);
      if (ok) {
        toast({ title: "Đã sao chép ảnh", description: "Dán vào nhóm chat bằng Ctrl + V." });
      } else {
        toast({ title: "Ảnh đã sẵn sàng", description: "Bấm “Sao chép ảnh” trong cửa sổ xem trước để lấy ảnh." });
      }
    } catch (e) {
      toast({
        title: "Không sao chép được ảnh",
        description: "Hãy dùng Chrome hoặc Edge rồi thử lại.",
        variant: "destructive",
      });
    }
    setBusy(false);
  };

  const handleDialogCopy = async () => {
    const ok = await copyImage(blob);
    setCopied(ok);
    if (ok) {
      toast({ title: "Đã sao chép ảnh", description: "Mở nhóm chat và dán bằng Ctrl + V." });
    } else {
      toast({
        title: "Không sao chép được ảnh",
        description: "Hãy bấm Tải ảnh rồi gửi ảnh đó vào nhóm chat.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        onClick={handleCopy}
        disabled={busy}
        variant="outline"
        className="bg-white border-[#CBD5E6] text-[#0F172A] hover:bg-[#EEF2FF] hover:text-[#4338CA] rounded-lg font-medium"
      >
        {busy ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Camera size={15} className="mr-2" />}
        <span className="hidden sm:inline">{busy ? "Đang tạo ảnh…" : "Sao chép ảnh"}</span>
      </Button>

      {preview && (
        <Dialog open onOpenChange={(v) => !v && setPreview(null)}>
          <DialogContent className="max-w-5xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-[#0F172A]">Ảnh báo cáo đã sẵn sàng</DialogTitle>
            </DialogHeader>
            <div className="max-h-[68vh] overflow-auto rounded-lg border border-[#C9D5E6] bg-[#F1F4FA] p-3">
              <img ref={previewRef} src={preview} alt="Ảnh báo cáo" className="w-full h-auto" />
            </div>
            <p className="text-[13px] text-[#5B6B85]">
              {copied
                ? "Ảnh đã nằm trong bộ nhớ tạm — mở nhóm chat và dán bằng Ctrl + V."
                : "Bấm “Sao chép ảnh” rồi mở nhóm chat và dán bằng Ctrl + V. Nếu vẫn không được, chuột phải vào ảnh chọn “Copy image”, hoặc bấm Tải ảnh."}
            </p>
            <DialogFooter>
              <Button variant="outline" className="border-[#CBD5E6] text-[#0F172A]" onClick={() => download(preview)}>
                <Download size={15} className="mr-2" /> Tải ảnh
              </Button>
              <Button className="bg-[#4338CA] text-white hover:bg-[#3730A3]" onClick={handleDialogCopy}>
                <Camera size={15} className="mr-2" /> {copied ? "Sao chép lại" : "Sao chép ảnh"}
              </Button>
              <Button className="bg-[#0E9F6E] text-white hover:bg-[#0B8A5E]" onClick={() => setPreview(null)}>
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}