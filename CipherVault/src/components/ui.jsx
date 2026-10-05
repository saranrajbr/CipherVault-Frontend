/** Small presentational primitives shared by every workspace. */

import React from 'react'

/**
 * Map a backend security_status onto badge colours.
 * Colour here is semantic, never decorative.
 */
const STATUS_STYLES = {
  recommended: {
    label: 'Recommended',
    chip: 'border-good/35 bg-good/10 text-good',
    dot: 'bg-good',
  },
  encoding: {
    label: 'Encoding',
    chip: 'border-accent/35 bg-accent/10 text-accent',
    dot: 'bg-accent',
  },
  educational: {
    label: 'Educational',
    chip: 'border-warn/35 bg-warn/10 text-warn',
    dot: 'bg-warn',
  },
  legacy: {
    label: 'Legacy',
    chip: 'border-warn/35 bg-warn/10 text-warn',
    dot: 'bg-warn',
  },
  broken: {
    label: 'Broken',
    chip: 'border-danger/35 bg-danger/10 text-danger',
    dot: 'bg-danger',
  },
}

/**
 * Render the security status badge for an algorithm.
 *
 * @param {{status: string, label?: string, className?: string}} props
 */
export function StatusBadge({ status, label, className = '' }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.encoding
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${style.chip} ${className}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full ${style.dot}`} />
      {label ?? style.label}
    </span>
  )
}

/**
 * Prominent inline warning used for insecure or disabled algorithms.
 *
 * @param {{title: string, children: React.ReactNode, tone?: 'warn'|'danger'}} props
 */
export function SecurityNotice({ title, children, tone = 'warn' }) {
  const toneClasses =
    tone === 'danger'
      ? 'border-danger/30 bg-danger/8 text-danger'
      : 'border-warn/30 bg-warn/8 text-warn'
  const iconClasses = tone === 'danger' ? 'text-danger' : 'text-warn'
  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClasses}`} role="note">
      <div className="flex gap-3">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`mt-0.5 size-4 shrink-0 ${iconClasses}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <div className="mt-1 text-sm leading-relaxed text-ink-muted">{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Bordered card with an optional heading, used to group related controls.
 *
 * @param {{title?: string, description?: string, actions?: React.ReactNode, children: React.ReactNode, className?: string}} props
 */
export function Panel({ title, description, actions, children, className = '' }) {
  return (
    <section className={`rounded-card border border-line bg-surface ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-ink-faint">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

/**
 * Labelled form control wrapper. Keeps label, hint and error spacing uniform.
 *
 * @param {{label: string, hint?: string, error?: string, htmlFor?: string, children: React.ReactNode, className?: string}} props
 */
