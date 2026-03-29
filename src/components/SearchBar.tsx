"use client";

import { useRef } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search items...",
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative" role="search">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none" aria-hidden="true">
        🔍
      </span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search pantry items"
        className="w-full h-11 pl-9 pr-10 bg-bg-secondary border border-border rounded-[var(--radius-md)] text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary text-sm w-8 h-8 flex items-center justify-center"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
