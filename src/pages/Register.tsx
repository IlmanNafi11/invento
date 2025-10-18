import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRegisterOTP } from "@/hooks/useRegisterOTP";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { verifyRegisterOTP } from "@/lib/authSlice";
import { useAutoLogin } from "@/hooks/useAutoLogin";
import { WaveBackground } from "@/components/common/WaveBackground";
import { RegisterOTPDialog } from "@/components/common/RegisterOTPDialog";

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
type RegisterStep = 'idle' | 'otp' | 'success';

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, clearError: clearAuthError } = useAuth();
  const { handleAutoLogin } = useAutoLogin();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [registerStep, setRegisterStep] = useState<RegisterStep>('idle');
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerOtpExpiresIn, setRegisterOtpExpiresIn] = useState(600);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    initiateRegisterOTP,
    resendRegisterOTP,
    loading: registerOTPLoading,
  } = useRegisterOTP();

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

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, isRedirecting]);

  const onSubmit = async (data: RegisterForm) => {
    setFormError(null);
    const registerData = { name: data.name, email: data.email, password: data.password };
    
    const result = await initiateRegisterOTP(registerData);
    if (result.success) {
      setRegisterEmail(data.email);
      setRegisterOtpExpiresIn(result.expiresIn || 600);
      setRegisterStep('otp');
      setOtpDialogOpen(true);
    } else {
      setFormError(result.error || 'Gagal mengirim OTP');
    }
  };

  const handleInputChange = () => {
    if (formError) {
      setFormError(null);
    }
    clearAuthError();
  };

  const handleOTPSubmit = async (code: string) => {
    try {
      const response = await dispatch(verifyRegisterOTP({
        email: registerEmail,
        code,
      })).unwrap();

      await handleAutoLogin(response.data.access_token, {
        redirectTo: from,
      });

      setRegisterStep('success');
      setOtpDialogOpen(false);
      setRegisterStep('idle');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal verifikasi OTP';
      throw new Error(errorMessage);
    }
  };

  const handleOTPResend = async () => {
    const result = await resendRegisterOTP(registerEmail);
    if (!result.success) {
      throw new Error(result.error || 'Gagal mengirim ulang OTP');
    }
  };

  const handleCloseOTPDialog = () => {
    setRegisterStep('idle');
    setOtpDialogOpen(false);
    setRegisterEmail('');
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
            {formError && (
              <Alert variant="destructive" className="border-red-500/40 bg-red-500/15 text-red-200">
                <AlertDescription>{formError}</AlertDescription>
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
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...passwordField}
                    onChange={(event) => {
                      passwordField.onChange(event);
                      handleInputChange();
                    }}
                    className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={registerOTPLoading || isRedirecting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white disabled:opacity-50"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi password"
                    {...confirmPasswordField}
                    onChange={(event) => {
                      confirmPasswordField.onChange(event);
                      handleInputChange();
                    }}
                    className="border-white/10 bg-white/10 pr-10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    disabled={registerOTPLoading || isRedirecting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white disabled:opacity-50"
                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-300">{errors.confirmPassword.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-gray-900 hover:bg-white/90"
                disabled={registerOTPLoading || isRedirecting}
              >
                {registerOTPLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim OTP...
                  </>
                ) : isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang mengarahkan...
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

      <RegisterOTPDialog
        open={otpDialogOpen && registerStep === 'otp'}
        onOpenChange={(open) => {
          if (!open) handleCloseOTPDialog();
          else setOtpDialogOpen(true);
        }}
        onSubmit={handleOTPSubmit}
        onResend={handleOTPResend}
        loading={registerOTPLoading}
        initialExpiresIn={registerOtpExpiresIn}
        email={registerEmail}
      />
    </div>
  );
}
