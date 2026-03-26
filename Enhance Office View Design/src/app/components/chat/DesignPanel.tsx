import { useState, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Shuffle,
  Lock,
} from "lucide-react";

export interface DesignParams {
  resolution: string;
  aspectRatio: string;
  style: string;
  negativePrompt: string;
  batchCount: number;
  seed: number | null;
  img2imgStrength: number;
  outputFormat: string;
  model: string;
}

export const DEFAULT_DESIGN_PARAMS: DesignParams = {
  resolution: "1024x1024",
  aspectRatio: "1:1",
  style: "photorealistic",
  negativePrompt: "",
  batchCount: 1,
  seed: null,
  img2imgStrength: 0.7,
  outputFormat: "png",
  model: "sd3.5-large",
};

interface DesignPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  params: DesignParams;
  onParamsChange: (params: DesignParams) => void;
}

const MODELS = [
  { id: "sd3.5-large", label: "SD 3.5 Large", desc: "лучшее качество" },
  { id: "sd3.5-medium", label: "SD 3.5 Medium", desc: "быстрый" },
  { id: "sd3.5-large-turbo", label: "SD 3.5 Turbo", desc: "очень быстрый" },
  { id: "stable-image-ultra", label: "Stable Ultra", desc: "премиум" },
  { id: "stable-image-core", label: "Stable Core", desc: "базовый" },
  { id: "google/gemini-2.5-flash-image", label: "Nano Banana", desc: "Gemini" },
  { id: "google/gemini-2.5-pro-image", label: "Nano Banana Pro", desc: "премиум" },
  { id: "flux-pro", label: "FLUX Pro", desc: "через API" },
];

const RESOLUTIONS = [
  "512x512",
  "768x768",
  "1024x1024",
  "1536x1536",
  "2048x2048",
  "3840x2160",
];

const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:2", "4:5", "21:9"];

const STYLE_PRESETS = [
  { id: "photorealistic", label: "Фотореализм" },
  { id: "illustration", label: "Иллюстрация" },
  { id: "anime", label: "Аниме" },
  { id: "watercolor", label: "Акварель" },
  { id: "oil-painting", label: "Масло" },
  { id: "3d-render", label: "3D" },
  { id: "vector", label: "Вектор" },
  { id: "line-art", label: "Лайн-арт" },
  { id: "sketch", label: "Скетч" },
  { id: "pixel-art", label: "Пиксель" },
  { id: "comic-book", label: "Комикс" },
  { id: "cinematic", label: "Кино" },
  { id: "fantasy-art", label: "Фэнтези" },
  { id: "neon-punk", label: "Неон-панк" },
  { id: "isometric", label: "Изометрия" },
  { id: "low-poly", label: "Low Poly" },
  { id: "digital-art", label: "Диджитал" },
  { id: "analog-film", label: "Плёнка" },
  { id: "origami", label: "Оригами" },
  { id: "enhance", label: "Улучшение" },
];

const BATCH_COUNTS = [1, 2, 4, 8];
const FORMATS = ["png", "jpeg", "webp"];

