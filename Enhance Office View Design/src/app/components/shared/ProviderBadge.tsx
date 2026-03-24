const providerConfig: Record<string, { label: string; color: string }> = {
  openai: { label: "OpenAI", color: "var(--provider-openai)" },
  anthropic: { label: "Anthropic", color: "var(--provider-anthropic)" },
  groq: { label: "Groq", color: "#F55036" },
  google: { label: "Gemini", color: "var(--provider-google)" },
  gemini: { label: "Gemini", color: "var(--provider-google)" },
  stability: { label: "Stability", color: "#8B5CF6" },
  ollama: { label: "Ollama", color: "var(--provider-ollama)" },
  custom: { label: "Custom", color: "var(--provider-custom)" },
};

interface ProviderBadgeProps {
  provider: string;
}

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  const config = providerConfig[provider] || { label: provider, color: "#6E6E73" };

  return (
    <span
      className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded"
      style={{
        color: config.color,
        backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
      }}
    >
      {config.label}
    </span>
  );
}
