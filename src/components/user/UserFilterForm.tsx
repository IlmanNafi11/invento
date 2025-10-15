import type { UseFormReturn } from 'react-hook-form';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { RoleListItem } from '@/types';

interface FilterForm {
  role: string;
}

interface UserFilterFormProps {
  form: UseFormReturn<FilterForm>;
  roles: RoleListItem[];
  onApply: () => void;
  onReset: () => void;
}

export function UserFilterForm({ form, roles, onApply, onReset }: UserFilterFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={onApply} className="space-y-4">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <Label>Role</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value || "Pilih role"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Cari role..." />
                    <CommandList>
                      <CommandEmpty>Role tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {roles.map((role) => (
                          <CommandItem
                            key={role.id}
                            value={role.nama_role}
                            onSelect={() => {
                              form.setValue("role", role.nama_role);
                            }}
                          >
                            {role.nama_role}
                            <Check
                              className={cn(
                                "ml-auto",
                                role.nama_role === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Terapkan
          </Button>
          <Button type="button" variant="outline" onClick={onReset} className="flex-1">
            Reset
          </Button>
        </div>
      </form>
    </Form>
  );
}
