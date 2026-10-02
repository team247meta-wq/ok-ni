import React from "react";
import { Building2 } from "lucide-react";

const inactive =
  "bg-white text-[#475569] border-[#CBD5E6] hover:text-[#0F172A] hover:border-[#94A3B8] hover:bg-[#F8FAFC]";

const tabCls = (active, activeCls) =>
  `shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[15px] border transition-colors ${
    active ? activeCls : inactive
  }`;

const MODE_LABEL = { profit: "lợi nhuận", expense: "chi tiêu", usdt: "usdt" };

export default function CompanyTabs({
  groups,
  activeId,
  onSelect,
  summaryActive,
  onSelectSummary,
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-[#C9D5E6] bg-white p-2 shadow-sm">
      <span className="shrink-0 px-1 text-[12px] font-bold text-[#1D4ED8]">Khối công ty</span>
      <button
        onClick={onSelectSummary}
        className={tabCls(summaryActive, "bg-[#1D4ED8] text-white border-[#1D4ED8]")}
      >
        <Building2 size={14} />
        <span>Tổng công ty</span>
      </button>
      {groups.map((g) => {
        const isActive = g.id === activeId;
        return (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className={tabCls(isActive, "bg-[#0E9F6E] text-white border-[#0E9F6E]")}
          >
            <span className="max-w-[200px] truncate">{g.name}</span>
            <span
              className={`text-[12px] font-semibold px-1.5 py-0.5 rounded ${
                isActive ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              {MODE_LABEL[g.mode] || "nhóm"}
            </span>
          </button>
        );
      })}
    </div>
  );
}