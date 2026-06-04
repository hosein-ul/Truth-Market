"use client";

import { motion } from "framer-motion";

export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Large blue orb — top left */}
      <motion.div
        animate={{ y: [0, -18, 0], x: [0, 8, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Cyan orb — top right */}
      <motion.div
        animate={{ y: [0, 22, 0], x: [0, -12, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute -right-16 top-0 h-72 w-72 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, rgba(34,211,238,0.04) 50%, transparent 70%)",
          filter: "blur(36px)",
        }}
      />

      {/* Small gold glint — center */}
      <motion.div
        animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="absolute left-[42%] top-[30%] h-32 w-32 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 60%)",
          filter: "blur(20px)",
        }}
      />

      {/* Bottom blue wash */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-40 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(29,78,216,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Glassy floating crystal — decorative */}
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute right-[8%] top-[20%] hidden h-20 w-20 lg:block"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(34,211,238,0.1) 100%)",
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
          border: "1px solid rgba(59,130,246,0.2)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 8px 32px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      />

      {/* Jelly blob — left */}
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute left-[6%] top-[55%] hidden h-14 w-14 lg:block"
        style={{
          background: "linear-gradient(135deg, rgba(34,211,238,0.25) 0%, rgba(59,130,246,0.15) 100%)",
          borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%",
          border: "1px solid rgba(34,211,238,0.2)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 4px 20px rgba(34,211,238,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      />
    </div>
  );
}
