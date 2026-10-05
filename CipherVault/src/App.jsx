/**
 * CipherForge single-page application.
 *
 * The whole interface is driven by GET /api/algorithms: category tabs,
 * the algorithm rail, operation toggles, security badges and the information
 * panel all come from the backend catalogue, so no algorithm definition is
 * duplicated on the client.
 */

import React from 'react'
import { fetchAlgorithms } from './api/client.js'
import { BasicWorkspace } from './components/workspaces/BasicWorkspace.jsx'
import { BcryptWorkspace } from './components/workspaces/BcryptWorkspace.jsx'
import { CaesarWorkspace } from './components/workspaces/CaesarWorkspace.jsx'
import { DesWorkspace } from './components/workspaces/DesWorkspace.jsx'
import { RsaWorkspace } from './components/workspaces/RsaWorkspace.jsx'
import { SymmetricWorkspace } from './components/workspaces/SymmetricWorkspace.jsx'
import { Button, ErrorBanner, Panel, SecurityInfoPanel, Spinner, StatusBadge } from './components/ui.jsx'

const CATEGORY_LABELS = {
  encode: 'Encode',
  encryption: 'Encryption',
  hash: 'Hash',
}

/** Human labels for backend operation identifiers. */
const OPERATION_LABELS = {
  encode: 'Encode',
  decode: 'Decode',
  encrypt: 'Encrypt',
  decrypt: 'Decrypt',
  generate: 'Generate',
  verify: 'Verify',
  generate_key_pair: 'Generate Key Pair',
}

export default function App() {
  const [catalog, setCatalog] = React.useState(null)
  const [loadError, setLoadError] = React.useState(null)
  const [category, setCategory] = React.useState('encode')
  const [algorithmId, setAlgorithmId] = React.useState('base64')
  const [operation, setOperation] = React.useState('encode')

  // Load the catalogue once. An AbortController prevents a state update after
  // unmount during React StrictMode's double effect invocation.
  React.useEffect(() => {
    const controller = new AbortController()
    fetchAlgorithms(controller.signal)
      .then((data) => {
        setCatalog(data)
        const first = data.encode?.[0]
        if (first) {
          setAlgorithmId(first.id)
          setOperation(first.default_operation ?? first.operations[0])
        }
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setLoadError(error)
      })
    return () => controller.abort()
  }, [])

  function handleCategoryChange(next) {
    setCategory(next)
    const first = catalog?.[next]?.[0]
    if (first) {
      setAlgorithmId(first.id)
      setOperation(first.default_operation ?? first.operations[0])
    }
  }

  function handleAlgorithmChange(next) {
    setAlgorithmId(next)
    const entry = catalog?.[category]?.find((item) => item.id === next)
    setOperation(entry?.default_operation ?? entry?.operations?.[0] ?? 'encode')
  }

  if (loadError) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas px-6">
        <div className="w-full max-w-md space-y-4">
          <ErrorBanner error={{ code: loadError.code, message: loadError.message }} />
          <p className="text-center text-sm text-ink-faint">
            Start the backend with{' '}
            <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-xs text-ink-muted">
              uvicorn app.main:app --reload
            </code>{' '}
            from the backend directory, then reload this page.
          </p>
          <Button variant="secondary" className="w-full" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </main>
    )
  }

  if (!catalog) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-ink-muted">
          <Spinner className="size-4" />
          <span className="text-sm">Loading algorithm catalogue</span>
        </div>
      </main>
    )
  }

  const algorithms = catalog[category] ?? []
  const algorithm = algorithms.find((item) => item.id === algorithmId) ?? algorithms[0]

  return (
    <div className="min-h-dvh bg-canvas">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <CategoryTabs categories={catalog.categories} active={category} onChange={handleCategoryChange} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_1fr] lg:items-start">
          <AlgorithmRail algorithms={algorithms} activeId={algorithm.id} onChange={handleAlgorithmChange} />
          <Workspace algorithm={algorithm} operation={operation} onOperationChange={setOperation} />
        </div>
      </main>

      <Footer />
    </div>
  )
}

