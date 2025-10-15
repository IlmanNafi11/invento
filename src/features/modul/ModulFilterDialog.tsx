import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ModulFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingFileType: string;
  pendingSemester: string;
  onFileTypeChange: (value: string) => void;
  onSemesterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  fileType: string;
  semester: string;
  fileTypeOptions: { value: string; label: string }[];
  semesterOptions: { value: string; label: string }[];
  isMobile?: boolean;
}

export function ModulFilterDialog({
  open,
  onOpenChange,
  pendingFileType,
  pendingSemester,
  onFileTypeChange,
  onSemesterChange,
  onApply,
  onReset,
  fileType,
  semester,
  fileTypeOptions,
  semesterOptions,
  isMobile = false,
}: ModulFilterDialogProps) {
  const activeFilterCount = [
    fileType !== 'all' ? fileType : null,
    semester !== 'all' ? semester : null,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Tipe File</Label>
        {isMobile ? (
          <Select value={pendingFileType} onValueChange={onFileTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih tipe file" />
            </SelectTrigger>
            <SelectContent>
              {fileTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {pendingFileType
                  ? fileTypeOptions.find(option => option.value === pendingFileType)?.label
                  : "Pilih tipe file"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Cari tipe file..." />
                <CommandList>
                  <CommandEmpty>Tidak ada tipe file ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {fileTypeOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          onFileTypeChange(option.value === pendingFileType ? '' : option.value);
                        }}
                      >
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="space-y-2">
        <Label>Semester</Label>
        <Select value={pendingSemester} onValueChange={onSemesterChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih semester" />
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
        <Button onClick={onApply} className="flex-1">
          Terapkan
        </Button>
        <Button variant="outline" onClick={onReset} className="flex-1">
          Reset
        </Button>
      </div>
    </div>
  );

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Filter className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <FilterContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
