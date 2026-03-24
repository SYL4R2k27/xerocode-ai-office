import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";

interface ImageViewerProps {
  src: string | null;
  onClose: () => void;
}

export function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
  }, [src]);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!src) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.9)",
          backdropFilter: "blur(8px)",
        }}
        onClick={onClose}
      >
        {/* Controls */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(z + 0.5, 3));
            }}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
            }}
            title="Увеличить"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(z - 0.5, 0.5));
            }}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
            }}
            title="Уменьшить"
          >
            <ZoomOut size={18} />
          </button>
          <a
            href={src}
            download
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
            }}
            title="Скачать"
          >
            <Download size={18} />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              color: "#fff",
            }}
            title="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        <motion.img
          src={src}
          alt="Preview"
          initial={{ scale: 0.8 }}
          animate={{ scale: zoom }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </motion.div>
    </AnimatePresence>
  );
}
