import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface CodeParams {
  language: string;
  framework: string;
  codeStyle: string;
  testFramework: string;
  scope: string;
  outputMode: string;
}

export const DEFAULT_CODE_PARAMS: CodeParams = {
  language: "typescript",
  framework: "",
  codeStyle: "",
  testFramework: "",
  scope: "project",
  outputMode: "diff",
};

interface CodePanelProps {
  isOpen: boolean;
  onToggle: () => void;
  params: CodeParams;
  onParamsChange: (params: CodeParams) => void;
}

const LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "typescript", label: "TypeScript" },
  { id: "javascript", label: "JavaScript" },
  { id: "rust", label: "Rust" },
  { id: "go", label: "Go" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "cpp", label: "C++" },
  { id: "swift", label: "Swift" },
  { id: "kotlin", label: "Kotlin" },
  { id: "php", label: "PHP" },
  { id: "ruby", label: "Ruby" },
];

const FRAMEWORKS: Record<string, { id: string; label: string }[]> = {
  typescript: [
    { id: "react", label: "React" },
    { id: "nextjs", label: "Next.js" },
    { id: "nestjs", label: "NestJS" },
    { id: "express", label: "Express" },
    { id: "vue", label: "Vue" },
    { id: "angular", label: "Angular" },
    { id: "svelte", label: "Svelte" },
  ],
  javascript: [
    { id: "react", label: "React" },
    { id: "nextjs", label: "Next.js" },
    { id: "express", label: "Express" },
    { id: "vue", label: "Vue" },
    { id: "node", label: "Node.js" },
  ],
  python: [
    { id: "fastapi", label: "FastAPI" },
    { id: "django", label: "Django" },
    { id: "flask", label: "Flask" },
    { id: "pytorch", label: "PyTorch" },
    { id: "langchain", label: "LangChain" },
  ],
  java: [
    { id: "spring", label: "Spring" },
    { id: "quarkus", label: "Quarkus" },
  ],
  go: [
    { id: "gin", label: "Gin" },
    { id: "fiber", label: "Fiber" },
    { id: "echo", label: "Echo" },
  ],
  rust: [
    { id: "actix", label: "Actix" },
    { id: "axum", label: "Axum" },
    { id: "tauri", label: "Tauri" },
  ],
  swift: [
    { id: "swiftui", label: "SwiftUI" },
    { id: "vapor", label: "Vapor" },
  ],
  kotlin: [
    { id: "ktor", label: "Ktor" },
    { id: "compose", label: "Compose" },
  ],
  csharp: [
    { id: "aspnet", label: "ASP.NET" },
    { id: "maui", label: "MAUI" },
    { id: "unity", label: "Unity" },
  ],
  php: [
    { id: "laravel", label: "Laravel" },
    { id: "symfony", label: "Symfony" },
  ],
  ruby: [
    { id: "rails", label: "Rails" },
    { id: "sinatra", label: "Sinatra" },
  ],
  cpp: [],
};

const CODE_STYLES: Record<string, { id: string; label: string }[]> = {
  typescript: [
    { id: "eslint", label: "ESLint" },
    { id: "prettier", label: "Prettier" },
    { id: "biome", label: "Biome" },
  ],
  javascript: [
    { id: "eslint", label: "ESLint" },
    { id: "prettier", label: "Prettier" },
    { id: "biome", label: "Biome" },
  ],
  python: [
    { id: "black", label: "Black" },
    { id: "pep8", label: "PEP8" },
    { id: "ruff", label: "Ruff" },
  ],
  rust: [{ id: "rustfmt", label: "Rustfmt" }],
  go: [{ id: "gofmt", label: "Gofmt" }],
  java: [
    { id: "google", label: "Google Style" },
    { id: "checkstyle", label: "Checkstyle" },
  ],
  csharp: [{ id: "dotnet", label: ".NET Style" }],
  swift: [{ id: "swiftformat", label: "SwiftFormat" }],
  kotlin: [{ id: "ktlint", label: "Ktlint" }],
  php: [{ id: "psr12", label: "PSR-12" }],
  ruby: [{ id: "rubocop", label: "RuboCop" }],
  cpp: [{ id: "clangformat", label: "ClangFormat" }],
};

const TEST_FRAMEWORKS: Record<string, { id: string; label: string }[]> = {
  typescript: [
    { id: "vitest", label: "Vitest" },
    { id: "jest", label: "Jest" },
    { id: "playwright", label: "Playwright" },
    { id: "cypress", label: "Cypress" },
  ],
  javascript: [
    { id: "jest", label: "Jest" },
    { id: "vitest", label: "Vitest" },
    { id: "mocha", label: "Mocha" },
  ],
  python: [
    { id: "pytest", label: "Pytest" },
    { id: "unittest", label: "Unittest" },
  ],
  rust: [{ id: "cargo-test", label: "Cargo Test" }],
  go: [{ id: "go-test", label: "Go Test" }],
  java: [
    { id: "junit", label: "JUnit" },
    { id: "mockito", label: "Mockito" },
  ],
  csharp: [
    { id: "xunit", label: "xUnit" },
    { id: "nunit", label: "NUnit" },
  ],
  swift: [{ id: "xctest", label: "XCTest" }],
  kotlin: [{ id: "junit", label: "JUnit" }],
  php: [{ id: "phpunit", label: "PHPUnit" }],
  ruby: [{ id: "rspec", label: "RSpec" }],
  cpp: [{ id: "gtest", label: "Google Test" }],
};

