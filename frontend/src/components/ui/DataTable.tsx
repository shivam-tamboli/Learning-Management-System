import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./Table";
import { cn } from "@/lib/utils";
import { FileQuestion } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  emptyMessage = "No data found",
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center"
              >
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <FileQuestion className="h-8 w-8" />
                  <p>{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={item._id || item.id || index}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.render
                      ? column.render(item)
                      : item[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
