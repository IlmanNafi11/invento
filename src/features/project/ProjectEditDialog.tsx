import { useEffect } from 'react';
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
import type { ProjectListItem, ProjectCategory } from '@/types';

interface ProjectForm {
  files: { file?: File; name: string; category?: ProjectCategory; semester?: number; existingFileSize?: string }[];
}

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectForm) => Promise<void>;
  editingItem: ProjectListItem | null;
  uploadStates: FileUploadState[];
  isLoading: boolean;
  categoryOptions: { value: ProjectCategory | ''; label: string }[];
}

export function ProjectEditDialog({
  open,
  onOpenChange,
  onSubmit,
  editingItem,
  uploadStates,
  isLoading,
  categoryOptions,
}: ProjectEditDialogProps) {
  const form = useForm<ProjectForm>({
    defaultValues: {
      files: [],
    },
  });

  useEffect(() => {
    if (editingItem && open) {
      form.setValue('files', [{
        file: new File([], editingItem.nama_project),
        name: editingItem.nama_project,
        category: editingItem.kategori as ProjectCategory,
        semester: editingItem.semester,
        existingFileSize: editingItem.ukuran,
      }]);
    }
  }, [editingItem, open, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const handleClose = (open: boolean) => {
    if (!isLoading) {
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
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FileInput
              label="File Project"
              accept=".zip"
              onChange={(files) => form.setValue('files', files as { file?: File; name: string; category?: ProjectCategory; semester?: number; existingFileSize?: string }[])}
              value={form.watch('files')}
              categoryOptions={categoryOptions.filter(c => c.value !== '')}
              showCategory
              showSemester
              editableName
              multiple={false}
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
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
