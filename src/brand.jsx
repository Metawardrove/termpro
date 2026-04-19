import React from 'react';

export const BRAND = {
  product: 'TermPro',
  tagline: 'Terminal manager',
  author: '@mateo.camposv',
  authorUrl: '',
  year: new Date().getFullYear(),
  version: '0.1.0'
};

export function Monogram({ size = 20, radius }) {
  const r = radius ?? Math.round(size * 0.22);
  const stroke = Math.max(1.2, size * 0.08);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: 'linear-gradient(150deg, var(--tp-accent) 0%, color-mix(in oklab, var(--tp-accent) 72%, #000) 100%)',
        color: 'var(--tp-text-strong)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 1px 2px rgba(0,0,0,0.3)'
      }}
      className="inline-flex items-center justify-center flex-shrink-0 relative"
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 20 20" fill="none">
        <path d="M4.5 6.5 8 10l-3.5 3.5" stroke="currentColor" strokeWidth={stroke * 1.4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 13.8h5.2" stroke="currentColor" strokeWidth={stroke * 1.4} strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function BrandCompact({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="inline-flex items-center gap-2"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Monogram size={18} radius={5} />
      <span
        className="text-[12px] font-semibold tracking-[-0.01em]"
        style={{ color: 'var(--tp-text-strong)' }}
      >
        Term<span style={{ color: 'var(--tp-accent-soft)' }}>Pro</span>
      </span>
    </div>
  );
}

export function BrandFull({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="inline-flex items-center gap-3"
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Monogram size={36} />
      <div className="flex flex-col leading-[1.1]">
        <span
          className="text-[17px] font-semibold tracking-[-0.02em]"
          style={{ color: 'var(--tp-text-strong)' }}
        >
          Term<span style={{ color: 'var(--tp-accent-soft)' }}>Pro</span>
        </span>
        <span
          className="text-[10.5px] font-mono uppercase tracking-[0.06em] mt-[3px]"
          style={{ color: 'var(--tp-text-40)' }}
        >
          {BRAND.tagline}
        </span>
      </div>
    </div>
  );
}

export function Signature({ size = 'md' }) {
  const fontSize = { xs: 11, sm: 12.5, md: 13.5, lg: 15 }[size] || 13.5;
  const content = (
    <span
      className="inline-flex items-baseline gap-[7px] whitespace-nowrap"
      style={{
        fontSize,
        color: 'var(--tp-text-65)',
        letterSpacing: '0.005em',
        padding: '2px 0'
      }}
    >
      <span
        style={{
          opacity: 0.9,
          fontWeight: 400,
          fontStyle: 'italic',
          letterSpacing: '0.01em'
        }}
      >
        espero que te sirva,
      </span>
      <span
        style={{
          color: 'var(--tp-accent-soft)',
          fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '-0.01em',
          textShadow: '0 0 14px color-mix(in oklab, var(--tp-accent) 45%, transparent)'
        }}
      >
        {BRAND.author}
      </span>
    </span>
  );
  if (BRAND.authorUrl) {
    return (
      <a
        href={BRAND.authorUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex no-underline transition-[filter]"
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        {content}
      </a>
    );
  }
  return content;
}

export function AboutDialog({ open, onClose }) {
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[3500]"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          animation: 'tpFade 0.15s'
        }}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[3501] rounded-[16px] border text-center"
        style={{
          width: 'min(420px, 88vw)',
          background: 'linear-gradient(180deg, var(--tp-card-hi), var(--tp-card-lo))',
          borderColor: 'var(--tp-border-10)',
          boxShadow: '0 28px 70px rgba(0,0,0,0.6)',
          padding: '32px 28px 24px',
          color: 'var(--tp-text)',
          animation: 'tpPaletteIn 0.22s cubic-bezier(0.2,0.9,0.3,1)'
        }}
      >
        <div className="inline-flex mb-[18px]">
          <Monogram size={64} radius={16} />
        </div>
        <div
          className="text-[26px] font-semibold tracking-[-0.025em]"
          style={{ color: 'var(--tp-text-strong)' }}
        >
          Term<span style={{ color: 'var(--tp-accent-soft)' }}>Pro</span>
        </div>
        <div
          className="text-[11.5px] mt-1.5 font-mono uppercase tracking-[0.12em]"
          style={{ color: 'var(--tp-text-40)' }}
        >
          {BRAND.tagline} · v{BRAND.version}
        </div>

        <div
          className="my-[22px] mx-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--tp-border-10), transparent)'
          }}
        />

        <div
          className="text-[13px] leading-[1.55] italic"
          style={{ color: 'var(--tp-text-65)' }}
        >
          "Un proyecto, una terminal, cero fricción."
        </div>

        <div className="mt-[22px] text-[11px]" style={{ color: 'var(--tp-text-45)' }}>
          <Signature size="sm" />
          <div
            className="mt-1 font-mono text-[10px]"
            style={{ color: 'var(--tp-text-30)' }}
          >
            © {BRAND.year}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-[22px] px-[18px] py-2 rounded-[7px] text-xs font-medium cursor-pointer border-none"
          style={{ background: 'var(--tp-border-08)', color: 'var(--tp-text-80)' }}
        >
          Cerrar
        </button>
      </div>
    </>
  );
}
