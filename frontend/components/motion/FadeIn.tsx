"use client";
import { motion, useReducedMotion } from "framer-motion";
import { PropsWithChildren } from "react";

export default function FadeIn({
  children,
  delay = 0,
}: PropsWithChildren<{ delay?: number }>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
      whileInView={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 120,
              damping: 18,
              delay,
            }
      }
    >
      {children}
    </motion.div>
  );
}