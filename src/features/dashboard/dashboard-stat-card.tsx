"use client";

import Link from "next/link";

const TONE_COLORS = {
  default: undefined,
  danger: "#c02626",
  warning: "#b06017",
  success: "#1f7a3d",
} as const;

export function DashboardStatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  tone?: keyof typeof TONE_COLORS;
}) {
  const content = (
    <div className="card" style={{ padding: 20 }}>
      <div className="muted" style={{ fontSize: 12, fontWeight: 500 }}>
        {label}
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 27,
          lineHeight: 1.2,
          fontWeight: 600,
          letterSpacing: "-0.04em",
          color: TONE_COLORS[tone],
        }}
      >
        {value}
      </div>
      {hint && (
        <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          {hint}
        </div>
      )}
    </div>
  );

  return href ? (
    <Link className="dashboard-card-link" href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}
