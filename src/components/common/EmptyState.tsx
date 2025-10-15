import { FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang tersedia saat ini.",
  icon = <FolderOpen className="h-20 w-20 text-muted-foreground/60" />
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="mb-8 p-6 rounded-full bg-muted/30">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
        {description}
      </p>
    </div>
  );
}