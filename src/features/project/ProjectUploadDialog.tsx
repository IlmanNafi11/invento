import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FileInput } from '@/components/common/FileInput';
import { ProjectUploadProgress, type FileUploadState } from './ProjectUploadProgress';
import type { ProjectCategory } from '@/types';

interface ProjectForm {
  files: { file?: File; name: string; category?: ProjectCategory; semester?: number }[];
}

interface ProjectUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectForm) => Promise<void>;
  uploadStates: FileUploadState[];
  isUploading: boolean;
  categoryOptions: { value: ProjectCategory | ''; label: string }[];
}

export function ProjectUploadDialog({
  open,
  onOpenChange,
  onSubmit,
  uploadStates,
  isUploading,
  categoryOptions,
}: ProjectUploadDialogProps) {
  const form = useForm<ProjectForm>({
    defaultValues: {
      files: [{ file: undefined, name: '', category: undefined, semester: undefined }],
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    if (uploadStates.length === 0 || uploadStates.every(s => s.status === 'completed')) {
      form.reset();
    }
  });

  const handleClose = (open: boolean) => {
    if (!isUploading) {
      onOpenChange(open);
      if (!open) {
        form.reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FileInput
              label="File Project"
              accept=".zip"
              multiple={false}
              onChange={(files) => form.setValue('files', files as { file?: File; name: string; category?: ProjectCategory; semester?: number }[])}
              value={form.watch('files')}
              categoryOptions={categoryOptions.filter(c => c.value !== '')}
              showCategory
              showSemester
              editableName
              nameLabel="Nama Project"
              namePlaceholder="Masukkan nama project"
              fileLabel="File Project (ZIP)"
              layout="grid"
            />

            <ProjectUploadProgress uploadStates={uploadStates} />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isUploading}
              >
                {isUploading ? 'Tutup Setelah Selesai' : 'Batal'}
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
