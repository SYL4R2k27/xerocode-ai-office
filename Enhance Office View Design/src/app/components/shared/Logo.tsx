export function LogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#4F7CFF"/>
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
      <circle cx="11" cy="10" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="21" cy="10" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="16" cy="16" r="3" fill="white"/>
      <circle cx="11" cy="22" r="2.5" fill="white" opacity="0.9"/>
      <circle cx="21" cy="22" r="2.5" fill="white" opacity="0.9"/>
      <line x1="11" y1="10" x2="16" y2="16" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="21" y1="10" x2="16" y2="16" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="16" y1="16" x2="11" y2="22" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <line x1="16" y1="16" x2="21" y2="22" stroke="white" strokeWidth="1.2" opacity="0.5"/>
    </svg>
  );
}

export function LogoFull({ height = 28 }: { height?: number }) {
  return (
    <div className="flex items-center gap-2">
      <LogoIcon size={height} />
      <span className="font-bold text-white" style={{ fontSize: height * 0.65 }}>XeroCode</span>
      <span
        style={{
          fontSize: height * 0.55,
          lineHeight: 1,
          padding: `${height * 0.05}px ${height * 0.12}px`,
          borderRadius: height * 0.15,
          background: "rgba(124,58,237,0.15)",
          border: "1px solid rgba(124,58,237,0.3)",
          color: "#a78bfa",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        β
      </span>
    </div>
  );
}
