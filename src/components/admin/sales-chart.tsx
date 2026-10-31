import React from "react";

interface SalesChartProps {
  data: Array<{
    date: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
  title?: string;
  subtitle?: string;
}

export function SalesChart({
  data,
  title = "Sales Performance",
  subtitle = "Revenue trends across the selected duration",
}: SalesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-8 text-center rounded-sm">
        <p className="text-sm text-[#74786F]">No sales recorded for this period.</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 10000);
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 30;

  const points = data.map((d, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (d.revenue / maxRevenue) * (chartHeight - paddingY * 2);
    return { ...d, x, y };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
      : "";

  return (
    <div className="bg-[#FAF9F5] border border-[#E2DFD6] p-6 rounded-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b border-[#E2DFD6] gap-2">
        <div>
          <h3 className="font-serif text-lg text-[#176B45]">{title}</h3>
          <p className="text-xs text-[#74786F]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#176B45]" />
            <span className="text-[#315039] font-medium">Revenue (₹)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#AA9160]" />
            <span className="text-[#74786F]">Orders</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full min-w-[500px] h-[240px]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#176B45" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#176B45" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight - paddingY - ratio * (chartHeight - paddingY * 2);
            const val = Math.round(maxRevenue * ratio);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#E2DFD6"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#74786F"
                >
                  ₹{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#revenueGradient)" />}

          {/* Main revenue line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#176B45"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points & Labels */}
          {points.map((pt, i) => (
            <g key={i} className="group">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4"
                fill="#FAF9F5"
                stroke="#176B45"
                strokeWidth="2"
              />
              {/* X Axis Label */}
              <text
                x={pt.x}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#74786F"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

