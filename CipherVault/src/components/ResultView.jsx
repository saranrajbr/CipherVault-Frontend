/**
 * Result surface shared by every workspace: displays the latest successful
 * value, plus Copy and Clear affordances and optional extra fields.
 */

import { Button, CopyButton, OutputBlock } from './ui.jsx'

/**
 * @param {{
 *   value: string,
 *   placeholder?: string,
 *   onClear: () => void,
 *   title?: string,
 *   extra?: Array<{label: string, value: string, copyable?: boolean, rows?: number}>,
 *   note?: string|null,
 * }} props
 */
export function ResultView({ value, placeholder, onClear, title = 'Output', extra = [], note }) {
  const hasResult = Boolean(value) || extra.some((item) => item.value)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-medium tracking-wide text-ink-muted uppercase">{title}</h3>
        {hasResult && (
          <div className="flex items-center gap-2">
            <CopyButton value={value || extra.map((item) => item.value).join('\n\n')} />
            <Button variant="ghost" icon={<TrashIcon />} onClick={onClear}>
              Clear
            </Button>
          </div>
        )}
      </div>

      <OutputBlock value={value} placeholder={placeholder} />

      {extra.length > 0 && (
        <div className="grid gap-3">
          {extra.map((item) =>
            item.value ? (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-xs font-medium tracking-wide text-ink-faint uppercase">{item.label}</span>
                  {item.copyable && <CopyButton value={item.value} label="Copy" />}
                </div>
                <OutputBlock value={item.value} rows={item.rows ?? 3} />
              </div>
            ) : null,
          )}
        </div>
      )}

      {note && (
        <p className="flex gap-2 rounded-lg border border-line bg-raised/60 px-3 py-2 text-xs leading-relaxed text-ink-muted">
          <span aria-hidden="true" className="text-accent">
            i
          </span>
          {note}
        </p>
      )}
    </div>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
    </svg>
  )
}