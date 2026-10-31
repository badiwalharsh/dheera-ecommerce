import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  highlight = false,
}: MetricCardProps) {
  return (
    <div
      className={`p-5 rounded-sm border transition-all ${
        highlight
          ? "bg-[#176B45] text-white border-[#176B45]"
          : "bg-[#FAF9F5] text-[#252A25] border-[#E2DFD6] hover:border-[#AA9160]/50"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] uppercase tracking-luxury font-medium ${
            highlight ? "text-[#EEEAE0]/80" : "text-[#74786F]"
          }`}
        >
          {title}
        </span>
        {icon && (
          <span
            className={`p-2 rounded-full ${
              highlight ? "bg-white/10 text-[#EEEAE0]" : "bg-[#EEEAE0] text-[#176B45]"
            }`}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <h3
          className={`text-2xl sm:text-3xl font-serif font-normal ${
            highlight ? "text-white" : "text-[#176B45]"
          }`}
        >
          {value}
        </h3>
        {trend && (
          <span
            className={`text-[11px] font-medium ${
              trend.isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {trend.isPositive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p
          className={`text-[11px] mt-1.5 ${
            highlight ? "text-[#EEEAE0]/70" : "text-[#74786F]"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

