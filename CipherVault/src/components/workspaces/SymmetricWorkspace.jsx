/**
 * Workspace for authenticated symmetric ciphers (AES-256-GCM and
 * ChaCha20-Poly1305).
 *
 * Both share an identical shape: encrypt generates a key and nonce server side
 * and returns them; decrypt takes the ciphertext, key and nonce the user holds.
 */

import React from 'react'
import { runEncryption } from '../../api/client.js'
import { useApiCall, validateTextSize } from '../../hooks/useApiCall.js'
import { ResultView } from '../ResultView.jsx'
import { Button, ErrorBanner, Field, OperationTabs, controlClass } from '../ui.jsx'

/**
 * @param {{algorithm: object, operation: string, onOperationChange: (id: string) => void}} props
 */
export function SymmetricWorkspace({ algorithm, operation, onOperationChange }) {
  const [input, setInput] = React.useState('')
  const [ciphertext, setCiphertext] = React.useState('')
  const [key, setKey] = React.useState('')
  const [nonce, setNonce] = React.useState('')
  const [note, setNote] = React.useState(null)
  const [sizeError, setSizeError] = React.useState(null)

  const run = useApiCall((body, signal) => runEncryption(body, signal))

  const isEncrypt = operation === 'encrypt'

  async function handleSubmit(event) {
    event.preventDefault()
    setNote(null)

    const body = { algorithm: algorithm.id, operation }

    if (isEncrypt) {
      const problem = validateTextSize(input)
      setSizeError(problem)
      if (problem) return
      body.input = input
    } else {
      if (!ciphertext.trim() || !key.trim() || !nonce.trim()) {
        run.clear()
        setSizeError('Ciphertext, key and nonce are all required to decrypt.')
        return
      }
      setSizeError(null)
      body.ciphertext = ciphertext
      body.key = key
      body.nonce = nonce
    }

    const response = await run.execute(body)

    if (!response) return

    if (isEncrypt) {
      // Carry the freshly generated parameters into the decrypt form so the
      // round trip can be verified without copying anything by hand.
      setCiphertext(response.ciphertext)
      setKey(response.key)
      setNonce(response.nonce)
      setNote('A fresh key and nonce were generated for this message. Switch to Decrypt to read it back.')
    } else {
      setInput(response.output)
      setNote('Authentication passed, so this ciphertext was not modified in transit.')
    }
  }

  function handleClear() {
    setInput('')
    setCiphertext('')
    setKey('')
    setNonce('')
    setNote(null)
    setSizeError(null)
    run.clear()
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <OperationTabs
        value={operation}
        onChange={onOperationChange}
        options={[
          { id: 'encrypt', label: 'Encrypt' },
          { id: 'decrypt', label: 'Decrypt' },
        ]}
      />

      {isEncrypt ? (
        <Field label="Plaintext" htmlFor={`${algorithm.id}-input`} error={sizeError ?? undefined} hint="Up to 1 MB">
          <textarea
            id={`${algorithm.id}-input`}
            className={controlClass}
            rows={5}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Text to encrypt"
            spellCheck={false}
            disabled={run.loading}
          />
        </Field>
      ) : (
        <>
          <Field label="Ciphertext" htmlFor={`${algorithm.id}-ciphertext`} error={sizeError ?? undefined} hint="Base64">
            <textarea
              id={`${algorithm.id}-ciphertext`}
              className={controlClass}
              rows={4}
              value={ciphertext}
              onChange={(event) => setCiphertext(event.target.value)}
              placeholder="Base64 ciphertext, including the authentication tag"
              spellCheck={false}
              disabled={run.loading}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Key" htmlFor={`${algorithm.id}-key`} hint="32 bytes, hexadecimal">
              <input
                id={`${algorithm.id}-key`}
                className={controlClass}
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="64 hexadecimal characters"
                spellCheck={false}
                autoComplete="off"
                disabled={run.loading}
              />
            </Field>
            <Field label="Nonce" htmlFor={`${algorithm.id}-nonce`} hint="12 bytes, hexadecimal">
              <input
                id={`${algorithm.id}-nonce`}
                className={controlClass}
                value={nonce}
                onChange={(event) => setNonce(event.target.value)}
                placeholder="24 hexadecimal characters"
                spellCheck={false}
                autoComplete="off"
                disabled={run.loading}
              />
            </Field>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={run.loading}>
          {isEncrypt ? 'Encrypt' : 'Decrypt'}
        </Button>
        <span className="text-xs text-ink-faint">
          {isEncrypt
            ? 'A 256-bit key and a random 96-bit nonce are generated for every message.'
            : 'The authentication tag is verified, so any tampering fails the request.'}
        </span>
      </div>

      <ErrorBanner error={run.error} />

      <ResultView
        value={isEncrypt ? ciphertext : input}
        placeholder="The result will appear here."
        onClear={handleClear}
        note={note}
        extra={isEncrypt ? [{ label: 'Key (hex)', value: key }, { label: 'Nonce (hex)', value: nonce }] : []}
      />
    </form>
  )
}