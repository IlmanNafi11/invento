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
import type { ProjectCategory } from '@/types';

interface ProjectFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingCategory: ProjectCategory | '';
  pendingSemester: string;
  onCategoryChange: (value: ProjectCategory | '') => void;
  onSemesterChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  category: ProjectCategory | '';
  semester: string;
  categoryOptions: { value: ProjectCategory | ''; label: string }[];
  semesterOptions: { value: string; label: string }[];
  isMobile?: boolean;
}

export function ProjectFilterDialog({
  open,
  onOpenChange,
  pendingCategory,
  pendingSemester,
  onCategoryChange,
  onSemesterChange,
  onApply,
  onReset,
  category,
  semester,
  categoryOptions,
  semesterOptions,
  isMobile = false,
}: ProjectFilterDialogProps) {
  const activeFilterCount = [
    category !== '' ? category : null,
    semester !== '' ? semester : null,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Kategori</Label>
        {isMobile ? (
          <Select value={pendingCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions
                .filter((option) => option.value !== '')
                .map((option) => (
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
                {pendingCategory
                  ? categoryOptions.find(option => option.value === pendingCategory)?.label
                  : "Pilih kategori"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Cari kategori..." />
                <CommandList>
                  <CommandEmpty>Tidak ada kategori ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {categoryOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          onCategoryChange(option.value === pendingCategory ? '' : option.value);
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
            {semesterOptions
              .filter((option) => option.value !== '')
              .map((option) => (
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
