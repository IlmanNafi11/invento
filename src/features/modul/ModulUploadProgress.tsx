import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';

export interface FileUploadState {
  index: number;
  fileName: string;
  progress: number;
  status: 'waiting' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface ModulUploadProgressProps {
  uploadStates: FileUploadState[];
}

export function ModulUploadProgress({ uploadStates }: ModulUploadProgressProps) {
  if (uploadStates.length === 0) return null;

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Upload sedang berlangsung. Jangan tutup dialog ini sampai upload selesai.
        </AlertDescription>
      </Alert>
      <div className="space-y-3">
        {uploadStates.map((state) => (
          <div key={state.index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium truncate flex-1">{state.fileName}</span>
              <span className="text-muted-foreground ml-2">
                {state.status === 'waiting' && 'Menunggu...'}
                {state.status === 'uploading' && `${state.progress}%`}
                {state.status === 'completed' && 'Selesai'}
                {state.status === 'error' && 'Gagal'}
              </span>
            </div>
            <Progress value={state.progress} />
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
