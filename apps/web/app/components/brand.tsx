import { GraduationCap } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`.trim()}>
      <img
        src="/brand/logo-mark.svg"
        alt="Logomarca Instituto Criativo"
        width={48}
        height={48}
        className="brand-logo"
      />
      <div className="brand-copy">
        <p className="brand-title">Instituto Criativo</p>
        <p className="brand-subtitle">
          <GraduationCap size={14} aria-hidden="true" />
          <span>Recursos Pedagógicos</span>
        </p>
      </div>
    </div>
  );
}
