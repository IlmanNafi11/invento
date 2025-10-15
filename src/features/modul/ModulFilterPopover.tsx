import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModulFilterPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingFileType: string;
  pendingSemester: string;
  onFileTypeChange: (value: string) => void;
  onSemesterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  fileTypeOptions: { value: string; label: string }[];
  semesterOptions: { value: string; label: string }[];
}

export function ModulFilterPopover({
  open,
  onOpenChange,
  pendingFileType,
  pendingSemester,
  onFileTypeChange,
  onSemesterChange,
  onApply,
  onReset,
  fileTypeOptions,
  semesterOptions,
}: ModulFilterPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Filter</h4>
          <div className="space-y-2">
            <Label htmlFor="filter-type">Tipe File</Label>
            <Select value={pendingFileType} onValueChange={onFileTypeChange}>
              <SelectTrigger id="filter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fileTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-semester">Semester</Label>
            <Select value={pendingSemester} onValueChange={onSemesterChange}>
              <SelectTrigger id="filter-semester">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {semesterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onReset} className="flex-1">
              Reset
            </Button>
            <Button type="button" onClick={onApply} className="flex-1">
              Terapkan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
