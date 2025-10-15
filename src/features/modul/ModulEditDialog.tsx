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
import { ModulUploadProgress, type FileUploadState } from './ModulUploadProgress';
import type { ModulListItem } from '@/types';

interface ModulForm {
  files: { file?: File; name: string; semester?: number; existingFileSize?: string }[];
}

interface ModulEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ModulForm) => Promise<void>;
  editingItem: ModulListItem | null;
  uploadStates: FileUploadState[];
  isLoading: boolean;
}

export function ModulEditDialog({
  open,
  onOpenChange,
  onSubmit,
  editingItem,
  uploadStates,
  isLoading,
}: ModulEditDialogProps) {
  const form = useForm<ModulForm>({
    defaultValues: {
      files: [],
    },
  });

  useEffect(() => {
    if (editingItem && open) {
      form.setValue('files', [{
        file: new File([], editingItem.nama_file),
        name: editingItem.nama_file,
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
          <DialogTitle>Edit Modul</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FileInput
              label="File Modul"
              accept=".docx,.xlsx,.pdf,.pptx"
              onChange={(files) => form.setValue('files', files)}
              value={form.watch('files')}
              showCategory={false}
              showSemester
              editableName
              multiple={false}
            />

            <ModulUploadProgress uploadStates={uploadStates} />

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
