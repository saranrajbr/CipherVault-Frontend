/**
 * RSA-2048 OAEP workspace: key generation, then encrypt or decrypt.
 *
 * The plaintext ceiling is surfaced in the UI because it is the single most
 * common misunderstanding about RSA.
 */

import React from 'react'
import { runEncryption } from '../../api/client.js'
import { useApiCall, validateTextSize } from '../../hooks/useApiCall.js'
import { ResultView } from '../ResultView.jsx'
import { Button, ErrorBanner, Field, OperationTabs, controlClass } from '../ui.jsx'

/** Maximum plaintext for RSA-OAEP/SHA-256 on a 2048-bit modulus. */
const MAX_PLAINTEXT_BYTES = 190

/**
 * @param {{operation: string, onOperationChange: (id: string) => void}} props
 */
export function RsaWorkspace({ operation, onOperationChange }) {
  const [publicKey, setPublicKey] = React.useState('')
  const [privateKey, setPrivateKey] = React.useState('')
  const [input, setInput] = React.useState('')
  const [ciphertext, setCiphertext] = React.useState('')
  const [note, setNote] = React.useState(null)
  const [formError, setFormError] = React.useState(null)

  const run = useApiCall((body, signal) => runEncryption(body, signal))

  // The catalogue's default operation for RSA is 'generate_key_pair'. The
  // encrypt/decrypt form therefore falls back to the encrypt view unless the
  // user explicitly asks to decrypt, and the request always carries an explicit
  // encrypt/decrypt operation rather than the catalogue default.
  const isEncrypt = operation !== 'decrypt'
  const effectiveOperation = isEncrypt ? 'encrypt' : 'decrypt'

  async function handleGenerate(event) {
    event.preventDefault()
    setNote(null)
    const response = await run.execute({ algorithm: 'rsa', operation: 'generate_key_pair', key_size: 2048 })
    if (response) {
      setPublicKey(response.public_key)
      setPrivateKey(response.private_key)
      setNote(response.work_note)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNote(null)

    const body = { algorithm: 'rsa', operation: effectiveOperation }

    if (isEncrypt) {
      if (!publicKey.trim()) {
        setFormError('Generate a key pair, or paste a public key, before encrypting.')
        return
      }
      const sizeProblem = validateTextSize(input)
      const byteCount = new TextEncoder().encode(input).length
      if (sizeProblem) {
        setFormError(sizeProblem)
        return
      }
      if (byteCount > MAX_PLAINTEXT_BYTES) {
        setFormError(
          `Plaintext is ${byteCount} bytes. A 2048-bit RSA key accepts at most ${MAX_PLAINTEXT_BYTES} bytes.`,
        )
        return
      }
      setFormError(null)
      body.input = input
      body.public_key = publicKey
    } else {
      if (!privateKey.trim() || !ciphertext.trim()) {
        setFormError('A private key and ciphertext are both required to decrypt.')
        return
      }
      setFormError(null)
      body.ciphertext = ciphertext
      body.private_key = privateKey
    }

    const response = await run.execute(body)
    if (!response) return

    if (isEncrypt) {
      setCiphertext(response.ciphertext)
      setNote('Switch to Decrypt to recover the plaintext with the private key.')
    } else {
      setInput(response.output)
      setNote('The ciphertext was decrypted with the supplied private key.')
    }
  }

  function handleClear() {
    setInput('')
    setCiphertext('')
    setNote(null)
    setFormError(null)
    run.clear()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-warn/30 bg-warn/8 px-4 py-3 text-sm">
        <p className="font-semibold text-warn">RSA is not designed for arbitrary size data.</p>
        <p className="mt-1 leading-relaxed text-ink-muted">
          A 2048-bit key with OAEP and SHA-256 accepts at most {MAX_PLAINTEXT_BYTES} bytes of plaintext. For larger
          data, generate a random symmetric key, encrypt the data with AES-256-GCM, then encrypt that key with RSA.
        </p>
      </div>

      <div>
        <Button variant="secondary" onClick={handleGenerate} loading={run.loading} icon={<KeyIcon />}>
          Generate key pair
        </Button>
        <p className="mt-2 text-xs text-ink-faint">
          Produces a fresh RSA-2048 key pair with OAEP padding. Keys are returned to you and never stored server side.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Public key" htmlFor="rsa-public" hint="PEM">
          <textarea
            id="rsa-public"
            className={`${controlClass} text-xs`}
            rows={7}
            value={publicKey}
            onChange={(event) => setPublicKey(event.target.value)}
            placeholder="-----BEGIN PUBLIC KEY-----"
            spellCheck={false}
            disabled={run.loading}
          />
        </Field>
        <Field label="Private key" htmlFor="rsa-private" hint="Keep secret">
          <textarea
            id="rsa-private"
            className={`${controlClass} text-xs`}
            rows={7}
            value={privateKey}
            onChange={(event) => setPrivateKey(event.target.value)}
            placeholder="-----BEGIN PRIVATE KEY-----"
            spellCheck={false}
            disabled={run.loading}
          />
        </Field>
      </div>

      <form className="space-y-5 border-t border-line pt-5" onSubmit={handleSubmit} noValidate>
        <OperationTabs
          value={isEncrypt ? 'encrypt' : 'decrypt'}
          onChange={onOperationChange}
          options={[
            { id: 'encrypt', label: 'Encrypt' },
            { id: 'decrypt', label: 'Decrypt' },
          ]}
        />

        {isEncrypt ? (
          <Field
            label="Plaintext"
            htmlFor="rsa-input"
            hint={`Max ${MAX_PLAINTEXT_BYTES} bytes`}
            error={formError ?? undefined}
          >
            <textarea
              id="rsa-input"
              className={controlClass}
              rows={4}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Short message, or a symmetric key to wrap"
              spellCheck={false}
              disabled={run.loading}
            />
          </Field>
        ) : (
          <Field label="Ciphertext" htmlFor="rsa-ciphertext" hint="Base64" error={formError ?? undefined}>
            <textarea
              id="rsa-ciphertext"
              className={controlClass}
              rows={4}
              value={ciphertext}
              onChange={(event) => setCiphertext(event.target.value)}
              placeholder="Base64 ciphertext"
              spellCheck={false}
              disabled={run.loading}
            />
          </Field>
        )}

        <Button type="submit" loading={run.loading}>
          {isEncrypt ? 'Encrypt' : 'Decrypt'}
        </Button>

        <ErrorBanner error={run.error} />

        <ResultView
          value={isEncrypt ? ciphertext : input}
          placeholder="The result will appear here."
          onClear={handleClear}
          note={note}
        />
      </form>
    </div>
  )
}

function KeyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.7 12.3 8.3-8.3M17 6l2.5 2.5M14.5 8.5 17 11" />
    </svg>
  )
}