import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { parseAmount } from "@/lib/parseLedgerPaste";

const inputCls =
  "bg-white border-[#CBD5E6] text-[#0F172A] rounded-lg placeholder:text-[#94A3B8] focus-visible:ring-[#2563EB]/30";
const labelCls = "text-[12px] font-bold text-[#64748B] mb-2 block";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const d = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "—");

const HeadCell = ({ children, className = "" }) => (
  <th className={`border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-[12px] font-bold text-[#475569] ${className}`}>
    {children}
  </th>
);

// Sổ xuất đi ghi riêng: form ghi khoản xuất đi + danh sách tự ghi ngay bên dưới.
export default function PayoutQuickForm({
  groups = [],
  canEdit,
  onAdd,
  onUpdate,
  onRemove,
  entries = [],
  loading,
}) {
  const [form, setForm] = useState({
    group_id: "",
    amount: "",
    note: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ group_id: "", amount: "", note: "", date: "" });
  const amount = parseAmount(form.amount);

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({
      group_id: t.group_id || "",
      amount: String(t.amount ?? ""),
      note: t.note || "",
      date: t.date || "",
    });
  };

  const saveEdit = async () => {
    const ok = await onUpdate(editingId, {
      group_id: editForm.group_id,
      amount: parseAmount(editForm.amount),
      note: (editForm.note || "").trim(),
      date: editForm.date,
    });
    if (ok !== false) setEditingId(null);
  };

  const submit = async () => {
    if (!canEdit) return;
    const ok = await onAdd({
      group_id: form.group_id,
      amount,
      note: form.note,
      date: form.date,
    });
    if (ok) setForm((f) => ({ ...f, amount: "", note: "" }));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#C9D5E6] bg-white shadow-sm">
      <div className="border-b border-[#C9D5E6] bg-[#FBE0E0] px-3 py-2 text-center">
        <span className="font-display text-[16px] font-extrabold tracking-tight text-[#B91C1C] sm:text-[17px]">
          GHI KHOẢN XUẤT ĐI
        </span>
      </div>

      <div className="space-y-3 p-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label className={labelCls}>Từ</Label>
            <select
              value={form.group_id}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, group_id: e.target.value })}
              className={`${inputCls} h-10 w-full px-3 text-sm disabled:opacity-60`}
            >
              <option value="">— Chọn nhóm —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className={labelCls}>Số tiền (VNĐ)</Label>
            <Input
              inputMode="decimal"
              value={form.amount}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="1.500.000"
              className={`${inputCls} font-mono tabular-nums disabled:opacity-60`}
            />
          </div>

          <div>
            <Label className={labelCls}>Nội dung</Label>
            <Input
              value={form.note}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Xuất cho ai, vì việc gì…"
              className={`${inputCls} disabled:opacity-60`}
            />
          </div>

          <div>
            <Label className={labelCls}>Ngày</Label>
            <Input
              type="date"
              value={form.date}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={`${inputCls} font-mono disabled:opacity-60`}
            />
          </div>
        </div>

        <Button
          onClick={submit}
          disabled={!canEdit}
          className="w-full rounded-lg bg-[#DC2626] font-semibold text-white shadow-sm hover:bg-[#B91C1C]"
        >
          <Plus size={15} className="mr-2" /> Thêm khoản xuất đi
        </Button>
      </div>

      <div className="border-t border-[#C9D5E6]">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <HeadCell className="w-28 text-left">Ngày</HeadCell>
                <HeadCell className="text-left">Từ</HeadCell>
                <HeadCell className="text-left">Nội dung</HeadCell>
                <HeadCell className="w-36 text-right">Số tiền</HeadCell>
                {canEdit && <HeadCell className="w-24 text-right">Sửa · Xoá</HeadCell>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="py-6 text-center text-[14px] text-[#64748B]">
                    Đang tải dữ liệu…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="py-8 text-center">
                    <p className="text-[14px] font-semibold text-[#64748B]">Chưa ghi khoản xuất đi nào</p>
                    <p className="mt-1 text-[12px] text-[#94A3B8]">
                      Điền form ở trên, khoản xuất đi sẽ hiện ngay tại đây.
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((t) =>
                  t.id === editingId ? (
                    <tr key={t.id} className="bg-[#FFF7F7]">
                      <td className="border-b border-[#EDF1F7] px-2 py-1.5">
                        <Input
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className={`${inputCls} h-9 font-mono text-[13px]`}
                        />
                      </td>
                      <td className="border-b border-[#EDF1F7] px-2 py-1.5">
                        <select
                          value={editForm.group_id}
                          onChange={(e) => setEditForm({ ...editForm, group_id: e.target.value })}
                          className={`${inputCls} h-9 w-full px-2 text-sm`}
                        >
                          <option value="">— Chọn nhóm —</option>
                          {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-b border-[#EDF1F7] px-2 py-1.5">
                        <Input
                          value={editForm.note}
                          onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                          className={`${inputCls} h-9 text-sm`}
                        />
                      </td>
                      <td className="border-b border-[#EDF1F7] px-2 py-1.5">
                        <Input
                          inputMode="decimal"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          className={`${inputCls} h-9 text-right font-mono text-sm tabular-nums`}
                        />
                      </td>
                      {canEdit && (
                        <td className="border-b border-[#EDF1F7] px-2 py-1.5">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Lưu"
                              onClick={saveEdit}
                              className="h-8 w-8 text-[#047857] hover:bg-[#E7F6EF]"
                            >
                              <Check size={15} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Huỷ"
                              onClick={() => setEditingId(null)}
                              className="h-8 w-8 text-[#64748B] hover:bg-[#EEF2F7]"
                            >
                              <X size={15} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : (
                    <tr key={t.id} className="group odd:bg-[#FBFCFE]">
                      <td className="border-b border-[#EDF1F7] px-3 py-2 font-mono text-[13px] tabular-nums text-[#64748B]">
                        {d(t.date)}
                      </td>
                      <td className="border-b border-[#EDF1F7] px-3 py-2 text-[14px] font-medium text-[#0F172A]">
                        {groups.find((g) => g.id === t.group_id)?.name || <span className="text-[#CBD5E1]">—</span>}
                      </td>
                      <td className="border-b border-[#EDF1F7] px-3 py-2 text-[14px] text-[#334155]">
                        {t.note || ""}
                      </td>
                      <td className="border-b border-[#EDF1F7] px-3 py-2 text-right font-mono text-[15px] font-bold tabular-nums text-[#DC2626]">
                        −{fmt(t.amount)}
                      </td>
                      {canEdit && (
                        <td className="border-b border-[#EDF1F7] px-2 py-2">
                          <div className="flex justify-end gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Sửa"
                              onClick={() => startEdit(t)}
                              className="h-8 w-8 text-[#2563EB] hover:bg-[#EAF0FE]"
                            >
                              <Pencil size={15} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Xoá"
                              onClick={() => onRemove(t.id)}
                              className="h-8 w-8 text-[#DC2626] hover:bg-[#FDE7E7]"
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                )
              )}
              {!loading && entries.length > 0 && (
                <tr className="bg-[#FBE0E0]">
                  <td colSpan={canEdit ? 4 : 3} className="px-3 py-2 text-[14px] font-bold text-[#B91C1C]">
                    TỔNG XUẤT ĐI
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[15px] font-extrabold tabular-nums text-[#B91C1C]">
                    −{fmt(entries.reduce((s, t) => s + (t.amount || 0), 0))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}