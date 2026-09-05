"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// One dialog primitive for every modal in the app — replaces four hand-rolled
// overlays that were missing role/aria-modal, focus trap, Esc, backdrop close,
// and body-scroll lock. Uses a keyboard trap rather than <dialog>.showModal()
// because Framer's exit animation needs the node to stay mounted.

export function Modal({
  onClose,
  labelledBy,
  children,
  paddedFooter = false,
}: {
  onClose: () => void;
  labelledBy: string;         // id of the heading element inside `children`
  children: React.ReactNode;
  paddedFooter?: boolean;     // true when the modal has its own bottom CTA (adds safe-area padding)
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    // Body scroll lock (works around iOS Safari's dynamic toolbar mid-scroll).
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the modal so keyboard users don't have to tab through
    // the page behind it. Prefer the first focusable element that isn't the
    // close button (the close button being auto-focused reads as "escape hatch").
    const focusables = getFocusables(cardRef.current);
    (focusables[1] ?? focusables[0] ?? cardRef.current)?.focus?.();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const list = getFocusables(cardRef.current);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      returnFocus.current?.focus?.();
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-2"
        onMouseDown={(e) => {
          // Backdrop click closes — but only when the mousedown started on the
          // backdrop itself (prevents text selection drags inside the modal
          // from closing on mouseup outside).
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className={`w-full max-w-md bg-white rounded-3xl shadow-2xl outline-none max-h-[92dvh] overflow-y-auto ${
            paddedFooter ? "pb-[env(safe-area-inset-bottom,0px)]" : ""
          }`}
          tabIndex={-1}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusables(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("data-focus-skip") && el.offsetParent !== null
  );
}
