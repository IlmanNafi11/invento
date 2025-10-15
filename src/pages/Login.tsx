import { Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { WaveBackground } from "@/components/common/WaveBackground";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const location = useLocation();
  const { login: loginUser, loading, error, isAuthenticated, clearError } = useAuth();
  const { loading: permissionsLoading } = usePermissions();
  const [loginSuccess, setLoginSuccess] = useState(false);

  const isRedirecting = isAuthenticated && loginSuccess && permissionsLoading;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const emailField = register("email");
  const passwordField = register("password");

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated && loginSuccess && !permissionsLoading) {
      window.location.href = from;
    }
  }, [isAuthenticated, loginSuccess, permissionsLoading, from]);

  const onSubmit = async (data: LoginForm) => {
    const result = await loginUser(data);
    if (result.success) {
      setLoginSuccess(true);
    }
  };

  const handleInputChange = () => {
    if (error) {
      clearError();
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
            <CardTitle className="text-3xl font-semibold text-white">Welcome back!</CardTitle>
            <CardDescription className="text-sm text-white/70">
              masukan akun anda untuk masuk ke Invento
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
              <Button
                type="submit"
                className="w-full bg-white text-gray-900 hover:bg-white/90"
                disabled={loading || isRedirecting}
              >
                {loading || isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRedirecting ? "Memuat hak akses..." : "Sedang masuk..."}
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
            <div className="text-center text-sm text-white/70">
              Belum memiliki akun?{" "}
              <Link to="/register" className="font-medium text-white hover:text-white/80">
                Daftar sekarang
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