export function DesignPanel({
  isOpen,
  onToggle,
  params,
  onParamsChange,
}: DesignPanelProps) {
  const [showNegative, setShowNegative] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [img2imgFile, setImg2imgFile] = useState<File | null>(null);
  const [img2imgPreview, setImg2imgPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback(
    (patch: Partial<DesignParams>) => {
      onParamsChange({ ...params, ...patch });
    },
    [params, onParamsChange]
  );

  const handleImg2imgUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImg2imgFile(file);
        const reader = new FileReader();
        reader.onload = () => setImg2imgPreview(reader.result as string);
        reader.readAsDataURL(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    []
  );

  const removeImg2img = useCallback(() => {
    setImg2imgFile(null);
    setImg2imgPreview(null);
  }, []);

  const toggleSeedLock = useCallback(() => {
    if (params.seed !== null) {
      update({ seed: null });
    } else {
      update({ seed: Math.floor(Math.random() * 2147483647) });
    }
  }, [params.seed, update]);

  const randomizeSeed = useCallback(() => {
    update({ seed: Math.floor(Math.random() * 2147483647) });
  }, [update]);

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        backgroundColor: "#141416",
        overflow: "hidden",
        transition: "max-height 0.3s ease, opacity 0.2s ease",
        maxHeight: isOpen ? "300px" : "0px",
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          maxHeight: "200px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Ряд 1: Модель + Разрешение + Соотношение сторон */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          {/* Модель */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Модель:
            </span>
            <select
              value={params.model}
              onChange={(e) => update({ model: e.target.value })}
              style={{
                fontSize: "11px",
                padding: "3px 6px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                outline: "none",
                cursor: "pointer",
                maxWidth: "160px",
              }}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.desc})
                </option>
              ))}
            </select>
          </div>

          {/* Разрешение */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Размер:
            </span>
            <select
              value={params.resolution}
              onChange={(e) => update({ resolution: e.target.value })}
              style={{
                fontSize: "11px",
                padding: "3px 6px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {RESOLUTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === "3840x2160" ? "4K (3840x2160)" : r}
                </option>
              ))}
            </select>
          </div>

          {/* Соотношение сторон */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Пропорции:
            </span>
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar}
                onClick={() => update({ aspectRatio: ar })}
                style={{
                  fontSize: "10px",
                  padding: "2px 5px",
                  borderRadius: "4px",
                  border:
                    params.aspectRatio === ar
                      ? "1px solid var(--accent-lavender, #a78bfa)"
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.aspectRatio === ar
                      ? "rgba(167,139,250,0.2)"
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.aspectRatio === ar
                      ? "#a78bfa"
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {ar}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 2: Стили (горизонтальный скролл) */}
        <div style={{ marginBottom: "6px" }}>
          <div
            style={{
              display: "flex",
              gap: "4px",
              overflowX: "auto",
              paddingBottom: "2px",
              scrollbarWidth: "none",
            }}
          >
            {STYLE_PRESETS.map((s) => (
              <button
                key={s.id}
                onClick={() => update({ style: s.id })}
                style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  border:
                    params.style === s.id
                      ? "1px solid var(--accent-lavender, #a78bfa)"
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.style === s.id
                      ? "rgba(167,139,250,0.2)"
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.style === s.id
                      ? "#a78bfa"
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 3: Негативный промпт (сворачиваемый) */}
        <div style={{ marginBottom: "6px" }}>
          <button
            onClick={() => setShowNegative(!showNegative)}
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              padding: "0",
              marginBottom: showNegative ? "4px" : "0",
            }}
          >
            {showNegative ? (
              <ChevronUp size={10} />
            ) : (
              <ChevronDown size={10} />
            )}
            Негативный промпт
            {params.negativePrompt && (
              <span style={{ color: "#a78bfa", marginLeft: "4px" }}>
                (задан)
              </span>
            )}
          </button>
          {showNegative && (
            <input
              type="text"
              value={params.negativePrompt}
              onChange={(e) => update({ negativePrompt: e.target.value })}
              placeholder="Чего не должно быть на изображении..."
              style={{
                width: "100%",
                fontSize: "11px",
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "#fff",
                outline: "none",
              }}
            />
          )}
        </div>

        {/* Ряд 4: Пакет + Сид + Формат */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            marginBottom: "6px",
            flexWrap: "wrap",
          }}
        >
          {/* Кол-во */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Кол-во:
            </span>
            {BATCH_COUNTS.map((n) => (
              <button
                key={n}
                onClick={() => update({ batchCount: n })}
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border:
                    params.batchCount === n
                      ? "1px solid var(--accent-blue, #3b82f6)"
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.batchCount === n
                      ? "rgba(59,130,246,0.2)"
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.batchCount === n
                      ? "#3b82f6"
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                x{n}
              </button>
            ))}
          </div>

          {/* Сид */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Сид:
            </span>
            <button
              onClick={toggleSeedLock}
              title={
                params.seed !== null
                  ? "Зафиксирован — нажмите для случайного"
                  : "Случайный — нажмите для фиксации"
              }
              style={{
                fontSize: "10px",
                padding: "2px 4px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.08)",
                backgroundColor:
                  params.seed !== null
                    ? "rgba(167,139,250,0.15)"
                    : "rgba(255,255,255,0.03)",
                color:
                  params.seed !== null ? "#a78bfa" : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              {params.seed !== null ? (
                <Lock size={9} />
              ) : (
                <Shuffle size={9} />
              )}
              {params.seed !== null ? params.seed : "Случ."}
            </button>
            {params.seed !== null && (
              <button
                onClick={randomizeSeed}
                title="Новый случайный сид"
                style={{
                  fontSize: "9px",
                  padding: "2px 4px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                }}
              >
                <Shuffle size={9} />
              </button>
            )}
          </div>

          {/* Формат */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span
              style={{
                fontSize: "10px",
                color: "rgba(255,255,255,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              Формат:
            </span>
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => update({ outputFormat: f })}
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border:
                    params.outputFormat === f
                      ? "1px solid var(--accent-teal, #2dd4bf)"
                      : "1px solid rgba(255,255,255,0.08)",
                  backgroundColor:
                    params.outputFormat === f
                      ? "rgba(45,212,191,0.15)"
                      : "rgba(255,255,255,0.03)",
                  color:
                    params.outputFormat === f
                      ? "#2dd4bf"
                      : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textTransform: "uppercase",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 5: Img2Img (раскрываемый) */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              fontSize: "10px",
              color: "rgba(255,255,255,0.4)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              padding: "0",
              marginBottom: showAdvanced ? "4px" : "0",
            }}
          >
            {showAdvanced ? (
              <ChevronUp size={10} />
            ) : (
              <ChevronDown size={10} />
            )}
            Img2Img и доп. настройки
            {img2imgFile && (
              <span style={{ color: "#a78bfa", marginLeft: "4px" }}>
                (загружен)
              </span>
            )}
          </button>

          {showAdvanced && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Загрузка изображения */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImg2imgUpload}
                />
                {img2imgPreview ? (
                  <div
                    style={{
                      position: "relative",
                      width: "36px",
                      height: "36px",
                    }}
                  >
                    <img
                      src={img2imgPreview}
                      alt="img2img"
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "6px",
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                    <button
                      onClick={removeImg2img}
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(239,68,68,0.8)",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        padding: "0",
                      }}
                    >
                      <X size={8} color="#fff" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      fontSize: "10px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      border: "1px dashed rgba(255,255,255,0.15)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Upload size={10} />
                    Загрузить фото
                  </button>
                )}
              </div>

              {/* Сила трансформации */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.4)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Сила:
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={params.img2imgStrength}
                  onChange={(e) =>
                    update({ img2imgStrength: parseFloat(e.target.value) })
                  }
                  style={{
                    width: "80px",
                    height: "4px",
                    accentColor: "#a78bfa",
                  }}
                />
                <span
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.5)",
                    minWidth: "24px",
                  }}
                >
                  {params.img2imgStrength.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Сериализовать параметры дизайна в строку для сообщения.
 * Формат: [DESIGN:resolution=1024x1024,aspect=1:1,style=photorealistic,...]
 */
export function serializeDesignParams(params: DesignParams): string {
  const parts: string[] = [];
  if (params.model !== "sd3.5-large") parts.push(`model=${params.model}`);
  if (params.resolution !== "1024x1024")
    parts.push(`resolution=${params.resolution}`);
  if (params.aspectRatio !== "1:1") parts.push(`aspect=${params.aspectRatio}`);
  if (params.style !== "photorealistic") parts.push(`style=${params.style}`);
  if (params.negativePrompt)
    parts.push(`negative=${params.negativePrompt}`);
  if (params.batchCount > 1) parts.push(`batch=${params.batchCount}`);
  if (params.seed !== null) parts.push(`seed=${params.seed}`);
  if (params.outputFormat !== "png")
    parts.push(`format=${params.outputFormat}`);
  if (params.img2imgStrength !== 0.7)
    parts.push(`strength=${params.img2imgStrength}`);

  if (parts.length === 0) return "";
  return ` [DESIGN:${parts.join(",")}]`;
}