/** Wordmark and tagline. */
function Header() {
  return (
    <header className="border-b border-line bg-surface/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg border border-accent/40 bg-accent/10">
            <svg viewBox="0 0 24 24" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-[0.18em] text-ink uppercase sm:text-2xl">CipherForge</h1>
            <p className="text-xs tracking-[0.22em] text-ink-faint uppercase">Encode. Encrypt. Hash.</p>
          </div>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
          An educational cryptography toolkit. Every primitive comes from{' '}
          <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-xs text-ink-muted">cryptography</code> and{' '}
          <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-xs text-ink-muted">bcrypt</code>; keys and
          nonces come from the operating system CSPRNG. Legacy algorithms are labelled, not hidden.
        </p>
      </div>
    </header>
  )
}

/**
 * Prominent category switcher.
 *
 * @param {{categories: string[], active: string, onChange: (id: string) => void}} props
 */
function CategoryTabs({ categories, active, onChange }) {
  return (
    <nav aria-label="Categories" className="mt-8">
      <div role="tablist" className="grid grid-cols-3 gap-2 rounded-card border border-line bg-surface p-1.5 sm:inline-grid sm:auto-cols-fr">
        {categories.map((id) => {
          const isActive = id === active
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(id)}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold tracking-[0.12em] uppercase transition-all duration-150 ${
                isActive ? 'bg-accent text-canvas' : 'text-ink-muted hover:bg-raised hover:text-ink'
              }`}
            >
              {CATEGORY_LABELS[id] ?? id}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/**
 * Vertical list of the algorithms in the active category.
 *
 * @param {{algorithms: object[], activeId: string, onChange: (id: string) => void}} props
 */
function AlgorithmRail({ algorithms, activeId, onChange }) {
  return (
    <Panel title="Algorithms" className="lg:sticky lg:top-6">
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        {algorithms.map((entry) => {
          const isActive = entry.id === activeId
          return (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onChange(entry.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
                  isActive
                    ? 'border-accent/60 bg-accent/10'
                    : 'border-line bg-inset hover:border-accent/50 hover:bg-raised'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-sm font-medium ${isActive ? 'text-ink' : 'text-ink-muted'}`}>{entry.name}</span>
                  {entry.disabled && <StatusBadge status="legacy" label="Disabled" />}
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-faint">{entry.description}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

/**
 * Render the workspace matching the selected algorithm.
 *
 * @param {{algorithm: object, operation: string, onOperationChange: (id: string) => void}} props
 */
function Workspace({ algorithm, operation, onOperationChange }) {
  const operationLabel = OPERATION_LABELS[operation] ?? operation

  return (
    <div className="cf-enter space-y-6" key={algorithm.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{algorithm.name}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">{algorithm.description}</p>
        </div>
        <StatusBadge status={algorithm.security_status} />
      </div>

      {algorithm.disabled ? (
        <DesWorkspace algorithm={algorithm} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_18rem] xl:items-start">
          <div className="rounded-card border border-line bg-surface p-5">
            <p className="mb-4 text-xs tracking-wide text-ink-faint uppercase">
              Operation: <span className="text-ink-muted">{operationLabel}</span>
            </p>
            <AlgorithmForm algorithm={algorithm} operation={operation} onOperationChange={onOperationChange} />
          </div>

          <SecurityInfoPanel securityInfo={algorithm.security_info} status={algorithm.security_status} />
        </div>
      )}
    </div>
  )
}

/**
 * Route to the workspace implementation for an algorithm.
 *
 * @param {{algorithm: object, operation: string, onOperationChange: (id: string) => void}} props
 */
function AlgorithmForm({ algorithm, operation, onOperationChange }) {
  if (algorithm.id === 'bcrypt') return <BcryptWorkspace />
  if (algorithm.id === 'rsa') return <RsaWorkspace operation={operation} onOperationChange={onOperationChange} />
  if (algorithm.id === 'caesar') return <CaesarWorkspace operation={operation} onOperationChange={onOperationChange} />
  if (algorithm.id === 'aes' || algorithm.id === 'chacha20') {
    return <SymmetricWorkspace algorithm={algorithm} operation={operation} onOperationChange={onOperationChange} />
  }
  return <BasicWorkspace algorithm={algorithm} operation={operation} onOperationChange={onOperationChange} />
}

function Footer() {
  return (
    <footer className="border-t border-line bg-surface/60">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-xs text-ink-faint sm:px-6 lg:px-8">
        <p>CipherForge. Educational cryptography toolkit built with FastAPI and React.</p>
      </div>
    </footer>
  )
}