export function Field({ label, hint, error, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {label}
        </label>
        {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}

/** Shared input and textarea classes so every field matches exactly. */
export const controlClass =
  'w-full rounded-lg border border-line-strong bg-inset px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-accent/50 focus:border-accent focus:outline-none'

/**
 * Read-only output surface for a result value.
 *
 * @param {{value: string, placeholder?: string, rows?: number, mono?: boolean}} props
 */
export function OutputBlock({ value, placeholder = 'Result appears here.', rows = 5, mono = true }) {
  return (
    <div
      className={`w-full overflow-x-auto rounded-lg border border-line bg-inset px-3 py-2.5 text-sm break-all whitespace-pre-wrap ${
        mono ? 'font-mono' : 'font-sans'
      }`}
      style={{ minHeight: `${rows * 1.5}rem` }}
      aria-live="polite"
      aria-atomic="true"
    >
      {value ? <span className="text-ink">{value}</span> : <span className="text-ink-faint">{placeholder}</span>}
    </div>
  )
}

/**
 * Primary / secondary / ghost button set with consistent focus and disabled
 * behaviour. All buttons are real <button> elements for keyboard support.
 */
export function Button({ variant = 'primary', loading = false, icon, children, className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50'
  const variants = {
    primary: 'bg-accent text-canvas hover:bg-accent/85 active:scale-[0.98]',
    secondary: 'border border-line-strong bg-raised text-ink hover:border-accent/60 hover:bg-overlay',
    ghost: 'text-ink-muted hover:bg-raised hover:text-ink',
    danger: 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/15',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

/** Indeterminate loading indicator. */
export function Spinner({ className = 'size-3.5' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`cf-spin ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  )
}

/**
 * Copy-to-clipboard button with a transient confirmation state.
 *
 * @param {{value: string, label?: string, disabled?: boolean}} props
 */
export function CopyButton({ value, label = 'Copy', disabled = false }) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Clipboard can be blocked by permissions or an insecure context. Select
      // the text instead so the action is never silently lost.
      const area = document.createElement('textarea')
      area.value = value
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      try {
        document.execCommand('copy')
      } catch {
        document.body.removeChild(area)
        return
      }
      document.body.removeChild(area)
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Button variant="secondary" onClick={handleCopy} disabled={disabled || !value}>
      {copied ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 text-good" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m20 6-11 11-5-5" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="12" height="12" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
      {copied ? 'Copied' : label}
    </Button>
  )
}

/**
 * Error banner for API and validation failures.
 *
 * @param {{error: {code?: string, message: string}|null}} props
 */
export function ErrorBanner({ error }) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="cf-enter flex gap-3 rounded-lg border border-danger/35 bg-danger/10 px-4 py-3 text-sm"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="mt-0.5 size-4 shrink-0 text-danger"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <div className="min-w-0">
        <p className="text-danger">{error.message}</p>
        {error.code && (
          <p className="mt-1 font-mono text-[11px] tracking-wide text-ink-muted uppercase">{error.code}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Segmented operation switch (Encode / Decode, Encrypt / Decrypt).
 *
 * @param {{options: {id: string, label: string}[], value: string, onChange: (id: string) => void, disabled?: boolean}} props
 */
export function OperationTabs({ options, value, onChange, disabled = false }) {
  return (
    <div role="tablist" aria-label="Operation" className="inline-flex w-full gap-1 rounded-lg border border-line bg-inset p-1 sm:w-auto">
      {options.map((option) => {
        const active = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none ${
              active ? 'bg-raised text-ink shadow-sm' : 'text-ink-faint hover:text-ink-muted'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Render the security information panel for an algorithm.
 *
 * @param {{securityInfo: Record<string, unknown>, status: string}} props
 */
export function SecurityInfoPanel({ securityInfo, status }) {
  if (!securityInfo) return null

  const rows = [
    ['Type', securityInfo.type],
    ['Key size', securityInfo.key_size],
    ['Nonce size', securityInfo.nonce_size],
    ['Mode', securityInfo.mode],
    ['Block size', securityInfo.block_size],
    ['Digest size', securityInfo.digest_size],
    ['Padding', securityInfo.padding],
    ['Authenticated', securityInfo.authenticated === undefined ? undefined : securityInfo.authenticated ? 'Yes' : 'No'],
    ['Encryption', securityInfo.encryption === undefined ? undefined : securityInfo.encryption ? 'Yes' : 'No'],
  ].filter(([, value]) => value)

  return (
    <Panel title="Security information" className="h-fit">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <span className="text-xs tracking-wide text-ink-muted uppercase">Status</span>
          <StatusBadge status={status} />
        </div>

        {rows.length > 0 && (
          <dl className="space-y-2">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4">
                <dt className="shrink-0 text-xs tracking-wide text-ink-faint uppercase">{label}</dt>
                <dd className="text-right text-sm text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {Array.isArray(securityInfo.provides) && securityInfo.provides.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs tracking-wide text-ink-faint uppercase">Provides</p>
            <ul className="space-y-1">
              {securityInfo.provides.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-ink-muted">
                  <span aria-hidden="true" className="text-good">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(securityInfo.not_provided) && securityInfo.not_provided.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs tracking-wide text-ink-faint uppercase">Does not provide</p>
            <ul className="space-y-1">
              {securityInfo.not_provided.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-ink-muted">
                  <span aria-hidden="true" className="text-danger">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {securityInfo.warning && (
          <SecurityNotice title={status === 'broken' || status === 'legacy' ? 'Not recommended' : 'Important'}>
            {securityInfo.warning}
          </SecurityNotice>
        )}

        {securityInfo.notes && <p className="border-t border-line pt-3 text-xs leading-relaxed text-ink-faint">{securityInfo.notes}</p>}
      </div>
    </Panel>
  )
}

