import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Send,
  Mic,
  MicOff,
  X,
  Paperclip,
  BookOpen,
  Search,
  FileText,
  File,
  Image,
  Loader2,
} from "lucide-react";

/* ── Types ── */
interface ChatInputV2Props {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  agents?: { id: string; name: string }[];
}

/* ── File icon helper ── */
function getFileIcon(name: string) {
  const lower = name.toLowerCase();
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/.test(lower)) return Image;
  if (/\.(pdf|doc|docx|txt|md)$/.test(lower)) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/* ── Component ── */
export function ChatInputV2({
  onSend,
  disabled = false,
  placeholder = "Сообщение...",
  agents = [],
}: ChatInputV2Props) {
  /* State: only 6 variables */
  const [text, setText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mentionFilterRef = useRef("");

  /* Auto-resize textarea */
  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 6; // max 6 lines
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  /* Close plus menu on outside click */
  useEffect(() => {
    if (!showPlusMenu) return;
    const handler = () => setShowPlusMenu(false);
    const timer = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [showPlusMenu]);

  /* Close mention dropdown on outside click */
  useEffect(() => {
    if (!showMentionDropdown) return;
    const handler = () => setShowMentionDropdown(false);
    const timer = setTimeout(() => document.addEventListener("click", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [showMentionDropdown]);

  /* ── Send handler ── */
  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachedFiles.length === 0) return;
    onSend(trimmed);
    setText("");
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, attachedFiles, onSend]);

  /* ── Keyboard ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter to send
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
        return;
      }
      // @ mention
      if (e.key === "@" && agents.length > 0) {
        mentionFilterRef.current = "";
        setShowMentionDropdown(true);
      }
      // Close mention dropdown on Escape
      if (e.key === "Escape") {
        setShowMentionDropdown(false);
        setShowPlusMenu(false);
      }
    },
    [handleSend, agents.length]
  );

  /* ── Text change with mention filtering ── */
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setText(value);

      // Check for @mention pattern
      if (showMentionDropdown) {
        const lastAt = value.lastIndexOf("@");
        if (lastAt >= 0) {
          mentionFilterRef.current = value.slice(lastAt + 1).toLowerCase();
        } else {
          setShowMentionDropdown(false);
        }
      }
    },
    [showMentionDropdown]
  );

  /* ── Mention select ── */
  const handleMentionSelect = useCallback(
    (agentName: string) => {
      const lastAt = text.lastIndexOf("@");
      if (lastAt >= 0) {
        setText(text.slice(0, lastAt) + `@${agentName} `);
      }
      setShowMentionDropdown(false);
      textareaRef.current?.focus();
    },
    [text]
  );

  /* ── File attach ── */
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles((prev) => [...prev, ...files]);
    if (e.target) e.target.value = "";
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /* ── Voice recording ── */
  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        if (blob.size < 100) return;

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          const resp = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.text) {
              setText((prev) => (prev ? prev + " " + data.text : data.text));
            }
          }
        } catch (err) {
          console.error("Transcription error:", err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access error:", err);
    }
  }, [isRecording]);

  /* Filtered agents for mention dropdown */
  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(mentionFilterRef.current)
  );

  const hasContent = text.trim().length > 0 || attachedFiles.length > 0;

  /* ── Plus menu items ── */
  const plusMenuItems = [
    { id: "file", label: "Прикрепить файл", icon: Paperclip, action: () => fileInputRef.current?.click() },
    { id: "kb", label: "База знаний", icon: BookOpen, action: () => onSend("/kb") },
    { id: "research", label: "Deep Research", icon: Search, action: () => onSend("/research") },
    { id: "template", label: "Из шаблона", icon: FileText, action: () => onSend("/template") },
  ];

  return (
    <div className="pb-3 pt-2">
      {/* ── File previews ── */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2 mb-2"
          >
            {attachedFiles.map((file, i) => {
              const FileIcon = getFileIcon(file.name);
              return (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <FileIcon size={14} style={{ color: "var(--text-tertiary)" }} />
                  <span
                    className="truncate max-w-[120px]"
                    style={{ fontSize: "var(--font-size-xs)", color: "var(--text-secondary)" }}
                  >
                    {file.name}
                  </span>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
                    ({formatFileSize(file.size)})
                  </span>
                  <button
                    onClick={() => handleRemoveFile(i)}
                    className="p-0.5 rounded transition-colors"
                    style={{ color: "var(--text-tertiary)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-rose)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input container ── */}
      <div
        className="flex items-end gap-1 rounded-xl px-2 py-1.5 transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* [+] Plus button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPlusMenu(!showPlusMenu);
            }}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "var(--text-tertiary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
            title="Вложения и действия"
          >
            <Plus size={18} />
          </button>

          {/* Plus dropdown menu */}
          <AnimatePresence>
            {showPlusMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full left-0 mb-2 rounded-xl py-1 z-50 min-w-[180px]"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "var(--shadow-lg)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {plusMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.action();
                        setShowPlusMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 transition-colors"
                      style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--text-secondary)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <Icon size={14} />
                      {item.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-transparent border-none outline-none resize-none py-2 px-1"
            style={{
              fontSize: "var(--font-size-base)",
              color: "var(--text-primary)",
              lineHeight: "24px",
              maxHeight: `${24 * 6}px`,
            }}
          />

          {/* @mention dropdown */}
          <AnimatePresence>
            {showMentionDropdown && filteredAgents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute bottom-full left-0 mb-1 rounded-xl py-1 z-50 min-w-[160px] max-h-[200px] overflow-y-auto"
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleMentionSelect(agent.name)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 transition-colors"
                    style={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-surface)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
                      style={{
                        backgroundColor: "var(--bg-surface)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {agent.name.charAt(0)}
                    </span>
                    {agent.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mic button */}
        <button
          onClick={handleToggleRecording}
          disabled={isTranscribing}
          className="p-2 rounded-lg transition-colors flex-shrink-0"
          style={{
            color: isRecording
              ? "var(--accent-rose)"
              : isTranscribing
              ? "var(--accent-amber)"
              : "var(--text-tertiary)",
          }}
          onMouseEnter={(e) => {
            if (!isRecording && !isTranscribing)
              e.currentTarget.style.color = "var(--text-secondary)";
          }}
          onMouseLeave={(e) => {
            if (!isRecording && !isTranscribing)
              e.currentTarget.style.color = "var(--text-tertiary)";
          }}
          title={isRecording ? "Остановить запись" : isTranscribing ? "Распознавание..." : "Голосовой ввод"}
        >
          {isTranscribing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isRecording ? (
            <MicOff size={18} />
          ) : (
            <Mic size={18} />
          )}
        </button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!hasContent)}
          className="p-2 rounded-lg transition-all flex-shrink-0"
          style={{
            backgroundColor: hasContent ? "var(--accent-blue)" : "transparent",
            color: hasContent ? "#fff" : "var(--text-tertiary)",
          }}
          title="Отправить (Ctrl+Enter)"
        >
          <Send size={18} />
        </button>
      </div>

      {/* Shortcut hint */}
      <div className="flex justify-end mt-1 px-1">
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
          Ctrl+Enter
        </span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
