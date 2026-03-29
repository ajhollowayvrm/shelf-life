"use client";

interface QuantityAdjusterProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}

export default function QuantityAdjuster({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  unit,
}: QuantityAdjusterProps) {
  const decrement = () => {
    const next = Math.max(min, +(value - step).toFixed(2));
    onChange(next);
  };

  const increment = () => {
    const next = Math.min(max, +(value + step).toFixed(2));
    onChange(next);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-bg-secondary text-text-primary text-lg font-bold hover:bg-bg-tertiary active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <div className="min-w-[60px] text-center">
        <span className="text-xl font-semibold text-text-primary tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-text-secondary ml-1">{unit}</span>
        )}
      </div>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className="w-11 h-11 flex items-center justify-center rounded-full bg-bg-secondary text-text-primary text-lg font-bold hover:bg-bg-tertiary active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
