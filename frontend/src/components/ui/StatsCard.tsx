import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: "default" | "warning" | "success" | "danger";
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  variant = "default",
  className,
}: StatsCardProps) {
  const variantStyles = {
    default: "text-primary",
    warning: "text-amber-600",
    success: "text-emerald-600",
    danger: "text-red-600",
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm",
        className
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={cn("mt-2 text-3xl font-bold", variantStyles[variant])}>
        {value}
      </p>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
