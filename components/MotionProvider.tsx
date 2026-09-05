"use client";
import { MotionConfig } from "framer-motion";

// One place that honors the OS reduced-motion setting for every Framer
// animation in the app (matches the CSS @media rule for @keyframes). Kids on
// cheap tablets and users with vestibular sensitivities get calmer motion
// without every component having to opt in.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
