import React from "react";
import { Pencil, Trash2 } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Math.round(n || 0));
const d = (v) => (v ? new Date(v).toLocaleDateString("vi-VN") : "");

const Cell = ({ children, className = "", ...rest }) => (
  <td className={`border-b border-[#EDF1F7] px-3 py-2 align-middle ${className}`} {...rest}>
    {children}
  </td>
);

const HeadCell = ({ children, className = "" }) => (
  <th className={`px-3 py-2 text-[13px] font-semibold tracking-wide text-[#5B6B85] ${className}`}>
    {children}
  </th>
);

const DateCell = ({ t }) => (
  <Cell className="w-24 font-mono text-[14px] tabular-nums text-[#64748B]">{t ? d(t.date) : "—"}</Cell>
);

const NoteCell = ({ t }) => (
  <Cell className="max-w-[200px] truncate text-[14px] text-[#334155]">{t ? t.note || "" : ""}</Cell>
);

const AmountCell = ({ t, tone }) => (
  <Cell className="w-32 text-right font-mono text-[16px] font-bold tabular-nums">
    {t ? (
      <span className={tone}>
        {t.type === "in" ? "+" : "−"}{fmt(t.amount)}
      </span>
    ) : (
      <span className="text-[#CBD5E1]">—</span>
    )}
  </Cell>
);

const FeeCell = ({ t, rate }) => (
  <Cell className="w-28 text-right font-mono text-[15px] font-semibold tabular-nums text-[#B45309]">
    {t ? fmt((t.amount || 0) * (rate / 100)) : <span className="text-[#CBD5E1]">—</span>}
  </Cell>
);

const ActionsCell = ({ t, onRemove, onEdit, canEdit }) => (
  <Cell className="w-12 text-center">
    {t && canEdit ? (
      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition">
        <button onClick={() => onEdit(t)} className="text-[#94A3B8] hover:text-[#B45309]" title="Sửa">
          <Pencil size={14} />
        </button>
        <button onClick={() => onRemove(t.id)} className="text-[#94A3B8] hover:text-[#DC2626]" title="Xoá">
          <Trash2 size={15} />
        </button>
      </div>
    ) : null}
  </Cell>
);

export default function InOutTable({
  ins = [],
  outs = [],
  loading,
  onRemove,
  onEdit,
  canEdit,
  feeIn = 6,
  feeOut = 6,
}) {
  const rows = Math.max(ins.length, outs.length, 1);
  const totalIn = ins.reduce((s, t) => s + (t.amount || 0), 0);
  const totalOut = outs.reduce((s, t) => s + (t.amount || 0), 0);
  const totalFeeIn = ins.reduce((s, t) => s + (t.amount || 0) * (feeIn / 100), 0);
  const totalFeeOut = outs.reduce((s, t) => s + (t.amount || 0) * (feeOut / 100), 0);

  return (
    <div className="rounded-xl border border-[#C9D5E6] bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[1040px]">
          <thead>
            <tr>
              <th colSpan={10} className="border-b border-[#C9D5E6] bg-[#E9EFF7] px-3 py-2 text-center">
                <span className="font-display text-lg font-extrabold text-[#0F172A] sm:text-xl">
                  RA TIỀN MẶT
                </span>
              </th>
            </tr>
            <tr>
              <th colSpan={5} className="border-b border-[#C9D5E6] bg-[#D5F3E4] py-2 text-center text-[14px] font-extrabold tracking-wide text-[#047857]">
                Tiền vào
              </th>
              <th colSpan={5} className="border-b border-[#C9D5E6] bg-[#FBE7CB] py-2 text-center text-[14px] font-extrabold tracking-wide text-[#B45309]">
                Tiền ra
              </th>
            </tr>
            <tr className="bg-[#E9EFF7]">
              <HeadCell className="text-left w-24">Ngày</HeadCell>
              <HeadCell className="text-left">Nội dung</HeadCell>
              <HeadCell className="text-right w-32">Số tiền</HeadCell>
              <HeadCell className="text-right w-28">Phí</HeadCell>
              <HeadCell className="w-12" />
              <HeadCell className="text-left w-24">Ngày</HeadCell>
              <HeadCell className="text-left">Nội dung</HeadCell>
              <HeadCell className="text-right w-32">Số tiền</HeadCell>
              <HeadCell className="text-right w-28">Phí</HeadCell>
              <HeadCell className="w-12" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[15px] text-[#64748B]">Đang tải dữ liệu…</td>
              </tr>
            ) : ins.length === 0 && outs.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-10 text-center">
                  <p className="text-[15px] font-semibold text-[#64748B]">Chưa có giao dịch nào</p>
                  <p className="mt-1 text-[13px] text-[#94A3B8]">Thêm khoản nhập hoặc xuất ở bảng điều khiển bên trái.</p>
                </td>
              </tr>
            ) : (
              Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="group/row odd:bg-[#FBFCFE] hover:bg-[#F1F5F9] transition-colors">
                  <DateCell t={ins[i]} />
                  <NoteCell t={ins[i]} />
                  <AmountCell t={ins[i]} tone="text-[#047857]" />
                  <FeeCell t={ins[i]} rate={feeIn} />
                  <ActionsCell t={ins[i]} onRemove={onRemove} onEdit={onEdit} canEdit={canEdit} />
                  <DateCell t={outs[i]} />
                  <NoteCell t={outs[i]} />
                  <AmountCell t={outs[i]} tone="text-[#DC2626]" />
                  <FeeCell t={outs[i]} rate={feeOut} />
                  <ActionsCell t={outs[i]} onRemove={onRemove} onEdit={onEdit} canEdit={canEdit} />
                </tr>
              ))
            )}

            <tr>
              <td colSpan={10} className="h-1.5 bg-white" />
            </tr>
            <tr className="bg-[#D5F3E4]">
              <Cell colSpan={2} className="text-[15px] font-bold text-[#0F172A] border-b-0">TỔNG VÀO</Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#047857] border-b-0">
                {fmt(totalIn)}
              </Cell>
              <Cell className="text-right font-mono text-[12px] font-semibold tabular-nums text-[#B45309] border-b-0">
                Phí: {fmt(totalFeeIn)}
              </Cell>
              <Cell colSpan={3} className="text-[15px] font-bold text-[#0F172A] border-b-0">TỔNG RA</Cell>
              <Cell className="text-right font-mono text-[15px] font-bold tabular-nums text-[#DC2626] border-b-0">
                {fmt(totalOut)}
              </Cell>
              <Cell className="text-right font-mono text-[12px] font-semibold tabular-nums text-[#B45309] border-b-0">
                Phí: {fmt(totalFeeOut)}
              </Cell>
              <Cell className="border-b-0" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}