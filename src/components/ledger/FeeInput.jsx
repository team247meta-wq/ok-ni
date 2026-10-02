import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export default function FeeInput({ value, disabled, onCommit, className = "" }) {
  const [text, setText] = useState(String(value ?? ""));

  useEffect(() => {
    setText(String(value ?? ""));
  }, [value]);

  const commit = () => {
    const n = parseFloat(text.replace(",", "."));
    onCommit(Number.isFinite(n) ? n : 0);
  };

  return (
    <Input
      inputMode="decimal"
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={className}
    />
  );
}