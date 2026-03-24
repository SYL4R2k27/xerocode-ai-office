import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Upload, RotateCcw, Sparkles, Palette, Image } from "lucide-react";

// ====== Types ======

type BackgroundCategory = "animated" | "gradient" | "custom";

interface BackgroundOption {
  id: string;
  label: string;
  category: BackgroundCategory;
  preview: string; // CSS for preview thumbnail
  value: string;   // stored in localStorage
}

// ====== Background Options ======

const animatedBackgrounds: BackgroundOption[] = [
  {
    id: "particles",
    label: "Частицы",
    category: "animated",
    preview: "radial-gradient(circle at 30% 40%, rgba(94,158,214,0.3) 1px, transparent 1px), radial-gradient(circle at 70% 60%, rgba(90,191,173,0.3) 1px, transparent 1px), radial-gradient(circle at 50% 20%, rgba(155,142,196,0.2) 1px, transparent 1px), linear-gradient(135deg, #0a1628, #1a2744)",
    value: "particles",
  },
  {
    id: "waves",
    label: "Волны",
    category: "animated",
    preview: "linear-gradient(180deg, #0a1628 0%, #0f2040 40%, #1a3060 60%, #0f2040 80%, #0a1628 100%)",
    value: "waves",
  },
  {
    id: "gradient-shift",
    label: "Градиент",
    category: "animated",
    preview: "linear-gradient(135deg, #1a0a38, #0a1a3a, #0a2a2a)",
    value: "gradient-shift",
  },
  {
    id: "matrix",
    label: "Матрица",
    category: "animated",
    preview: "linear-gradient(180deg, #001a00, #003300, #001a00)",
    value: "matrix",
  },
  {
    id: "aurora",
    label: "Северное сияние",
    category: "animated",
    preview: "linear-gradient(180deg, #0a0a2e 0%, #1a0a3a 30%, #0a2a1a 60%, #0a0a2e 100%)",
    value: "aurora",
  },
];

const gradientBackgrounds: BackgroundOption[] = [
  {
    id: "dark-blue",
    label: "Тёмный синий",
    category: "gradient",
    preview: "linear-gradient(135deg, #0a1628, #1a2744)",
    value: "linear-gradient(135deg, #0a1628, #1a2744)",
  },
  {
    id: "dark-purple",
    label: "Тёмный фиолетовый",
    category: "gradient",
    preview: "linear-gradient(135deg, #1a0a28, #2a1444)",
    value: "linear-gradient(135deg, #1a0a28, #2a1444)",
  },
  {
    id: "dark-green",
    label: "Тёмный зелёный",
    category: "gradient",
    preview: "linear-gradient(135deg, #0a1a14, #142a20)",
    value: "linear-gradient(135deg, #0a1a14, #142a20)",
  },
  {
    id: "coal",
    label: "Угольный",
    category: "gradient",
    preview: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
    value: "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
  },
  {
    id: "midnight",
    label: "Полночь",
    category: "gradient",
    preview: "linear-gradient(135deg, #0d1117, #161b22)",
    value: "linear-gradient(135deg, #0d1117, #161b22)",
  },
  {
    id: "sunset",
    label: "Закат",
    category: "gradient",
    preview: "linear-gradient(135deg, #1a1020, #2a1428, #1a2040)",
    value: "linear-gradient(135deg, #1a1020, #2a1428, #1a2040)",
  },
];

// ====== Helper: dispatch bg change event ======

export function dispatchBgChange(value: string) {
  localStorage.setItem("ai-office-bg", value);
  window.dispatchEvent(new CustomEvent("ai-office-bg-change", { detail: value }));
}

// ====== BackgroundPicker Component ======

interface BackgroundPickerProps {
  open: boolean;
  onClose: () => void;
}

