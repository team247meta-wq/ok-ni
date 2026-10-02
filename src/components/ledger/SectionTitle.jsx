import React from "react";

export default function SectionTitle({ children, hint }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-[13px] font-bold text-[#0F172A]">{children}</h2>
      {hint && <p className="mt-1 text-xs leading-relaxed text-[#64748B]">{hint}</p>}
    </div>
  );
}