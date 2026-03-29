import { StockInfo } from "@/types";

interface StockBarProps {
  stock: StockInfo;
  className?: string;
}

export default function StockBar({ stock, className = "" }: StockBarProps) {
  const percentage = Math.min(Math.max(stock.percentage * 100, 0), 100);

  return (
    <div
      className={`h-1.5 w-full bg-bg-tertiary rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Stock level: ${stock.label} (${Math.round(percentage)}%)`}
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: stock.color,
        }}
      />
    </div>
  );
}
