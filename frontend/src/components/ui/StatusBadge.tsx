import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "approved" | "rejected" | "active" | "inactive" | string;
  reApproved?: boolean;
  className?: string;
}

export function StatusBadge({ status, reApproved, className }: StatusBadgeProps) {
  const statusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    inactive: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
    draft: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };

  const style = statusStyles[status.toLowerCase()] || "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
          style,
          className
        )}
      >
        {status}
      </span>
      {status === "approved" && reApproved && (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
            className
          )}
        >
          Re-approved
        </span>
      )}
    </span>
  );
}
