import { useState, useEffect, useMemo, useCallback } from "react";

// ====== Animated Background: Particles ======

function ParticlesBackground() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 2,
      opacity: 0.05 + Math.random() * 0.1,
      duration: 15 + Math.random() * 15,
      delay: Math.random() * 10,
      driftX: -20 + Math.random() * 40,
      driftY: -30 + Math.random() * -20,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(135deg, #0a1628, #1a2744)" }}>
      <style>{`
        @keyframes particle-float {
          0% { transform: translate(0, 0); opacity: var(--p-opacity); }
          50% { opacity: calc(var(--p-opacity) * 1.5); }
          100% { transform: translate(var(--p-dx), var(--p-dy)); opacity: 0; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: `rgba(255,255,255,${p.opacity})`,
            ["--p-opacity" as string]: p.opacity,
            ["--p-dx" as string]: `${p.driftX}px`,
            ["--p-dy" as string]: `${p.driftY}px`,
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ====== Animated Background: Waves ======

function WavesBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #0a1628, #0f2040)" }}>
      <style>{`
        @keyframes wave-move-1 { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes wave-move-2 { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes wave-move-3 { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
      {[
        { bottom: "10%", opacity: 0.08, duration: 20, color: "#5E9ED6" },
        { bottom: "20%", opacity: 0.05, duration: 25, color: "#5ABFAD" },
        { bottom: "5%", opacity: 0.06, duration: 30, color: "#9B8EC4" },
      ].map((wave, i) => (
        <div
          key={i}
          className="absolute left-0 h-[200px]"
          style={{
            bottom: wave.bottom,
            width: "200%",
            animation: `wave-move-${i + 1} ${wave.duration}s linear infinite`,
          }}
        >
          <svg viewBox="0 0 1440 200" className="w-full h-full" preserveAspectRatio="none">
            <path
              d={`M0,${80 + i * 20} C360,${40 + i * 15} 720,${120 - i * 10} 1440,${80 + i * 20} L1440,200 L0,200 Z`}
              fill={wave.color}
              fillOpacity={wave.opacity}
            />
            <path
              d={`M1440,${80 + i * 20} C2160,${40 + i * 15} 2520,${120 - i * 10} 2880,${80 + i * 20} L2880,200 L1440,200 Z`}
              fill={wave.color}
              fillOpacity={wave.opacity}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

// ====== Animated Background: Gradient Shift ======

function GradientShiftBackground() {
  return (
    <div className="absolute inset-0">
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div
        className="w-full h-full"
        style={{
          background: "linear-gradient(135deg, #1a0a38, #0a1a3a, #0a2a2a, #1a0a38)",
          backgroundSize: "400% 400%",
          animation: "gradient-shift 15s ease infinite",
        }}
      />
    </div>
  );
}

// ====== Animated Background: Matrix ======

function MatrixBackground() {
  const columns = useMemo(() => {
    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF";
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: (i / 30) * 100 + Math.random() * 2,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 8,
      chars: Array.from({ length: 8 + Math.floor(Math.random() * 8) }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ),
      opacity: 0.05 + Math.random() * 0.08,
      fontSize: 10 + Math.random() * 4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #001a00, #000a00)" }}>
      <style>{`
        @keyframes matrix-fall {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
      {columns.map((col) => (
        <div
          key={col.id}
          className="absolute top-0 flex flex-col items-center"
          style={{
            left: `${col.left}%`,
            animation: `matrix-fall ${col.duration}s linear ${col.delay}s infinite`,
            opacity: col.opacity,
          }}
        >
          {col.chars.map((char, j) => (
            <span
              key={j}
              className="block"
              style={{
                color: j === 0 ? "#aaffaa" : "#00ff00",
                fontSize: col.fontSize,
                lineHeight: 1.4,
                fontFamily: "monospace",
                textShadow: j === 0 ? "0 0 8px #00ff00" : "none",
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ====== Animated Background: Aurora ======

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#0a0a2e" }}>
      <style>{`
        @keyframes aurora-1 {
          0% { transform: translate(-10%, -10%) rotate(0deg) scale(1); }
          33% { transform: translate(10%, 5%) rotate(120deg) scale(1.1); }
          66% { transform: translate(-5%, 10%) rotate(240deg) scale(0.9); }
          100% { transform: translate(-10%, -10%) rotate(360deg) scale(1); }
        }
        @keyframes aurora-2 {
          0% { transform: translate(10%, -5%) rotate(0deg) scale(1); }
          33% { transform: translate(-10%, 10%) rotate(-120deg) scale(1.2); }
          66% { transform: translate(5%, -10%) rotate(-240deg) scale(0.8); }
          100% { transform: translate(10%, -5%) rotate(-360deg) scale(1); }
        }
        @keyframes aurora-3 {
          0% { transform: translate(0%, 10%) rotate(0deg) scale(1.1); }
          33% { transform: translate(10%, -10%) rotate(90deg) scale(0.9); }
          66% { transform: translate(-10%, 0%) rotate(180deg) scale(1.2); }
          100% { transform: translate(0%, 10%) rotate(360deg) scale(1.1); }
        }
      `}</style>
      <div
        className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%]"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(0,180,100,0.08) 0%, transparent 60%)",
          animation: "aurora-1 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%]"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(120,60,200,0.06) 0%, transparent 60%)",
          animation: "aurora-2 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[150%] h-[150%] top-[-25%] left-[-25%]"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(60,100,220,0.07) 0%, transparent 60%)",
          animation: "aurora-3 30s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ====== Main CorporateBackground Component ======

interface CorporateBackgroundProps {
  children: React.ReactNode;
}

export function CorporateBackground({ children }: CorporateBackgroundProps) {
  const [bg, setBg] = useState<string>(() => {
    try {
      return localStorage.getItem("ai-office-bg") || "default";
    } catch {
      return "default";
    }
  });
  const [customOpacity, setCustomOpacity] = useState<number>(() => {
    try {
      return parseFloat(localStorage.getItem("ai-office-bg-opacity") || "0.2");
    } catch {
      return 0.2;
    }
  });

  // Listen for background changes
  useEffect(() => {
    const handleBgChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setBg(detail);
    };
    const handleOpacityChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setCustomOpacity(detail);
    };
    window.addEventListener("ai-office-bg-change", handleBgChange);
    window.addEventListener("ai-office-bg-opacity-change", handleOpacityChange);
    return () => {
      window.removeEventListener("ai-office-bg-change", handleBgChange);
      window.removeEventListener("ai-office-bg-opacity-change", handleOpacityChange);
    };
  }, []);

  const renderBackground = useCallback(() => {
    if (bg === "default" || !bg) return null;
    if (bg === "particles") return <ParticlesBackground />;
    if (bg === "waves") return <WavesBackground />;
    if (bg === "gradient-shift") return <GradientShiftBackground />;
    if (bg === "matrix") return <MatrixBackground />;
    if (bg === "aurora") return <AuroraBackground />;

    if (bg.startsWith("linear-gradient")) {
      return <div className="w-full h-full" style={{ background: bg }} />;
    }

    if (bg.startsWith("data:image")) {
      return (
        <img
          src={bg}
          alt=""
          className="w-full h-full object-cover"
          style={{ opacity: customOpacity }}
        />
      );
    }

    return null;
  }, [bg, customOpacity]);

  if (bg === "default" || !bg) {
    return <div className="relative w-full h-full overflow-hidden">{children}</div>;
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        {renderBackground()}
      </div>

      {/* Content on top */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