const SCOPES = [
  { id: "file", label: "Один файл" },
  { id: "project", label: "Весь проект" },
  { id: "monorepo", label: "Монорепо" },
];

const OUTPUT_MODES = [
  { id: "diff", label: "Diff" },
  { id: "full", label: "Полный файл" },
  { id: "inline", label: "Inline" },
];

// Акцентный цвет для CodePanel — синий
const ACCENT = "#3b82f6";
const ACCENT_BG = "rgba(59,130,246,0.2)";
const ACCENT_BORDER = "rgba(59,130,246,0.5)";

const btnBase: React.CSSProperties = {
  fontSize: "10px",
  padding: "2px 8px",
  borderRadius: "10px",
  cursor: "pointer",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
  flexShrink: 0,
  border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "rgba(255,255,255,0.03)",
  color: "rgba(255,255,255,0.5)",
};

const btnActive: React.CSSProperties = {
  ...btnBase,
  border: `1px solid ${ACCENT_BORDER}`,
  backgroundColor: ACCENT_BG,
  color: ACCENT,
};

const selectStyle: React.CSSProperties = {
  fontSize: "11px",
  padding: "3px 6px",
  borderRadius: "6px",
  border: "1px solid rgba(255,255,255,0.1)",
  backgroundColor: "rgba(255,255,255,0.05)",
  color: "#fff",
  outline: "none",
  cursor: "pointer",
  maxWidth: "160px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "rgba(255,255,255,0.4)",
  whiteSpace: "nowrap",
};

export function CodePanel({ isOpen, onToggle, params, onParamsChange }: CodePanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = useCallback(
    (patch: Partial<CodeParams>) => {
      const next = { ...params, ...patch };
      // Сбросить фреймворк/стиль/тесты если сменился язык
      if (patch.language && patch.language !== params.language) {
        next.framework = "";
        next.codeStyle = "";
        next.testFramework = "";
      }
      onParamsChange(next);
    },
    [params, onParamsChange]
  );

  const frameworks = FRAMEWORKS[params.language] || [];
  const styles = CODE_STYLES[params.language] || [];
  const tests = TEST_FRAMEWORKS[params.language] || [];

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
      <div style={{ padding: "8px 12px", maxHeight: "200px", overflowY: "auto", overflowX: "hidden" }}>
        {/* Ряд 1: Язык */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          <span style={labelStyle}>Язык:</span>
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", scrollbarWidth: "none" }}>
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                onClick={() => update({ language: l.id })}
                style={params.language === l.id ? btnActive : btnBase}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 2: Фреймворк (зависит от языка) */}
        {frameworks.length > 0 && (
          <div style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
            <span style={labelStyle}>Фреймворк:</span>
            <div style={{ display: "flex", gap: "4px", overflowX: "auto", scrollbarWidth: "none" }}>
              <button
                onClick={() => update({ framework: "" })}
                style={params.framework === "" ? btnActive : btnBase}
              >
                Авто
              </button>
              {frameworks.map((f) => (
                <button
                  key={f.id}
                  onClick={() => update({ framework: f.id })}
                  style={params.framework === f.id ? btnActive : btnBase}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ряд 3: Режим + Вывод */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={labelStyle}>Режим:</span>
            {SCOPES.map((s) => (
              <button
                key={s.id}
                onClick={() => update({ scope: s.id })}
                style={params.scope === s.id ? btnActive : btnBase}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            <span style={labelStyle}>Вывод:</span>
            {OUTPUT_MODES.map((o) => (
              <button
                key={o.id}
                onClick={() => update({ outputMode: o.id })}
                style={params.outputMode === o.id ? btnActive : btnBase}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ряд 4: Стиль + Тесты (раскрываемые) */}
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
            {showAdvanced ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Стиль кода и тесты
            {(params.codeStyle || params.testFramework) && (
              <span style={{ color: ACCENT, marginLeft: "4px" }}>
                ({[params.codeStyle, params.testFramework].filter(Boolean).join(", ")})
              </span>
            )}
          </button>

          {showAdvanced && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              {styles.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <span style={labelStyle}>Стиль:</span>
                  <button
                    onClick={() => update({ codeStyle: "" })}
                    style={params.codeStyle === "" ? btnActive : btnBase}
                  >
                    Авто
                  </button>
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => update({ codeStyle: s.id })}
                      style={params.codeStyle === s.id ? btnActive : btnBase}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              {tests.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                  <span style={labelStyle}>Тесты:</span>
                  <button
                    onClick={() => update({ testFramework: "" })}
                    style={params.testFramework === "" ? btnActive : btnBase}
                  >
                    Без
                  </button>
                  {tests.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => update({ testFramework: t.id })}
                      style={params.testFramework === t.id ? btnActive : btnBase}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function serializeCodeParams(params: CodeParams): string {
  const parts: string[] = [];
  if (params.language !== "typescript") parts.push(`lang=${params.language}`);
  if (params.framework) parts.push(`framework=${params.framework}`);
  if (params.codeStyle) parts.push(`style=${params.codeStyle}`);
  if (params.testFramework) parts.push(`tests=${params.testFramework}`);
  if (params.scope !== "project") parts.push(`scope=${params.scope}`);
  if (params.outputMode !== "diff") parts.push(`output=${params.outputMode}`);
  if (parts.length === 0) return "";
  return ` [CODE:${parts.join(",")}]`;
}
