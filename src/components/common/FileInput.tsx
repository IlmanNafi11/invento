import { forwardRef, useRef, useState } from 'react';
import { File, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FileInputProps {
  id?: string;
  label?: string;
  accept?: string;
  onChange?: (files: { file: File; name: string; category?: string; semester?: number; existingFileSize?: string }[]) => void;
  value?: { file: File; name: string; category?: string; semester?: number; existingFileSize?: string }[];
  categoryOptions?: { value: string; label: string }[];
  editableName?: boolean;
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ id, label = 'Pilih file', accept, onChange, value = [], categoryOptions, editableName = true }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const newFiles = selectedFiles.map(file => ({ file, name: '', category: '', semester: undefined }));
      onChange?.([...value, ...newFiles]);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const selectedFiles = Array.from(e.dataTransfer.files);
      const newFiles = selectedFiles.map(file => ({ file, name: '', category: '', semester: undefined }));
      onChange?.([...value, ...newFiles]);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = () => {
      setIsDragOver(false);
    };

    const removeFile = (index: number) => {
      const newFiles = value.filter((_, i) => i !== index);
      onChange?.(newFiles);
    };

    const updateFileName = (index: number, name: string) => {
      const newFiles = value.map((item, i) =>
        i === index ? { ...item, name } : item
      );
      onChange?.(newFiles);
    };

    const updateFileCategory = (index: number, category: string) => {
      const newFiles = value.map((item, i) =>
        i === index ? { ...item, category } : item
      );
      onChange?.(newFiles);
    };

    const updateFileSemester = (index: number, semester: number) => {
      const newFiles = value.map((item, i) =>
        i === index ? { ...item, semester } : item
      );
      onChange?.(newFiles);
    };

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        {value.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {value.map((item, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1">
                    {editableName ? (
                      <Input
                        value={item.name}
                        onChange={(e) => updateFileName(index, e.target.value)}
                        className="text-sm h-8"
                        placeholder="Nama project"
                      />
                    ) : (
                      <p className="text-sm font-medium truncate">{item.name}</p>
                    )}
                    {categoryOptions && (
                      <Select
                        value={item.category || ''}
                        onValueChange={(value) => updateFileCategory(index, value)}
                      >
                        <SelectTrigger className="w-full h-8">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryOptions.filter(option => option.value !== '').map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select
                      value={item.semester ? item.semester.toString() : undefined}
                      onValueChange={(value) => updateFileSemester(index, parseInt(value))}
                    >
                      <SelectTrigger className="w-full h-8">
                        <SelectValue placeholder="Pilih semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 8 }, (_, i) => i + 1).map((semester) => (
                          <SelectItem key={semester} value={semester.toString()}>
                            Semester {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {item.existingFileSize || `${(item.file.size / 1024 / 1024).toFixed(2)} MB`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        <Card
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Seret dan jatuhkan atau klik untuk memilih
                </p>
              </div>
            </div>
            <Input
              ref={ref || inputRef}
              id={id}
              type="file"
              accept={accept}
              multiple
              onChange={handleChange}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';

export { FileInput };