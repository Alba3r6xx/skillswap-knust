"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { checkCircleVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SuccessCheckmarkProps {
  show: boolean;
  size?: number;
  className?: string;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  "oklch(0.769 0.188 70)",   // Gold
  "oklch(0.68 0.104 232)",   // Sky
  "oklch(0.22 0.072 247)",   // Navy
  "oklch(0.62 0.200 145)",   // Green
  "oklch(0.65 0.190 30)",    // Coral
];

// Pre-computed confetti pieces — deterministic to avoid impure Math.random() in render
const CONFETTI_PIECES = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * 360;
  const distance = 28 + ((i * 137 + 42) % 240) / 10; // deterministic 0–24 offset
  const size = 4 + ((i * 91 + 13) % 40) / 10;        // deterministic 0–4 offset
  const rad = (angle * Math.PI) / 180;
  return {
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size,
    angle,
  };
});

function ConfettiBurst({ count = 16 }: { count?: number }) {
  const shouldReduceMotion = useReducedMotion();
  const pieces = CONFETTI_PIECES.slice(0, count);

  if (shouldReduceMotion) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            top: "50%",
            left: "50%",
            marginTop: -p.size / 2,
            marginLeft: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            rotate: 180 + p.angle,
          }}
          transition={{
            duration: 0.5,
            delay: i * 0.015,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </div>
  );
}

export function SuccessCheckmark({
  show,
  size = 56,
  className,
  onComplete,
}: SuccessCheckmarkProps) {
  const shouldReduceMotion = useReducedMotion();
  const doneRef = useRef(false);

  useEffect(() => {
    if (show && !doneRef.current && onComplete) {
      doneRef.current = true;
      const t = setTimeout(onComplete, shouldReduceMotion ? 50 : 600);
      return () => clearTimeout(t);
    }
  }, [show, onComplete, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={cn("relative inline-flex items-center justify-center", className)}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.01 }
              : { type: "spring", stiffness: 400, damping: 25 }
          }
          style={{ width: size, height: size }}
        >
          <ConfettiBurst />
          <svg
            width={size}
            height={size}
            viewBox="0 0 56 56"
            fill="none"
            aria-label="Success"
          >
            <motion.circle
              cx="28"
              cy="28"
              r="26"
              fill="oklch(0.97 0.010 145)"
              stroke="oklch(0.55 0.180 145)"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.01 }
                  : { duration: 0.3, ease: "easeOut" }
              }
            />
            <motion.path
              d="M16 28 L24 36 L40 20"
              stroke="oklch(0.40 0.200 145)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              variants={checkCircleVariants}
              initial="hidden"
              animate="visible"
            />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
