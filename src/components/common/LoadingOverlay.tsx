import { Fragment } from "react";
import { AnimatePresence, motion, easeInOut } from "framer-motion";
import { cn } from "@/lib/utils";

type LoadingOverlayProps = {
  show: boolean;
  message?: string;
  subMessage?: string;
  fullscreen?: boolean;
  className?: string;
};

const shimmerTransition = {
  duration: 8,
  ease: easeInOut,
  repeat: Infinity,
  repeatType: "mirror" as const,
};

export function LoadingOverlay({
  show,
  message,
  subMessage,
  fullscreen = true,
  className,
}: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <Fragment>
          <motion.div
            key="loading-overlay"
            className={cn(
              "pointer-events-auto z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl",
              fullscreen ? "fixed inset-0" : "absolute inset-0 rounded-3xl border border-white/10",
              className,
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <motion.div
              className="relative flex w-full max-w-xs flex-col items-center gap-6 px-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div
                className="relative flex h-40 w-40 items-center justify-center"
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: easeInOut }}
              >
                <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-[#7a5cff] via-[#9c4dff] to-[#ff3f8e] opacity-80 blur-3xl" />
                <motion.div
                  className="absolute inset-[6px] rounded-[30px] border border-white/20 bg-slate-950/50"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={shimmerTransition}
                />

                <motion.div
                  className="relative flex size-full items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                >
                  <motion.div
                    className="absolute size-[86%] rounded-[28px] border border-white/25"
                    animate={{ rotate: [-8, 8, -8] }}
                    transition={{ duration: 10, repeat: Infinity, ease: easeInOut }}
                  />

                  <motion.div
                    className="absolute size-[65%] rounded-full border border-white/40 bg-white/5 backdrop-blur-sm"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: easeInOut }}
                  />

                  <motion.span
                    className="absolute -top-2 h-3 w-3 rounded-full bg-[#ff3f8e] shadow-[0_0_24px_rgba(255,63,142,0.75)]"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />

                  <motion.div
                    className="relative size-14 rounded-full bg-gradient-to-br from-white via-[#d9d4ff] to-[#ffd4f0] shadow-[0_12px_35px_rgba(156,77,255,0.35)]"
                    animate={{ scale: [1, 0.92, 1], rotate: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: easeInOut }}
                  />
                </motion.div>
              </motion.div>

              <motion.div
                className="text-center text-white"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <p className="text-lg font-semibold tracking-tight">
                  {message ?? "Mempersiapkan pengalaman Anda"}
                </p>
                {subMessage ? (
                  <p className="mt-2 text-sm text-white/70">{subMessage}</p>
                ) : (
                  <p className="mt-2 text-sm text-white/70">Mohon tunggu sebentar...</p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}