export function BackgroundPicker({ open, onClose }: BackgroundPickerProps) {
  const [activeCategory, setActiveCategory] = useState<BackgroundCategory>("animated");
  const [selected, setSelected] = useState<string>(() => localStorage.getItem("ai-office-bg") || "default");
  const [previewBg, setPreviewBg] = useState<string | null>(null);
  const [customImage, setCustomImage] = useState<string | null>(() => {
    const stored = localStorage.getItem("ai-office-bg");
    return stored?.startsWith("data:image") ? stored : null;
  });
  const [customOpacity, setCustomOpacity] = useState<number>(() => {
    return parseFloat(localStorage.getItem("ai-office-bg-opacity") || "0.2");
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: { id: BackgroundCategory; label: string; icon: React.ElementType }[] = [
    { id: "animated", label: "Анимированные", icon: Sparkles },
    { id: "gradient", label: "Градиенты", icon: Palette },
    { id: "custom", label: "Свой фон", icon: Image },
  ];

  const currentOptions = activeCategory === "animated" ? animatedBackgrounds : activeCategory === "gradient" ? gradientBackgrounds : [];

  const handleSelect = useCallback((value: string) => {
    setPreviewBg(value);
    // Live preview
    dispatchBgChange(value);
  }, []);

  const handleApply = useCallback(() => {
    const value = previewBg || selected;
    setSelected(value);
    dispatchBgChange(value);
    if (value.startsWith("data:image")) {
      localStorage.setItem("ai-office-bg-opacity", String(customOpacity));
    }
    onClose();
  }, [previewBg, selected, customOpacity, onClose]);

  const handleReset = useCallback(() => {
    setSelected("default");
    setPreviewBg(null);
    setCustomImage(null);
    dispatchBgChange("default");
    localStorage.removeItem("ai-office-bg-opacity");
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Выберите изображение (PNG, JPG, WEBP)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Максимальный размер — 2 МБ");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomImage(base64);
      setPreviewBg(base64);
      dispatchBgChange(base64);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be selected again
    e.target.value = "";
  }, []);

  const handleOpacityChange = useCallback((val: number) => {
    setCustomOpacity(val);
    localStorage.setItem("ai-office-bg-opacity", String(val));
    window.dispatchEvent(new CustomEvent("ai-office-bg-opacity-change", { detail: val }));
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const isSelected = (value: string) => {
    const current = previewBg || selected;
    return current === value;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed z-[101] rounded-2xl overflow-hidden flex flex-col"
            style={{
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "-50%",
              width: "min(520px, 90vw)",
              maxHeight: "min(600px, 85vh)",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Фон рабочего пространства
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                  Выберите фон для корпоративного профиля
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Tabs */}
            <div
              className="flex gap-1 px-5 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      backgroundColor: isActive ? "var(--bg-elevated)" : "transparent",
                      color: isActive ? "var(--accent-blue)" : "var(--text-secondary)",
                      border: isActive ? "1px solid var(--border-default)" : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Icon size={14} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {activeCategory !== "custom" ? (
                <div className="grid grid-cols-3 gap-3">
                  {currentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt.value)}
                      className="group flex flex-col items-center gap-2 transition-all"
                    >
                      <div
                        className="relative w-[60px] h-[60px] rounded-lg overflow-hidden transition-all"
                        style={{
                          background: opt.preview,
                          border: isSelected(opt.value)
                            ? "2px solid var(--accent-blue)"
                            : "2px solid var(--border-default)",
                          boxShadow: isSelected(opt.value) ? "0 0 12px rgba(94,158,214,0.3)" : "none",
                        }}
                      >
                        {isSelected(opt.value) && (
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ backgroundColor: "rgba(94,158,214,0.2)" }}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Check size={20} style={{ color: "var(--accent-blue)" }} />
                          </motion.div>
                        )}
                      </div>
                      <span
                        className="text-[11px] font-medium transition-colors"
                        style={{
                          color: isSelected(opt.value) ? "var(--accent-blue)" : "var(--text-secondary)",
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Custom Upload */
                <div className="flex flex-col gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {customImage ? (
                    <div className="flex flex-col gap-3">
                      <div
                        className="relative w-full h-[140px] rounded-xl overflow-hidden"
                        style={{ border: "1px solid var(--border-default)" }}
                      >
                        <img
                          src={customImage}
                          alt="Пользовательский фон"
                          className="w-full h-full object-cover"
                          style={{ opacity: customOpacity }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{ backgroundColor: `rgba(28,28,30,${1 - customOpacity})` }}
                        />
                      </div>

                      {/* Opacity slider */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                            Прозрачность
                          </span>
                          <span className="text-[12px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                            {Math.round(customOpacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0.1}
                          max={0.5}
                          step={0.05}
                          value={customOpacity}
                          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, var(--accent-blue) ${((customOpacity - 0.1) / 0.4) * 100}%, var(--bg-elevated) ${((customOpacity - 0.1) / 0.4) * 100}%)`,
                          }}
                        />
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-default)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-input)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                          e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                      >
                        <Upload size={14} />
                        Заменить изображение
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl transition-colors"
                      style={{
                        border: "2px dashed var(--border-default)",
                        color: "var(--text-tertiary)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent-blue)";
                        e.currentTarget.style.color = "var(--accent-blue)";
                        e.currentTarget.style.backgroundColor = "rgba(94,158,214,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-default)";
                        e.currentTarget.style.color = "var(--text-tertiary)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <Upload size={28} />
                      <div className="text-center">
                        <p className="text-[13px] font-medium">Загрузить изображение</p>
                        <p className="text-[11px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                          PNG, JPG или WEBP, до 2 МБ
                        </p>
                      </div>
                    </button>
                  )}

                  {uploadError && (
                    <p className="text-[12px] font-medium" style={{ color: "var(--accent-rose)" }}>
                      {uploadError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ borderTop: "1px solid var(--border-default)" }}
            >
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                style={{ color: "var(--text-tertiary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--bg-elevated)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "var(--text-tertiary)";
                }}
              >
                <RotateCcw size={13} />
                Сбросить
              </button>
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                style={{
                  background: "linear-gradient(135deg, var(--accent-blue), var(--accent-teal))",
                  color: "#fff",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                <Check size={14} />
                Применить
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
