import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (email: string) => Promise<void>;
  loading?: boolean;
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Email diperlukan');
      return;
    }

    try {
      await onSubmit(email);
      setEmail('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-white/5 text-white backdrop-blur-lg sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Lupa Password?</DialogTitle>
          <DialogDescription className="text-white/70">
            Masukkan email Anda untuk menerima kode verifikasi OTP
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-500/40 bg-red-500/15 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="reset-email" className="text-sm font-medium text-white">
              Email
            </Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="anda@polije.ac.id"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/40 disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || !email}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                'Kirim OTP'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
