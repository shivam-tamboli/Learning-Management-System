import { LucideIcon, FileX, Users, BookOpen, FolderOpen, Search, Inbox } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} className="mt-4">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export const EmptyStudents = (props: Omit<EmptyStateProps, "icon" | "title">) => (
  <EmptyState icon={Users} title="No students yet" description="Start by adding your first student to the system" {...props} />
);

export const EmptyCourses = (props: Omit<EmptyStateProps, "icon" | "title">) => (
  <EmptyState icon={BookOpen} title="No courses available" description="Create courses to start enrolling students" {...props} />
);

export const EmptyRegistrations = (props: Omit<EmptyStateProps, "icon" | "title">) => (
  <EmptyState icon={FolderOpen} title="No registrations found" description="New registrations will appear here" {...props} />
);

export const EmptySearch = (props: Omit<EmptyStateProps, "icon" | "title">) => (
  <EmptyState icon={Search} title="No results found" description="Try adjusting your search or filters" {...props} />
);

export const EmptyDocuments = (props: Omit<EmptyStateProps, "icon" | "title">) => (
  <EmptyState icon={FileX} title="No documents uploaded" description="Documents will be available after upload" {...props} />
);
