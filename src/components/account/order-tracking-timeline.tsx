"use client";

import React from "react";
import { OrderTrackingTimelineStep } from "@/types/account";
import { Check, Clock, PackageCheck, Sparkles } from "lucide-react";

interface OrderTrackingTimelineProps {
  steps: OrderTrackingTimelineStep[];
}

export function OrderTrackingTimeline({ steps }: OrderTrackingTimelineProps) {
  return (
    <div className="py-6">
      {/* Desktop Horizontal View */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          {/* Connector Line behind steps */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-[#E2DFD6] -z-0">
            {/* Compute completed percentage */}
            {(() => {
              const completedCount = steps.filter((s) => s.status === "completed").length;
              const hasCurrent = steps.some((s) => s.status === "current");
              const totalSegments = steps.length - 1;
              const progress = Math.min(
                100,
                ((completedCount + (hasCurrent ? 0.5 : 0)) / totalSegments) * 100
              );
              return (
                <div
                  className="h-full bg-[#176B45] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              );
            })()}
          </div>

          {steps.map((step, idx) => {
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";

            return (
              <div key={step.step} className="relative z-10 flex flex-col items-center text-center max-w-[140px]">
                {/* Step Node */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-[#176B45] text-white shadow-sm"
                      : isCurrent
                      ? "bg-[#FAF9F5] border-2 border-[#176B45] text-[#176B45] ring-4 ring-[#176B45]/20 animate-pulse"
                      : "bg-[#EEEAE0] border border-[#D5CFBF] text-[#8C9388]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : isCurrent ? (
                    <Sparkles className="w-4 h-4 text-[#AA9160]" />
                  ) : (
                    <span className="text-xs font-mono font-medium">{idx + 1}</span>
                  )}
                </div>

                {/* Step Info */}
                <div className="mt-3 space-y-1">
                  <p
                    className={`text-xs font-serif ${
                      isCurrent
                        ? "text-[#176B45] font-bold"
                        : isCompleted
                        ? "text-[#252A25] font-semibold"
                        : "text-[#8C9388]"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-[#555E55] leading-tight line-clamp-2">
                    {step.description}
                  </p>
                  {(step.timestamp || step.estimatedDate) && (
                    <p
                      className={`text-[10px] font-mono mt-1 ${
                        isCurrent
                          ? "text-[#AA9160] font-semibold"
                          : isCompleted
                          ? "text-[#555E55]"
                          : "text-[#8C9388]"
                      }`}
                    >
                      {step.timestamp || `Est. ${step.estimatedDate}`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical View */}
      <div className="block md:hidden space-y-6 relative pl-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2DFD6]">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";

          return (
            <div key={step.step} className="relative flex items-start gap-4">
              {/* Bullet Node */}
              <div
                className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted
                    ? "bg-[#176B45] text-white"
                    : isCurrent
                    ? "bg-[#FAF9F5] border-2 border-[#176B45] text-[#176B45] ring-2 ring-[#176B45]/20 animate-pulse"
                    : "bg-[#EEEAE0] border border-[#D5CFBF] text-[#8C9388]"
                }`}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
              </div>

              {/* Step Content */}
              <div className="space-y-0.5 pl-2">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs font-serif ${
                      isCurrent
                        ? "text-[#176B45] font-bold"
                        : isCompleted
                        ? "text-[#252A25] font-semibold"
                        : "text-[#8C9388]"
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-[#176B45]/10 text-[#176B45] rounded font-medium">
                      Current Stage
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#555E55] leading-relaxed">
                  {step.description}
                </p>
                {(step.timestamp || step.estimatedDate) && (
                  <p className="text-[10px] font-mono text-[#8C9388]">
                    {step.timestamp ? `Completed: ${step.timestamp}` : `Expected: ${step.estimatedDate}`}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
