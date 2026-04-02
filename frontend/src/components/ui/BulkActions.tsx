import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Check, X, Trash2 } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  onClear: () => void;
  loading?: boolean;
  className?: string;
}

export function BulkActions({
  selectedCount,
  onApprove,
  onReject,
  onDelete,
  onClear,
  loading = false,
  className,
}: BulkActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-lg animate-in slide-in-from-bottom",
      className
    )}>
      <span className="text-sm font-medium text-foreground">
        {selectedCount} selected
      </span>
      
      <div className="h-4 w-px bg-border mx-2" />
      
      <Button
        size="sm"
        variant="outline"
        onClick={onApprove}
        disabled={loading}
        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
      >
        <Check className="h-4 w-4 mr-1" />
        Approve
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={onReject}
        disabled={loading}
        className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
      >
        <X className="h-4 w-4 mr-1" />
        Reject
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={onDelete}
        disabled={loading}
        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>
      
      <div className="h-4 w-px bg-border mx-2" />
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        disabled={loading}
      >
        Clear
      </Button>
    </div>
  );
}