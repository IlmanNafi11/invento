import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { register as registerThunk, clearError } from "@/lib/authSlice";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { WaveBackground } from "@/components/common/WaveBackground";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const nameField = register("name");
  const emailField = register("email");
  const passwordField = register("password");
  const confirmPasswordField = register("confirmPassword");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      const registerData = { name: data.name, email: data.email, password: data.password };
      await dispatch(registerThunk(registerData)).unwrap();
      navigate("/dashboard", { replace: true });
    } catch {
      // Error is handled by the slice
    }
  };

  const handleInputChange = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#060509] px-6 py-12">
      <WaveBackground />
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full border-white/10 bg-white/5 text-white shadow-[0_30px_90px_rgba(148,77,255,0.18)] backdrop-blur-lg supports-[backdrop-filter]:backdrop-blur-lg">
          <CardHeader className="space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
              Invento
            </div>
            <CardTitle className="text-3xl font-semibold text-white">Buat akun Invento</CardTitle>
            <CardDescription className="text-sm text-white/70">
              Daftar untuk mengelola file project anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-500/40 bg-red-500/15 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-white">
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  placeholder="Nama lengkap Anda"
                  {...nameField}
                  onChange={(event) => {
                    nameField.onChange(event);
                    handleInputChange();
                  }}
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40"
                />
                {errors.name && <p className="text-sm text-red-300">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="anda@polije.ac.id"
                  {...emailField}
                  onChange={(event) => {
                    emailField.onChange(event);
                    handleInputChange();
                  }}
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40"
                />
                {errors.email && <p className="text-sm text-red-300">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...passwordField}
                  onChange={(event) => {
                    passwordField.onChange(event);
                    handleInputChange();
                  }}
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40"
                />
                {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                  Konfirmasi Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  {...confirmPasswordField}
                  onChange={(event) => {
                    confirmPasswordField.onChange(event);
                    handleInputChange();
                  }}
                  className="border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40"
                />
                {errors.confirmPassword && <p className="text-sm text-red-300">{errors.confirmPassword.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-gray-900 hover:bg-white/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  "Daftar"
                )}
              </Button>
            </form>
            <div className="text-center text-sm text-white/70">
              Sudah memiliki akun?{" "}
              <Link to="/login" className="font-medium text-white hover:text-white/80">
                Masuk sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
