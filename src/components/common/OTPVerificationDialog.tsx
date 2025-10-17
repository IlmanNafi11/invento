import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface OTPVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  loading?: boolean;
  initialExpiresIn?: number;
  email?: string;
}

export function OTPVerificationDialog({
  open,
  onOpenChange,
  onSubmit,
  onResend,
  loading = false,
  initialExpiresIn = 600,
  email,
}: OTPVerificationDialogProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(initialExpiresIn);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  const resendCooldownDuration = parseInt(import.meta.env.VITE_OTP_RESEND_COOLDOWN || '60', 10);
  const maxResendAttempts = parseInt(import.meta.env.VITE_OTP_MAX_RESEND_ATTEMPTS || '5', 10);

  useEffect(() => {
    if (!open) {
      setCode('');
      setError(null);
      setTimeLeft(initialExpiresIn);
      setIsResending(false);
      setResendCooldown(0);
      setResendCount(0);
      return;
    }

    setTimeLeft(initialExpiresIn);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, initialExpiresIn]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code) {
      setError('Kode OTP diperlukan');
      return;
    }

    if (code.length !== 6) {
      setError('Kode OTP harus 6 digit');
      return;
    }

    try {
      await onSubmit(code);
      setCode('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan verifikasi';
      setError(errorMessage);
    }
  };

  const handleResend = async () => {
    setError(null);
    if (resendCount >= maxResendAttempts) {
      setError(`Batas pengiriman ulang tercapai (${maxResendAttempts} kali)`);
      return;
    }
    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);
    try {
      await onResend();
      setCode('');
      
      // Increment resend count and start cooldown
      setResendCount((prev) => prev + 1);
      setResendCooldown(resendCooldownDuration);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengirim ulang OTP';
      setError(errorMessage);
      if (errorMessage.includes('429') || errorMessage.includes('terlalu')) {
        setResendCooldown(resendCooldownDuration);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    onOpenChange(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeft === 0;
  const canResend = resendCooldown === 0 && !isResending && !loading && resendCount < maxResendAttempts;
  const isMaxResendReached = resendCount >= maxResendAttempts;

  const resendLabel = (() => {
    if (isMaxResendReached) {
      return `Batas pengiriman (${resendCount}/${maxResendAttempts})`;
    }

    if (resendCooldown > 0) {
      return `Kirim ulang kode (${formatTime(resendCooldown)})`;
    }

    return `Kirim ulang kode${resendCount > 0 ? ` (${resendCount}/${maxResendAttempts})` : ''}`;
  })();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-white/5 text-white backdrop-blur-lg sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Verifikasi OTP</DialogTitle>
          <DialogDescription className="text-white/70">
            Kami telah mengirimkan kode 6-digit ke {email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-500/40 bg-red-500/15 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp-code" className="text-sm font-medium text-white">
              Kode OTP
            </Label>
            <Input
              id="otp-code"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError(null);
              }}
              disabled={loading || isExpired}
              className="border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40 disabled:opacity-50"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/50">
                Kode berlaku selama {formatTime(timeLeft)}
              </p>
              {isExpired && (
                <p className="text-xs text-red-300">Kode sudah expired</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || isResending}
              className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !code || code.length !== 6 || isExpired}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifikasi...
                </>
              ) : (
                'Verifikasi'
              )}
            </Button>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend}
              className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                canResend
                  ? 'text-white/70 hover:text-white'
                  : 'cursor-not-allowed text-white/40'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {isResending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isResending ? 'Mengirim ulang...' : resendLabel}</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
