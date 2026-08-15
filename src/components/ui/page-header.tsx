import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 20,
        marginBottom: 24,
      }}
    >
      <div>
        <h1>{title}</h1>
        {description && (
          <p className="muted" style={{ marginBottom: 0, lineHeight: 1.55 }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
