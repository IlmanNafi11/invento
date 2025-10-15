import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type GradientStop = {
  offset: string;
  color: string;
  opacity?: number;
};

type WaveLayer = {
  id: string;
  path: string;
  gradientStops: GradientStop[];
  baseOpacity: number;
  opacityRange: number[];
  duration: number;
  translateX: number[];
  translateY: number[];
  scale: number[];
  rotate: number[];
  blendMode?: CSSProperties["mixBlendMode"];
};

const waveLayers: WaveLayer[] = [
  {
    id: "back",
    path: "M-160 320C140 240 520 340 860 290C1200 240 1520 340 1800 280L1800 600L-160 600Z",
    gradientStops: [
      { offset: "0%", color: "#1E3A8A" },
      { offset: "28%", color: "#5B21B6" },
      { offset: "58%", color: "#C026D3" },
      { offset: "82%", color: "#EA580C" },
      { offset: "100%", color: "#BE123C" },
    ],
    baseOpacity: 0.42,
    opacityRange: [0.42, 0.05, 0.42],
    duration: 34,
    translateX: [-48, 18, -48],
    translateY: [28, 0, 28],
    scale: [1.05, 1.01, 1.05],
    rotate: [-1.4, 0.6, -1.4],
    blendMode: "screen",
  },
  {
    id: "mid",
    path: "M-120 340C160 260 520 360 860 310C1200 260 1520 360 1800 300L1800 600L-120 600Z",
    gradientStops: [
      { offset: "0%", color: "#1D4ED8" },
      { offset: "32%", color: "#6D28D9" },
      { offset: "58%", color: "#D946EF" },
      { offset: "82%", color: "#FB7185" },
      { offset: "100%", color: "#F97316" },
    ],
    baseOpacity: 0.5,
    opacityRange: [0.5, 0.08, 0.5],
    duration: 27,
    translateX: [-32, 12, -32],
    translateY: [20, -6, 20],
    scale: [1.04, 1, 1.04],
    rotate: [-1, 0.4, -1],
    blendMode: "screen",
  },
  {
    id: "front",
    path: "M-100 360C180 300 520 380 860 340C1200 300 1520 380 1800 340L1800 600L-100 600Z",
    gradientStops: [
      { offset: "0%", color: "#2563EB" },
      { offset: "30%", color: "#7C3AED" },
      { offset: "55%", color: "#C026D3" },
      { offset: "82%", color: "#F97316" },
      { offset: "100%", color: "#FB7185" },
    ],
    baseOpacity: 0.62,
    opacityRange: [0.62, 0.12, 0.62],
    duration: 22,
    translateX: [-20, 6, -20],
    translateY: [12, -12, 12],
    scale: [1.02, 0.99, 1.02],
    rotate: [-0.8, 0.4, -0.8],
    blendMode: "screen",
  },
];

type WaveBackgroundProps = {
  className?: string;
};

export function WaveBackground({ className }: WaveBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-[#050308]", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0715] via-[#070417] to-[#050308]" />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={shouldReduceMotion ? { opacity: 0.4 } : { opacity: 0.35 }}
        animate={shouldReduceMotion ? { opacity: 0.4 } : { opacity: [0.35, 0.52, 0.35] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
        }
        style={{
          background:
            "radial-gradient(70% 80% at 20% 25%, rgba(37, 99, 235, 0.28), transparent 70%), radial-gradient(60% 90% at 80% 75%, rgba(249, 115, 22, 0.24), transparent 70%), radial-gradient(120% 140% at 50% 60%, rgba(16, 16, 44, 0.48), rgba(5, 3, 8, 0.92))",
        }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[180%] -translate-x-1/2 -translate-y-1/2"
        initial={{ opacity: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: [1, 0.35, 1], rotate: [0.4, -0.6, 0.4], scale: [1.02, 1.04, 1.02] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.8, ease: "easeOut" }
            : { duration: 28, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
        }
      >
        <svg className="h-full w-full" viewBox="0 0 1440 600" preserveAspectRatio="none">
          <defs>
            {waveLayers.map((layer) => (
              <linearGradient
                key={`${layer.id}-gradient`}
                id={`${layer.id}-gradient`}
                gradientUnits="userSpaceOnUse"
                x1="-160"
                y1="320"
                x2="1800"
                y2="320"
              >
                {layer.gradientStops.map((stop) => (
                  <stop
                    key={`${layer.id}-${stop.offset}`}
                    offset={stop.offset}
                    stopColor={stop.color}
                    stopOpacity={stop.opacity ?? 1}
                  />
                ))}
              </linearGradient>
            ))}
            <linearGradient id="wave-fade" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="black" stopOpacity="0" />
              <stop offset="24%" stopColor="white" stopOpacity="0.9" />
              <stop offset="76%" stopColor="white" stopOpacity="0.9" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </linearGradient>
            <mask id="wave-mask">
              <rect width="1440" height="600" fill="url(#wave-fade)" />
            </mask>
          </defs>

          <g mask="url(#wave-mask)">
            {waveLayers.map((layer) => (
              <motion.path
                key={layer.id}
                d={layer.path}
                fill={`url(#${layer.id}-gradient)`}
                initial={{ opacity: layer.baseOpacity }}
                animate={
                  shouldReduceMotion
                    ? { x: 0, y: 0, scale: 1, rotate: 0, opacity: layer.baseOpacity }
                    : {
                        x: layer.translateX,
                        y: layer.translateY,
                        scale: layer.scale,
                        rotate: layer.rotate,
                        opacity: layer.opacityRange,
                      }
                }
                transition={
                  shouldReduceMotion
                    ? undefined
                    : {
                        duration: layer.duration,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                      }
                }
                style={{
                  mixBlendMode: layer.blendMode ?? "normal",
                  transformOrigin: "50% 55%",
                  transformBox: "fill-box",
                }}
              />
            ))}
          </g>
        </svg>
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-t from-[#050308] via-transparent to-transparent" aria-hidden />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={shouldReduceMotion ? { opacity: 0.2 } : { opacity: 0.16 }}
        animate={shouldReduceMotion ? { opacity: 0.2 } : { opacity: [0.16, 0.28, 0.16] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 5 }
        }
        style={{
          background:
            "radial-gradient(90% 120% at 50% 65%, rgba(4, 4, 18, 0.55), rgba(5, 3, 8, 0.92)), radial-gradient(30% 50% at 10% 10%, rgba(59, 130, 246, 0.22), transparent), radial-gradient(40% 60% at 90% 85%, rgba(249, 115, 22, 0.22), transparent)",
        }}
      />
    </div>
  );
}
