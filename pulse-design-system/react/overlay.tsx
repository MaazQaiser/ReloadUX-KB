"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "./icons";

/**
 * Click-to-zoom image: renders `children` (the thumbnail) as a zoom-in
 * button; opens the full image over an 85% black, 4px-blurred backdrop.
 * Esc or a click on the backdrop closes it.
 */
export function ImageLightbox({ src, alt, children }: { src: string; alt: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`View full-size: ${alt}`}
        style={{ display: "block", width: "100%", textAlign: "left", cursor: "zoom-in" }}
      >
        {children}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="pulse-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="rx-lightbox"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="rx-lightbox__inner"
            >
              <img src={src} alt={alt} style={{ width: "100%", height: "auto", borderRadius: 16 }} />
            </motion.div>
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rx-lightbox__close">
              <X className="rx-icon rx-icon--lg" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
