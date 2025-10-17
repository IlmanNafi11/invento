'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch';
import { removeUpload, clearCompletedUploads } from '@/lib/uploadSlice';

export function UploadProgressIndicator() {
  const dispatch = useAppDispatch();
  const uploads = useAppSelector((state) => state.upload.uploads);
  const [isExpanded, setIsExpanded] = useState(false);

  const uploadList = useMemo(() => Object.values(uploads), [uploads]);

  const activeUploads = useMemo(
    () =>
      uploadList.filter(
        (upload) => upload.status === 'uploading' || upload.status === 'waiting'
      ),
    [uploadList]
  );

  const completedCount = useMemo(
    () => uploadList.filter((upload) => upload.status === 'completed').length,
    [uploadList]
  );

  const errorCount = useMemo(
    () => uploadList.filter((upload) => upload.status === 'error').length,
    [uploadList]
  );

  if (uploadList.length === 0) return null;

  const allActive = activeUploads.length > 0;
  const totalProgress =
    uploadList.length > 0
      ? Math.round(
          (uploadList.reduce((sum, upload) => sum + upload.progress, 0) /
            uploadList.length) *
            100
        ) / 100
      : 0;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-w-[calc(100%-2rem)] z-50">
      {isExpanded ? (
        <div className="bg-background border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="bg-muted/50 border-b border-border p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Upload Progress</h3>
              <p className="text-xs text-muted-foreground">
                {activeUploads.length} uploading
                {completedCount > 0 && `, ${completedCount} completed`}
                {errorCount > 0 && `, ${errorCount} error`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {uploadList.map((upload) => (
              <div
                key={upload.id}
                className={cn(
                  'border-b border-border p-3 space-y-2 hover:bg-muted/30 transition-colors',
                  'last:border-b-0'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {upload.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {upload.status === 'waiting' && 'Menunggu...'}
                      {upload.status === 'uploading' && `${upload.progress}%`}
                      {upload.status === 'completed' && 'Selesai'}
                      {upload.status === 'error' && 'Gagal'}
                      {upload.status === 'cancelled' && 'Dibatalkan'}
                    </p>
                  </div>
                  {(upload.status === 'completed' ||
                    upload.status === 'error' ||
                    upload.status === 'cancelled') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch(removeUpload({ id: upload.id }))}
                      className="h-6 w-6 p-0 hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Progress
                  value={upload.progress}
                  className={cn(
                    upload.status === 'error' &&
                      '[&>div]:bg-destructive'
                  )}
                />
                {upload.error && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
              </div>
            ))}
          </div>

          <div className="bg-muted/30 border-t border-border p-3 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearCompletedUploads())}
              className="text-xs flex-1"
              disabled={completedCount === 0}
            >
              Bersihkan Selesai
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'bg-background border border-border rounded-lg shadow-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors',
            allActive && 'border-blue-500'
          )}
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Upload</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={totalProgress} className="flex-1 h-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {totalProgress.toFixed(0)}%
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
