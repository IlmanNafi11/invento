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

interface ModulForm {
  files: { file?: File; name: string; semester?: number }[];
}

interface ModulUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ModulForm) => Promise<void>;
  isUploading: boolean;
}

export function ModulUploadDialog({
  open,
  onOpenChange,
  onSubmit,
  isUploading,
}: ModulUploadDialogProps) {
  const form = useForm<ModulForm>({
    defaultValues: {
      files: [{ file: undefined, name: '', semester: undefined }],
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
    if (!isUploading) {
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
          <DialogTitle>Upload Modul</DialogTitle>
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
              nameLabel="Nama Modul"
              namePlaceholder="Masukkan nama modul"
              fileLabel="File Modul"
              addButtonLabel="Tambah Modul Lain"
              layout="grid"
            />

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
