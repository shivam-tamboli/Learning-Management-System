import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "active" | "inactive" | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    active: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    inactive: "bg-gray-100 text-gray-800",
  };

  const style = statusStyles[status.toLowerCase()] || "bg-gray-100 text-gray-800";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
