import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { FileInput } from '@/components/common/FileInput';
import type { ProjectListItem, ProjectCategory } from '@/types';
import { validateProjectFile } from '@/utils/fileValidation';

interface ProjectForm {
  files: { file?: File; name: string; category?: ProjectCategory; semester?: number; existingFileSize?: string }[];
}

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectForm) => Promise<void>;
  editingItem: ProjectListItem | null;
  isLoading: boolean;
  categoryOptions: { value: ProjectCategory | ''; label: string }[];
}

export function ProjectEditDialog({
  open,
  onOpenChange,
  onSubmit,
  editingItem,
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
    const errors: string[] = [];
    const fileData = data.files[0];
    
    if (!fileData) {
      toast.error('Data project tidak valid');
      return;
    }
    
    if (!fileData.name || fileData.name.trim() === '') {
      errors.push('Nama project tidak boleh kosong');
    }
    
    if (!fileData.category) {
      errors.push('Kategori harus dipilih');
    }
    
    if (!fileData.semester) {
      errors.push('Semester harus dipilih');
    }
    
    if (fileData.file && fileData.file.size > 0) {
      const validation = validateProjectFile(fileData.file);
      if (!validation.valid) {
        errors.push(validation.error || 'File tidak valid');
      }
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }
    
    await onSubmit(data);
  });

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}

              >
                Batal
              </Button>
              <Button type="submit" >

                Simpan
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
