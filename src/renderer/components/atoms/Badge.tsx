import React from "react";

interface BadgeProps {
  label: string;
  variant?: "update" | "current" | "unknown";
}

export function Badge({
  label,
  variant = "unknown",
}: BadgeProps): React.JSX.Element {
  return <span className={`badge badge--${variant}`}>{label}</span>;
}
