import { cn } from "@/lib/utils";

type SkeletonProps = React.ComponentProps<"div">;

export function Skeleton({ className, style, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton", className)}
      style={style}
      {...props}
    />
  );
}

const COLUMN_WIDTHS = ["72%", "88%", "64%", "56%", "80%", "48%"];

type TableSkeletonProps = {
  columns: number;
  rows?: number;
  hasActionColumn?: boolean;
};

export function TableSkeleton({
  columns,
  rows = 8,
  hasActionColumn = false,
}: TableSkeletonProps) {
  const totalColumns = columns + (hasActionColumn ? 1 : 0);

  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: totalColumns }, (_, columnIndex) => (
            <td key={columnIndex} style={{ padding: "14px 16px" }}>
              <Skeleton
                style={{
                  height: 14,
                  width:
                    columnIndex === totalColumns - 1 && hasActionColumn
                      ? 64
                      : COLUMN_WIDTHS[(rowIndex + columnIndex) % COLUMN_WIDTHS.length],
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

type MetricCardsSkeletonProps = {
  count?: number;
};

export function MetricCardsSkeleton({ count = 6 }: MetricCardsSkeletonProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
        gap: 14,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="card" key={index} style={{ padding: 20 }}>
          <Skeleton style={{ height: 12, width: "70%" }} />
          <Skeleton style={{ height: 28, width: "45%", marginTop: 12 }} />
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div style={{ flex: 1 }}>
          <Skeleton style={{ height: 30, width: 220, marginBottom: 10 }} />
          <Skeleton style={{ height: 14, width: 320 }} />
        </div>
        <Skeleton style={{ height: 38, width: 96, borderRadius: "var(--radius-md)" }} />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 16,
        }}
      >
        {Array.from({ length: 3 }, (_, index) => (
          <div className="card" key={index} style={{ padding: 20 }}>
            <Skeleton style={{ height: 16, width: 120, marginBottom: 16 }} />
            <Skeleton style={{ height: 14, width: "88%", marginBottom: 10 }} />
            <Skeleton style={{ height: 14, width: "72%", marginBottom: 10 }} />
            <Skeleton style={{ height: 14, width: "60%" }} />
          </div>
        ))}
      </div>
    </>
  );
}

type FormFieldsSkeletonProps = {
  fields?: number;
};

export function FormFieldsSkeleton({ fields = 4 }: FormFieldsSkeletonProps) {
  return (
    <div
      className="card"
      style={{
        padding: 20,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
        gap: 14,
      }}
    >
      {Array.from({ length: fields }, (_, index) => (
        <div key={index}>
          <Skeleton style={{ height: 12, width: 96, marginBottom: 8 }} />
          <Skeleton style={{ height: 42, width: "100%", borderRadius: "var(--radius-md)" }} />
        </div>
      ))}
      <div style={{ alignSelf: "end" }}>
        <Skeleton style={{ height: 42, width: 160, borderRadius: "var(--radius-md)" }} />
      </div>
    </div>
  );
}

export function ComboboxOptionsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} style={{ padding: "10px 12px" }}>
          <Skeleton style={{ height: 14, width: index === 0 ? "78%" : "62%" }} />
        </div>
      ))}
    </>
  );
}
