import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export interface FileUploadState {
  index: number;
  fileName: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface ProjectUploadProgressProps {
  uploadStates: FileUploadState[];
}

export function ProjectUploadProgress({ uploadStates }: ProjectUploadProgressProps) {
  if (uploadStates.length === 0) return null;

  return (
    <div className="space-y-3">
      {uploadStates.map((state) => (
        <div key={state.index} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate max-w-[200px]">{state.fileName}</span>
              <span className="text-xs text-muted-foreground">
                {state.status === 'waiting' && 'Menunggu...'}
                {state.status === 'uploading' && `${state.progress}%`}
                {state.status === 'completed' && 'Selesai'}
                {state.status === 'error' && 'Error'}
              </span>
              {state.status === 'completed' && (
                <Badge variant="default" className="h-5">✓</Badge>
              )}
              {state.status === 'error' && (
                <Badge variant="destructive" className="h-5">✗</Badge>
              )}
            </div>
          </div>
          <Progress value={state.progress} />
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
