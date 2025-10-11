"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getInitials } from "@/utils/format";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { updateProfile } from "@/lib/profileSlice";
import { toast } from "sonner";
import type { Profile } from "@/types";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  jenis_kelamin: z.enum(["Laki-laki", "Perempuan"]).optional(),
  foto_profil: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 2 * 1024 * 1024,
      "Ukuran file maksimal 2MB"
    )
    .refine(
      (file) =>
        !file ||
        ["image/png", "image/jpeg", "image/jpg"].includes(file.type),
      "Format file harus PNG, JPEG, atau JPG"
    ),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;

interface UpdateProfileDialogProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UpdateProfileDialog({
  profile,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: UpdateProfileDialogProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.profile);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const form = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: profile?.name || "",
      jenis_kelamin: profile?.jenis_kelamin as "Laki-laki" | "Perempuan" | undefined,
    },
  });

  useEffect(() => {
    form.reset({
      name: profile?.name || "",
      jenis_kelamin: profile?.jenis_kelamin as "Laki-laki" | "Perempuan" | undefined,
    });
  }, [profile, form]);

  const watchedFile = form.watch("foto_profil");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("foto_profil", file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    form.setValue("foto_profil", undefined);
    setPreviewImage(null);
    const input = document.getElementById("foto_profil") as HTMLInputElement;
    if (input) input.value = "";
  };

  const onSubmit = async (values: UpdateProfileForm) => {
    try {
      await dispatch(updateProfile(values)).unwrap();
      toast.success("Profil berhasil diperbarui");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error as string);
    }
  };

  const handleCancel = () => {
    form.reset();
    setPreviewImage(null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] min-h-[400px] p-2 flex flex-col">
        <VisuallyHidden.Root>
          <DialogTitle>Perbarui Profil</DialogTitle>
        </VisuallyHidden.Root>
        <div className="relative flex-1 min-h-0">
          <Card className="h-24 bg-[url('/images/bg-profil.webp')] bg-cover bg-center rounded-xl border-0 mb-4 flex-shrink-0" />

          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
            <Avatar className="w-20 h-20 border-4 border-white">
              <AvatarImage
                src={previewImage || (profile?.foto_profil ? `${import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '')}${profile.foto_profil.startsWith('/') ? profile.foto_profil : `/${profile.foto_profil}`}` : undefined)}
                alt={profile?.name || "User"}
              />
              <AvatarFallback className="text-lg">
                {profile?.name ? getInitials(profile.name) : "U"}
              </AvatarFallback>
            </Avatar>
          </div>


          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-16">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4 w-full">
              <FormField
                control={form.control}
                name="foto_profil"
                render={() => (
                  <FormItem className="w-full">
                    <FormLabel>Foto Profil</FormLabel>
                    <FormControl>
                      <div className="space-y-2 w-full">
                        {watchedFile && (
                          <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/50 w-full overflow-hidden">
                            <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
                              <AvatarImage src={previewImage || undefined} />
                              <AvatarFallback>
                                <Upload className="w-4 h-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="text-sm font-medium break-all pr-2" title={watchedFile.name}>
                                {watchedFile.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {(watchedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              className="h-8 w-8 p-0 flex-shrink-0 mt-0.5"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <Card className="border-2 border-dashed w-full">
                          <CardContent className="p-4 w-full">
                            <label htmlFor="foto_profil" className="cursor-pointer block w-full">
                              <div className="text-center w-full">
                                <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                                <p className="text-xs font-medium break-words">
                                  {watchedFile ? "Ganti foto" : "Upload foto"}
                                </p>
                                <p className="text-xs text-muted-foreground break-words">
                                  PNG, JPG, JPEG (max 2MB)
                                </p>
                              </div>
                            </label>
                            <Input
                              id="foto_profil"
                              type="file"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </CardContent>
                        </Card>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} className="w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jenis_kelamin"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Jenis Kelamin</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper" className="max-h-32 w-full">
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Perbarui"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}