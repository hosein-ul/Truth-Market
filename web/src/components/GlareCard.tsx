"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface GlareCardProps {
  children: React.ReactNode;
  className?: string;
  glareColor?: string;
}

export function GlareCard({
  children,
  className,
  glareColor = "rgba(255,210,8,0.14)",
}: GlareCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springCfg = { damping: 12, stiffness: 180, mass: 0.6 };
  const sx = useSpring(mouseX, springCfg);
  const sy = useSpring(mouseY, springCfg);

  const rotateX = useTransform(sy, [0, 1], [4, -4]);
  const rotateY = useTransform(sx, [0, 1], [-4, 4]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function onMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  const glareGradient = useTransform(
    [sx, sy],
    ([x, y]) =>
      `radial-gradient(circle at ${(x as number) * 100}% ${(y as number) * 100}%, ${glareColor} 0%, transparent 60%)`
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 800,
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", damping: 12, stiffness: 200, mass: 0.6 }}
      className={cn("group relative", className)}
    >
      {children}
      {/* Glare overlay */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glareGradient }}
      />
    </motion.div>
  );
}

/** Simpler variant without 3D tilt — just scale + glow */
export function SpringCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", damping: 12, stiffness: 200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
