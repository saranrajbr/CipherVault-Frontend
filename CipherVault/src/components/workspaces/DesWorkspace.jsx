/**
 * DES placeholder workspace.
 *
 * DES is shown so the reason it is obsolete is visible, but there is no input
 * form and no Execute button. The backend independently refuses DES requests,
 * so this screen cannot be used even by bypassing the disabled controls.
 */

import { SecurityNotice, StatusBadge } from '../ui.jsx'

/** Facts shown alongside the warning, mirroring the backend's own metadata. */
const FACT_ROWS = [
  ['Type', 'Symmetric block cipher'],
  ['Key size', '56-bit effective'],
  ['Block size', '64-bit'],
  ['Why it fails', 'The 56-bit key space can be brute-forced in hours on commodity hardware'],
  ['Known attacks', 'Analytic differential cryptanalysis'],
  ['Replace with', 'AES-256-GCM'],
]

/**
 * @param {{algorithm: object}} props
 */
export function DesWorkspace({ algorithm }) {
  const info = algorithm.security_info ?? {}

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-card border border-warn/30 bg-warn/8 px-4 py-4">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0 text-warn" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="3" y="10" width="18" height="10" rx="2" />
          <path d="M7 10V7a5 5 0 0 1 10 0v3M12 15v2" />
        </svg>
        <div>
          <p className="text-lg font-semibold text-ink">Legacy algorithm</p>
          <p className="text-sm text-ink-muted">DES is not recommended for modern security.</p>
        </div>
      </div>

      <SecurityNotice title="Encryption disabled" tone="danger">
        DES execution is turned off in CipherForge, in the frontend and in the API. Its 56-bit effective key size makes
        it trivially brute-forceable, so presenting it as usable would be misleading. Use AES-256-GCM instead.
      </SecurityNotice>

      <div className="rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">Why DES is insecure</h3>
          <StatusBadge status="legacy" />
        </div>
        <dl className="divide-y divide-line">
          {FACT_ROWS.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <dt className="shrink-0 text-xs tracking-wide text-ink-faint uppercase sm:w-40">{label}</dt>
              <dd className="text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {info.warning && (
        <p className="rounded-lg border border-line bg-raised/60 px-4 py-3 text-sm leading-relaxed text-ink-muted">
          {info.warning}
        </p>
      )}

      {info.notes && <p className="text-xs leading-relaxed text-ink-faint">{info.notes}</p>}
    </div>
  )
}