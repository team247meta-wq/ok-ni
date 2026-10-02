import React from "react";
import { Plus, Building2, History, ArrowLeftRight, Send } from "lucide-react";

const inactive =
  "bg-white text-[#475569] border-[#CBD5E6] hover:text-[#0F172A] hover:border-[#94A3B8] hover:bg-[#F8FAFC]";

const tabCls = (active, activeCls) =>
  `shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[15px] border transition-colors ${
    active ? activeCls : inactive
  }`;

const GroupButton = ({ g, active, onSelect }) => (
  <button onClick={() => onSelect(g.id)} className={tabCls(active, "bg-[#0E9F6E] text-white border-[#0E9F6E]")}>
    <span className="max-w-[180px] truncate">{g.name}</span>
    <span
      className={`font-mono text-[12px] font-semibold tabular-nums px-1.5 py-0.5 rounded ${
        active ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#64748B]"
      }`}
    >
      {g.fee_rate ?? 6}%
    </span>
  </button>
);

const RowLabel = ({ children, tone }) => (
  <span className={`text-[12px] font-bold tracking-wide ${tone}`}>{children}</span>
);

export default function GroupTabs({
  groups,
  activeId,
  onSelect,
  onAdd,
  summaryActive,
  onSelectSummary,
  historyActive,
  onSelectHistory,
  inOutActive,
  onSelectInOut,
  payoutActive,
  onSelectPayout,
  canAdd,
}) {
  const companyGroups = groups.filter((g) => g.mode && g.mode !== "full");
  const teamGroups = groups.filter((g) => !g.mode || g.mode === "full");

  return (
    <div className="grid gap-3 lg:grid-cols-2 mb-4">
      <div className="rounded-xl border border-[#C9D5E6] bg-white p-3 shadow-sm">
        <RowLabel tone="text-[#1D4ED8]">Khối công ty</RowLabel>
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={onSelectSummary}
            className={tabCls(summaryActive, "bg-[#1D4ED8] text-white border-[#1D4ED8]")}
          >
            <Building2 size={14} />
            <span>TỔNG CÔNG TY</span>
          </button>
          <button
            onClick={onSelectInOut}
            className={tabCls(inOutActive, "bg-[#0F766E] text-white border-[#0F766E]")}
          >
            <ArrowLeftRight size={14} />
            <span>RA TIỀN MẶT</span>
          </button>
          <button
            onClick={onSelectPayout}
            className={tabCls(payoutActive, "bg-[#DC2626] text-white border-[#DC2626]")}
          >
            <Send size={14} />
            <span>TIỀN XUẤT ĐI</span>
          </button>
          {companyGroups.map((g) => (
            <GroupButton key={g.id} g={g} active={g.id === activeId} onSelect={onSelect} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[#C9D5E6] bg-white p-3 shadow-sm">
        <RowLabel tone="text-[#0E9F6E]">Nhóm tổ</RowLabel>
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1">
          {teamGroups.map((g) => (
            <GroupButton key={g.id} g={g} active={g.id === activeId} onSelect={onSelect} />
          ))}
          {canAdd && (
            <button
              onClick={onAdd}
              title="Thêm nhóm"
              className="shrink-0 w-[38px] h-[38px] flex items-center justify-center rounded-lg border border-dashed border-[#CBD5E6] text-[#64748B] hover:text-[#0E9F6E] hover:border-[#0E9F6E] hover:bg-[#ECFDF5] transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
          <button
            onClick={onSelectHistory}
            className={tabCls(historyActive, "bg-[#7C3AED] text-white border-[#7C3AED]")}
          >
            <History size={14} />
            <span>LỊCH SỬ</span>
          </button>
        </div>
      </div>
    </div>
  );
}