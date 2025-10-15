import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import type { UseFormReturn } from 'react-hook-form';
import type { ResourcePermissions } from '@/types';

interface RoleFormData {
  nama_role: string;
  permissions: Record<string, string[]>;
}

interface PermissionCardProps {
  resource: ResourcePermissions;
  form: UseFormReturn<RoleFormData>;
}

export function PermissionCard({ resource, form }: PermissionCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">{resource.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {resource.permissions.map((perm) => (
          <FormField
            key={perm.action}
            control={form.control}
            name={`permissions.${resource.name}`}
            render={({ field }) => {
              const currentValues = field.value || [];
              const isChecked = currentValues.includes(perm.action);

              return (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const newValues = checked
                          ? [...currentValues, perm.action]
                          : currentValues.filter((v: string) => v !== perm.action);
                        field.onChange(newValues);
                      }}
                    />
                  </FormControl>
                  <Label className="text-sm font-normal">
                    {perm.label}
                  </Label>
                </FormItem>
              );
            }}
          />
        ))}
      </CardContent>
    </Card>
  );
}
