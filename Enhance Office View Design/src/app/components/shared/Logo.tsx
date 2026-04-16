/**
 * XeroCode logo system — X8 Refined (Ring-to-X concept, gapped core).
 *
 * Mark: 4 diagonal strokes, equal length (30√2), symmetric gap at centre,
 *       stroke-width 16 on a 200×200 viewBox. Uses currentColor so it
 *       inherits parent text color (adapts to dark/light themes).
 *
 * Wordmark: XEROCODE, all-caps, Inter Medium with wide letter-spacing.
 */

export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="16" strokeLinecap="round">
        <line x1="58"  y1="58"  x2="88"  y2="88"  />
        <line x1="112" y1="112" x2="142" y2="142" />
        <line x1="142" y1="58"  x2="112" y2="88"  />
        <line x1="58"  y1="142" x2="88"  y2="112" />
      </g>
    </svg>
  );
}

export function LogoFull({ height = 28 }: { height?: number }) {
  const markSize = height;
  const wordSize = Math.round(height * 0.62);
  const gap = Math.round(height * 0.45);
  const dividerHeight = Math.round(height * 0.75);

  return (
    <div
      className="flex items-center text-white"
      style={{ gap: `${gap}px`, lineHeight: 1 }}
    >
      <LogoIcon size={markSize} />
      <span
        aria-hidden="true"
        style={{
          width: 1,
          height: dividerHeight,
          background: "rgba(255,255,255,0.22)",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          fontWeight: 500,
          fontSize: wordSize,
          letterSpacing: `${Math.max(2, Math.round(wordSize * 0.14))}px`,
          color: "white",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        XEROCODE
      </span>
    </div>
  );
}
