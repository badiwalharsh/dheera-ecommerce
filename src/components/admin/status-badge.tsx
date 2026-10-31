import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "md", className = "" }: StatusBadgeProps) {
  const s = status.toLowerCase();

  let styles = "bg-[#FAF9F5] text-[#74786F] border-[#E2DFD6]";

  if (
    s === "delivered" ||
    s === "captured" ||
    s === "in_stock" ||
    s === "active" ||
    s === "approved" ||
    s === "completed" ||
    s === "published"
  ) {
    styles = "bg-[#EAF5EF] text-[#176B45] border-[#176B45]/20";
  } else if (
    s === "dispatched" ||
    s === "processing" ||
    s === "in_production" ||
    s === "quotation_prepared" ||
    s === "under_review"
  ) {
    styles = "bg-[#F7F4EB] text-[#AA9160] border-[#AA9160]/30";
  } else if (
    s === "pending" ||
    s === "pending_payment" ||
    s === "low_stock" ||
    s === "awaiting_clarification" ||
    s === "awaiting_customer_approval" ||
    s === "new_enquiry"
  ) {
    styles = "bg-[#FFF9E6] text-[#B8860B] border-[#B8860B]/20";
  } else if (
    s === "cancelled" ||
    s === "refunded" ||
    s === "failed" ||
    s === "out_of_stock" ||
    s === "declined" ||
    s === "inactive" ||
    s === "archived"
  ) {
    styles = "bg-[#FDF2F2] text-[#991B1B] border-[#991B1B]/20";
  }

  const formatText = (text: string) => {
    return text
      .replace(/_/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const sizeClasses =
    size === "sm"
      ? "text-[9px] px-2 py-0.5 tracking-wider"
      : "text-[10px] px-2.5 py-1 tracking-luxury";

  return (
    <span
      className={`inline-flex items-center justify-center font-medium uppercase rounded-full border ${sizeClasses} ${styles} ${className}`}
    >
      {formatText(status)}
    </span>
  );
}

