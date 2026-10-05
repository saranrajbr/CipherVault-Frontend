/**
 * bcrypt workspace.
 *
 * Split into two halves: generate a hash, and verify an existing hash. The
 * password is sent once and never returned, so the UI never needs to hold it
 * after a request completes.
 */

import React from 'react'
import { runHash, verifyBcrypt } from '../../api/client.js'
import { useApiCall } from '../../hooks/useApiCall.js'
import { ResultView } from '../ResultView.jsx'
import { Button, ErrorBanner, Field, SecurityNotice, controlClass } from '../ui.jsx'

/** bcrypt only processes the first 72 bytes of a password. */
const BCRYPT_MAX_BYTES = 72

/**
 */
export function BcryptWorkspace() {
  const [password, setPassword] = React.useState('')
  const [workFactor, setWorkFactor] = React.useState(12)
  const [hash, setHash] = React.useState('')
  const [verifyPassword, setVerifyPassword] = React.useState('')
  const [verifyHash, setVerifyHash] = React.useState('')
  const [verdict, setVerdict] = React.useState(null)
  const [formError, setFormError] = React.useState(null)

  const hashRun = useApiCall((body, signal) => runHash(body, signal))
  const verifyRun = useApiCall((body, signal) => verifyBcrypt(body, signal))

  async function handleHash(event) {
    event.preventDefault()
    setVerdict(null)
    const problem = passwordProblem(password)
    if (problem) {
      setFormError(problem)
      return
    }
    setFormError(null)
    const response = await hashRun.execute({ algorithm: 'bcrypt', operation: 'generate', input: password, work_factor: workFactor })
    if (response) {
      setHash(response.hash)
      setVerifyHash(response.hash)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    const problem = passwordProblem(verifyPassword)
    if (problem) {
      setFormError(problem)
      hashRun.clear()
      setVerdict({ ok: false, message: problem })
      return
    }
    setFormError(null)
    setVerdict(null)
    const response = await verifyRun.execute({ password: verifyPassword, hash: verifyHash })
    if (response) {
      setVerdict(
        response.verified
          ? { ok: true, message: 'Password matches the supplied hash.' }
          : { ok: false, message: 'Password does not match the supplied hash.' },
      )
    }
  }

  function handleClear() {
    setPassword('')
    setHash('')
    setVerifyPassword('')
    setVerdict(null)
    setFormError(null)
    hashRun.clear()
    verifyRun.clear()
  }

  return (
    <div className="space-y-6">
      <form className="space-y-5" onSubmit={handleHash} noValidate>
        <Field label="Password" htmlFor="bcrypt-password" error={formError ?? undefined} hint={`Max ${BCRYPT_MAX_BYTES} bytes`}>
          <input
            id="bcrypt-password"
            type="password"
            className={controlClass}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter a password to hash"
            autoComplete="new-password"
            disabled={hashRun.loading}
          />
        </Field>

        <Field label="Work factor" htmlFor="bcrypt-cost" hint="4 to 31, higher is slower and safer">
          <input
            id="bcrypt-cost"
            type="number"
            className={controlClass}
            value={workFactor}
            onChange={(event) => setWorkFactor(Number(event.target.value))}
            min={4}
            max={31}
            step={1}
            disabled={hashRun.loading}
          />
        </Field>

        <Button type="submit" loading={hashRun.loading} disabled={password.length === 0}>
          Generate hash
        </Button>

        <ErrorBanner error={hashRun.error} />

        <ResultView
          value={hash}
          placeholder="The bcrypt hash will appear here."
          onClear={handleClear}
          note="The cost factor is stored inside the hash, so you can raise it later and old hashes still verify."
        />
      </form>

      <div className="border-t border-line pt-6">
        <h3 className="mb-1 text-sm font-semibold text-ink">Verify an existing hash</h3>
        <p className="mb-4 text-xs text-ink-faint">
          Paste any bcrypt hash, such as one generated above, then check whether a password matches it.
        </p>

        <form className="space-y-5" onSubmit={handleVerify} noValidate>
          <Field label="Password" htmlFor="bcrypt-verify-password">
            <input
              id="bcrypt-verify-password"
              type="password"
              className={controlClass}
              value={verifyPassword}
              onChange={(event) => setVerifyPassword(event.target.value)}
              placeholder="Password to check"
              autoComplete="current-password"
              disabled={verifyRun.loading}
            />
          </Field>

          <Field label="bcrypt hash" htmlFor="bcrypt-verify-hash">
            <input
              id="bcrypt-verify-hash"
              className={controlClass}
              value={verifyHash}
              onChange={(event) => setVerifyHash(event.target.value)}
              placeholder="$2b$12$..."
              spellCheck={false}
              autoComplete="off"
              disabled={verifyRun.loading}
            />
          </Field>

          <Button type="submit" loading={verifyRun.loading} disabled={!verifyPassword || !verifyHash}>
            Verify
          </Button>

          <ErrorBanner error={verifyRun.error} />

          {verdict && (
            <div
              role="status"
              className={`cf-enter flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                verdict.ok
                  ? 'border-good/35 bg-good/10 text-good'
                  : 'border-danger/35 bg-danger/10 text-danger'
              }`}
            >
              <span aria-hidden="true" className="font-semibold">
                {verdict.ok ? '✓' : '✕'}
              </span>
              {verdict.message}
            </div>
          )}
        </form>
      </div>

      <SecurityNotice title="Passwords are never stored">
        The plaintext password is used for a single request, then discarded. CipherForge never logs passwords, never
        returns them, and has no database. bcrypt is the only algorithm here intended for passwords, because it is
        deliberately slow and salts every hash automatically.
      </SecurityNotice>
    </div>
  )
}

/**
 * Validate a password against bcrypt's 72-byte input limit.
 *
 * @param {string} value
 * @returns {string|null} error message, or null when acceptable
 */
function passwordProblem(value) {
  if (!value) return 'Enter a password first.'
  const bytes = new TextEncoder().encode(value).length
  if (bytes > BCRYPT_MAX_BYTES) {
    return `Password is ${bytes} bytes. bcrypt only processes the first ${BCRYPT_MAX_BYTES} bytes.`
  }
  return null
}