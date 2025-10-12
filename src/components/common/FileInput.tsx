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
  multiple?: boolean;
  layout?: 'card' | 'grid';
  onChange?: (files: { file?: File; name: string; category?: string; semester?: number; existingFileSize?: string }[]) => void;
  value?: { file?: File; name: string; category?: string; semester?: number; existingFileSize?: string }[];
  categoryOptions?: { value: string; label: string }[];
  editableName?: boolean;
  showCategory?: boolean;
  showSemester?: boolean;
  namePlaceholder?: string;
  nameLabel?: string;
  addButtonLabel?: string;
  fileLabel?: string;
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ id, label = 'Pilih file', accept, multiple = true, layout = 'card', onChange, value = [], categoryOptions, editableName = true, showCategory = true, showSemester = true, namePlaceholder = 'Nama file', nameLabel = 'Nama Project', addButtonLabel = 'Tambah Project Lain', fileLabel = 'File Project' }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    const handleClick = (e?: React.MouseEvent | number) => {
      if (typeof e === 'number') setUploadingIndex(e);
      inputRef.current?.click();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (uploadingIndex !== null && uploadingIndex < value.length) {
        const selectedFile = selectedFiles[0];
        if (selectedFile) {
          const newValue = [...value];
          newValue[uploadingIndex] = { ...newValue[uploadingIndex], file: selectedFile };
          onChange?.(newValue);
        }
      } else {
        let newFiles = selectedFiles.map(file => ({ file, name: '', category: '' }));
        if (!multiple && value.length > 0) {
          const existing = value[0];
          newFiles = newFiles.map(file => ({
            ...file,
            name: existing.name,
            category: existing.category || '',
            semester: existing.semester,
          }));
        }
        onChange?.(multiple ? [...value, ...newFiles] : newFiles);
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleDrop = (e: React.DragEvent, index?: number) => {
      e.preventDefault();
      setIsDragOver(false);
      const selectedFiles = Array.from(e.dataTransfer.files);
      if (index !== undefined && index < value.length) {
        const selectedFile = selectedFiles[0];
        if (selectedFile) {
          const newValue = [...value];
          newValue[index] = { ...newValue[index], file: selectedFile };
          onChange?.(newValue);
        }
      } else {
        let newFiles = selectedFiles.map(file => ({ file, name: '', category: '' }));
        if (!multiple && value.length > 0) {
          const existing = value[0];
          newFiles = newFiles.map(file => ({
            ...file,
            name: existing.name,
            category: existing.category || '',
            semester: existing.semester,
          }));
        }
        onChange?.(multiple ? [...value, ...newFiles] : newFiles);
      }
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

    const updateName = (name: string) => {
      if (value.length > 0) {
        onChange?.([{ ...value[0], name }]);
      }
    };
  
    const updateCategory = (category: string) => {
      if (value.length > 0) {
        onChange?.([{ ...value[0], category }]);
      }
    };
  
    const updateSemester = (semester: number) => {
      if (value.length > 0) {
        onChange?.([{ ...value[0], semester }]);
      }
    };
  
    return (
      <div className="space-y-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        {layout === 'grid' ? (
          <div className="space-y-6 max-w-2xl">
            {value.map((item, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                {multiple && value.length > 1 && (
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Project {index + 1}</h4>
                    {value.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
                {editableName && (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{nameLabel}</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => multiple ? updateFileName(index, e.target.value) : updateName(e.target.value)}
                      placeholder={namePlaceholder}
                      className="w-full"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {showCategory && categoryOptions && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Kategori</Label>
                      <Select
                        value={item.category || ''}
                        onValueChange={(value) => multiple ? updateFileCategory(index, value) : updateCategory(value)}
                      >
                        <SelectTrigger className="w-full">
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
                    </div>
                  )}
                  {showSemester && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Semester</Label>
                      <Select
                        value={item.semester ? item.semester.toString() : undefined}
                        onValueChange={(value) => multiple ? updateFileSemester(index, parseInt(value)) : updateSemester(parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
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
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium" htmlFor="">{fileLabel}</Label>
                  <Card
                    className={`border-2 border-dashed transition-colors cursor-pointer ${
                      isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                    }`}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => handleClick(index)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        {item.file && (item.file.size > 0 || item.existingFileSize) ? (
                          <>
                            <File className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm truncate" title={item.file.name}>{item.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.existingFileSize || `${(item.file.size / 1024 / 1024).toFixed(2)} MB`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Klik atau seret file baru untuk mengganti
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">
                              Klik untuk upload file
                            </p>
                          </>
                        )}
                      </div>
                      <Input
                        ref={ref || inputRef}
                        type="file"
                        accept={accept}
                        multiple={multiple}
                        onChange={handleChange}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            {multiple && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onChange?.([...value, { file: undefined, name: '', category: '', semester: undefined }])}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {addButtonLabel}
              </Button>
            )}
          </div>
        ) : (
          <>
            {value.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {value.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center gap-3">
                      <File className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        {editableName && (
                          <div>
                            <Label className="text-xs">{nameLabel}</Label>
                            <Input
                              value={item.name}
                              onChange={(e) => updateFileName(index, e.target.value)}
                              className="text-sm h-8"
                              placeholder={namePlaceholder}
                            />
                          </div>
                        )}
                        {showCategory && categoryOptions && (
                          <div>
                            <Label className="text-xs">Kategori</Label>
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
                          </div>
                        )}
                        {showSemester && (
                          <div>
                            <Label className="text-xs">Semester</Label>
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
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.existingFileSize || (item.file ? `${(item.file.size / 1024 / 1024).toFixed(2)} MB` : '')}
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
                  multiple={multiple}
                  onChange={handleChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';

export { FileInput };