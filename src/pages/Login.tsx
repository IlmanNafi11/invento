import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useForgotPassword } from "@/hooks/useForgotPassword";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { confirmResetPasswordOTP } from "@/lib/authSlice";
import { fetchProfile } from "@/lib/profileSlice";
import { fetchPermissions } from "@/lib/permissionSlice";
import { WaveBackground } from "@/components/common/WaveBackground";
import { ForgotPasswordDialog } from "@/components/common/ForgotPasswordDialog";
import { OTPVerificationDialog } from "@/components/common/OTPVerificationDialog";
import { PasswordResetDialog } from "@/components/common/PasswordResetDialog";
import { LoadingOverlay } from "@/components/common/LoadingOverlay";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

type ResetPasswordStep = 'idle' | 'email' | 'otp' | 'password' | 'success';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { login: loginUser, loading, error, isAuthenticated, clearError } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const emailField = register("email");
  const passwordField = register("password");

  const [forgotPasswordStep, setForgotPasswordStep] = useState<ResetPasswordStep>('idle');
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtpExpiresIn, setResetOtpExpiresIn] = useState(600);

  const { 
    state: forgotPasswordState,
    initiateOTP, 
    verifyOTP, 
    resendOTP,
    loading: forgotPasswordLoading 
  } = useForgotPassword();

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated && !isRedirecting) {
      setIsRedirecting(true);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, isRedirecting]);

  const onSubmit = async (data: LoginForm) => {
    const result = await loginUser(data);
    if (!result.success) {
      setIsRedirecting(false);
    }
  };

  const handleInputChange = () => {
    if (error) {
      clearError();
    }
  };

  const handleForgotPasswordClick = () => {
    setForgotPasswordStep('email');
    setForgotPasswordDialogOpen(true);
  };

  const handleForgotPasswordSubmit = async (email: string) => {
    const result = await initiateOTP(email);
    if (result.success) {
      setResetEmail(email);
      setResetOtpExpiresIn(result.expiresIn || 600);
      setForgotPasswordStep('otp');
      setForgotPasswordDialogOpen(false);
      setOtpDialogOpen(true);
    } else {
      throw new Error(result.error || 'Gagal mengirim OTP');
    }
  };

  const handleOTPSubmit = async (code: string) => {
    const result = await verifyOTP(resetEmail, code);
    if (result.success) {
      setForgotPasswordStep('password');
      setOtpDialogOpen(false);
      setPasswordResetDialogOpen(true);
    } else {
      throw new Error(result.error || 'OTP verifikasi gagal');
    }
  };

  const handleOTPResend = async () => {
    const result = await resendOTP(resetEmail);
    if (!result.success) {
      throw new Error(result.error || 'Gagal mengirim ulang OTP');
    }
  };

  const handlePasswordResetSubmit = async (newPassword: string) => {
    try {
      await dispatch(confirmResetPasswordOTP({
        email: resetEmail,
        code: forgotPasswordState.otpCode,
        new_password: newPassword,
      })).unwrap();
      
      await Promise.all([
        dispatch(fetchProfile()),
        dispatch(fetchPermissions())
      ]);
      
      setForgotPasswordStep('success');
      setPasswordResetDialogOpen(false);
      setForgotPasswordStep('idle');
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mereset password';
      throw new Error(errorMessage);
    }
  };

  const handleCloseForgotPasswordFlow = () => {
    setForgotPasswordStep('idle');
    setForgotPasswordDialogOpen(false);
    setOtpDialogOpen(false);
    setPasswordResetDialogOpen(false);
    setResetEmail('');
  };

  const loadingOverlayContent = useMemo(() => {
    if (isRedirecting) {
      return {
        primary: "Mengalihkan Anda ke Invento",
        secondary: "Mempersiapkan dashboard dan preferensi Anda",
      };
    }
    if (loading) {
      return {
        primary: "Sedang memverifikasi kredensial",
        secondary: "Mengamankan akses dan menyiapkan sesi Anda",
      };
    }
    return {
      primary: "Menyiapkan Invento",
      secondary: "Mohon tunggu sebentar...",
    };
  }, [isRedirecting, loading]);

  const shouldShowOverlay = loading || isRedirecting;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#060509] px-6 py-12">
      <LoadingOverlay
        show={shouldShowOverlay}
        message={loadingOverlayContent.primary}
        subMessage={loadingOverlayContent.secondary}
      />
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </Label>
                  <span
                    onClick={!(loading || isRedirecting) ? handleForgotPasswordClick : undefined}
                    className={`cursor-pointer text-sm text-white/70 hover:text-white ${loading || isRedirecting ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    Lupa password?
                  </span>
                </div>
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
                    disabled={loading || isRedirecting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 transition hover:text-white disabled:opacity-50"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-gray-900 hover:bg-white/90"
                disabled={loading || isRedirecting}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang masuk...
                  </>
                ) : isRedirecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang mengarahkan...
                  </>
                ) : (
                  "Masuk"
                )}
              </Button>
            </form>
            <div className="flex flex-col gap-3 text-center text-sm text-white/70">
              <div>
                Belum memiliki akun?{" "}
                <Link to="/register" className="font-medium text-white hover:text-white/80">
                  Daftar sekarang
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ForgotPasswordDialog
        open={forgotPasswordDialogOpen && forgotPasswordStep === 'email'}
        onOpenChange={(open) => {
          if (!open) handleCloseForgotPasswordFlow();
          else setForgotPasswordDialogOpen(true);
        }}
        onSubmit={handleForgotPasswordSubmit}
        loading={forgotPasswordLoading}
      />

      <OTPVerificationDialog
        open={otpDialogOpen && forgotPasswordStep === 'otp'}
        onOpenChange={(open) => {
          if (!open) handleCloseForgotPasswordFlow();
          else setOtpDialogOpen(true);
        }}
        onSubmit={handleOTPSubmit}
        onResend={handleOTPResend}
        loading={forgotPasswordLoading}
        initialExpiresIn={resetOtpExpiresIn}
        email={resetEmail}
      />

      <PasswordResetDialog
        open={passwordResetDialogOpen && forgotPasswordStep === 'password'}
        onOpenChange={(open) => {
          if (!open) handleCloseForgotPasswordFlow();
          else setPasswordResetDialogOpen(true);
        }}
        onSubmit={handlePasswordResetSubmit}
        loading={forgotPasswordLoading}
      />
    </div>
  );
}
