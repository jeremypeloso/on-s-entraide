"use client";

// Petit kit UI de l'admin : tout est en font-display, cartes blanches sur fond gris doux.

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm font-body text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = "", tone }: { children: React.ReactNode; className?: string; tone?: "alert" | "warn" }) {
  const border = tone === "alert" ? "border-red-200 bg-red-50/40" : tone === "warn" ? "border-amber-200 bg-amber-50/40" : "border-neutral-200/80 bg-white";
  return <div className={`rounded-2xl border shadow-sm shadow-ink/[0.03] ${border} ${className}`}>{children}</div>;
}

export function List({ children, empty, count }: { children: React.ReactNode; empty?: string; count: number }) {
  if (count === 0) return <Card className="px-6 py-14 text-center text-sm font-bold text-neutral-400">{empty ?? "Rien à afficher."}</Card>;
  return <Card className="divide-y divide-neutral-100 overflow-hidden">{children}</Card>;
}

export function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-neutral-50/70 transition ${className}`}>{children}</div>;
}

export function Avatar({ name, gradient = "from-coral via-pink to-lilac" }: { name?: string | null; gradient?: string }) {
  return (
    <span className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0`}>
      {(name ?? "?").trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

type PillTone = "mint" | "sky" | "lilac" | "coral" | "amber" | "neutral" | "ink" | "red";
const PILL: Record<PillTone, string> = {
  mint: "bg-mint/15 text-mint", sky: "bg-sky/15 text-sky", lilac: "bg-lilac/15 text-lilac", coral: "bg-coral/15 text-coral-dark",
  amber: "bg-amber-100 text-amber-700", neutral: "bg-neutral-100 text-neutral-500", ink: "bg-ink text-white", red: "bg-red-100 text-red-600",
};
export function Pill({ tone = "neutral", children, onClick, title }: { tone?: PillTone; children: React.ReactNode; onClick?: () => void; title?: string }) {
  const cls = `text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${PILL[tone]} ${onClick ? "hover:opacity-80 transition cursor-pointer" : ""}`;
  return onClick ? <button onClick={onClick} title={title} className={cls}>{children}</button> : <span title={title} className={cls}>{children}</span>;
}

type BtnTone = "primary" | "dark" | "ghost" | "danger" | "mint";
const BTN: Record<BtnTone, string> = {
  primary: "bg-gradient-to-br from-coral to-coral-dark text-white shadow-md shadow-coral/20 hover:brightness-105",
  dark: "bg-ink text-white hover:bg-ink/90",
  ghost: "border border-neutral-200 text-ink hover:border-ink",
  danger: "bg-red-500 text-white hover:bg-red-600",
  mint: "bg-mint text-white hover:bg-mint/90",
};
export function Btn({ tone = "ghost", size = "sm", children, onClick, disabled, type = "button" }: {
  tone?: BtnTone; size?: "sm" | "md"; children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit";
}) {
  const sz = size === "sm" ? "text-xs px-4 py-2" : "text-sm px-5 py-2.5";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`font-bold rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed ${sz} ${BTN[tone]}`}>
      {children}
    </button>
  );
}

export function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} className="text-neutral-300 hover:text-red-500 transition text-sm px-1">{children}</button>;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`bg-white border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-ink transition font-body ${props.className ?? ""}`} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-ink transition font-body resize-none ${props.className ?? ""}`} />;
}

export function Meta({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold text-neutral-400">{children}</span>;
}

export function Section({ title, count, children, className = "" }: { title: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="text-sm font-extrabold text-neutral-500 uppercase tracking-wide mb-2.5">
        {title}{typeof count === "number" && <span className="ml-2 text-neutral-300">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

export function ApiError({ error }: { error?: string }) {
  if (!error) return null;
  return <Card tone="alert" className="px-5 py-4 text-sm font-bold text-red-600 mb-4">⚠️ {error}</Card>;
}

export function Loading() {
  return <p className="text-sm font-bold text-neutral-400 animate-pulse py-12 text-center">Chargement…</p>;
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1.5 bg-neutral-200/60 rounded-full p-1 w-fit mb-5">
      {items.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`text-xs font-bold px-4 py-2 rounded-full transition ${value === t.id ? "bg-white shadow text-ink" : "text-neutral-500 hover:text-ink"}`}>
          {t.label}{typeof t.count === "number" && t.count > 0 && <span className="ml-1.5 text-coral">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR");
export const fmtDateTime = (d: string) => new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
