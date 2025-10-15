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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { PermissionCard } from './PermissionCard';
import type { ResourcePermissions, Role } from '@/types';

interface RoleFormData {
  nama_role: string;
  permissions: Record<string, string[]>;
}

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RoleFormData) => Promise<void>;
  permissions: ResourcePermissions[];
  loading: boolean;
  title: string;
  submitLabel: string;
  currentRole?: Role | null;
}

export function RoleFormDialog({
  open,
  onOpenChange,
  onSubmit,
  permissions,
  loading,
  title,
  submitLabel,
  currentRole,
}: RoleFormDialogProps) {
  const form = useForm<RoleFormData>({
    defaultValues: {
      nama_role: '',
      permissions: {},
    },
  });

  useEffect(() => {
    if (currentRole && open) {
      form.setValue('nama_role', currentRole.nama_role);
      const permissionsObj: Record<string, string[]> = {};
      currentRole.permissions.forEach(perm => {
        permissionsObj[perm.resource] = perm.actions;
      });
      form.setValue('permissions', permissionsObj);
    } else if (!open) {
      form.reset();
    }
  }, [currentRole, open, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="nama_role"
              render={({ field }) => (
                <FormItem>
                  <Label>Nama Role</Label>
                  <FormControl>
                    <Input placeholder="Masukkan nama role" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissions.map((resource) => (
                <PermissionCard key={resource.name} resource={resource} form={form} />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {submitLabel}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
