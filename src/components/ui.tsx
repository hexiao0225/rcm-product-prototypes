import type { ReactNode } from 'react'
import type { Severity } from '../clinical'

export function Card({
  children,
  tint,
  flush,
  className = '',
}: {
  children: ReactNode
  tint?: boolean
  flush?: boolean
  className?: string
}) {
  return (
    <div
      className={['card', tint && 'card-tint', flush && 'card-flush', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

export function CardHead({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="card-head">
      <h3>{title}</h3>
      {aside}
    </div>
  )
}

export function Pill({ children, plain }: { children: ReactNode; plain?: boolean }) {
  return <span className={plain ? 'pill pill-plain' : 'pill'}>{children}</span>
}

export function Stat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {note && <span className="note">{note}</span>}
    </div>
  )
}

export function KV({
  k,
  v,
  total,
  hint,
}: {
  k: ReactNode
  v: ReactNode
  total?: boolean
  hint?: string
}) {
  return (
    <div className={total ? 'kv kv-total' : 'kv'}>
      <span className="kv-key">
        {k}
        {hint && (
          <span className="note" style={{ display: 'block' }}>
            {hint}
          </span>
        )}
      </span>
      <span className="kv-val">{v}</span>
    </div>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
  hint?: string
}) {
  const id = `slider-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="stack stack-2">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <label htmlFor={id} className="small strong" style={{ color: 'var(--ink-2)' }}>
          {label}
        </label>
        <span className="strong" style={{ color: 'var(--brand)' }}>
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <span className="note">{hint}</span>}
    </div>
  )
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="bullets">
      {items.map((it) => (
        <li key={it}>
          <span className="tick" aria-hidden="true">
            ✓
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

export function Numbered({ items }: { items: string[] }) {
  return (
    <ol className="numbered">
      {items.map((it) => (
        <li key={it}>{it}</li>
      ))}
    </ol>
  )
}

export function Callout({ children }: { children: ReactNode }) {
  return <div className="callout">{children}</div>
}

export function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string
  title: string
  lede?: string
}) {
  return (
    <div className="stack stack-3" style={{ maxWidth: 760 }}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {lede && (
        <p className="muted" style={{ fontSize: '1.05rem' }}>
          {lede}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Domain primitives
// ---------------------------------------------------------------------------

/** A CPT / ICD-10 / HCPCS code. Monospaced, because coders read these as tokens. */
export function Code({
  children,
  tone = 'plain',
}: {
  children: ReactNode
  tone?: 'plain' | 'add' | 'remove' | 'change'
}) {
  return <span className={`code code-${tone}`}>{children}</span>
}

const SEVERITY_LABEL: Record<Severity, string> = {
  blocker: 'Blocker',
  revenue: 'Revenue',
  compliance: 'Compliance',
  info: 'Confirmed',
}

export function SeverityTag({ severity }: { severity: Severity }) {
  return <span className={`sev sev-${severity}`}>{SEVERITY_LABEL[severity]}</span>
}

/**
 * Confidence is the whole product decision. Above the auto-apply line the
 * finding posts itself; below it, a human is required. Rendering the threshold
 * rather than just the number is the point.
 */
export function Confidence({ value, threshold }: { value: number; threshold: number }) {
  const auto = value >= threshold
  // Spans throughout: this renders inside a <button>, whose content model is
  // phrasing content only.
  return (
    <span className="conf" title={`Model confidence ${value.toFixed(2)}, auto-apply at ${threshold.toFixed(2)}`}>
      <span className="conf-track">
        <span className="conf-fill" style={{ width: `${value * 100}%` }} />
        <span className="conf-threshold" style={{ left: `${threshold * 100}%` }} />
      </span>
      <span className={auto ? 'conf-num conf-auto' : 'conf-num'}>{value.toFixed(2)}</span>
    </span>
  )
}

/** Horizontal bar for share-of-total readouts. */
export function Bar({ value, max, tone }: { value: number; max: number; tone?: 'muted' }) {
  const w = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max))
  return (
    <div className="bar">
      <div className={tone === 'muted' ? 'bar-fill bar-fill-muted' : 'bar-fill'} style={{ width: `${w * 100}%` }} />
    </div>
  )
}

/**
 * Renders a clinical note and highlights the span a finding is grounded in.
 * A coding suggestion without the sentence that produced it is unauditable,
 * and an unauditable suggestion is one a coder has to redo by hand.
 */
export function NoteBody({ text, evidence }: { text: string; evidence?: string }) {
  if (!evidence || !text.includes(evidence)) return <p className="note-text">{text}</p>
  const [before, after] = text.split(evidence)
  return (
    <p className="note-text">
      {before}
      <mark className="evidence">{evidence}</mark>
      {after}
    </p>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

/** Frames a prototype as a screen inside the product, rather than a slide about it. */
export function Device({ crumb, children, actor }: { crumb: string; children: ReactNode; actor?: string }) {
  return (
    <div className="device">
      <div className="device-bar">
        <span className="logo-mark">E</span>
        <span className="device-bar-name">Revenue integrity</span>
        <span className="device-bar-crumb">{crumb}</span>
        {actor && <span className="device-bar-actor">{actor}</span>}
      </div>
      <div className="device-body">{children}</div>
    </div>
  )
}
