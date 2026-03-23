import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-primary border-t-transparent",
          sizes[size]
        )}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function LoadingPage({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-lg">
      <LoadingSpinner size="md" text={text} />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-6">
      <div className="h-4 w-20 rounded bg-muted mb-4" />
      <div className="h-8 w-32 rounded bg-muted mb-2" />
      <div className="h-4 w-40 rounded bg-muted" />
    </div>
  );
}
