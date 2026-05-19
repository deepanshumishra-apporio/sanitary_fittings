type Variant = "default" | "success" | "warning" | "error" | "outline";

const variantCls: Record<Variant, string> = {
  default: "bg-zinc-900 text-white",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  error: "bg-red-50 text-red-700 border border-red-200",
  outline: "border border-zinc-300 text-zinc-600",
};

const ORDER_STATUS_VARIANT: Record<string, Variant> = {
  PENDING: "warning",
  CONFIRMED: "outline",
  PROCESSING: "outline",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "error",
  REFUNDED: "error",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={ORDER_STATUS_VARIANT[status] ?? "outline"}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

export default function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${variantCls[variant]}`}
    >
      {children}
    </span>
  );
}
