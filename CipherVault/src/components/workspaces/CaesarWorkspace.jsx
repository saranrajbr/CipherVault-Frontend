/**
 * Caesar cipher workspace. Deliberately framed as a teaching tool.
 */

import React from 'react'
import { runEncryption } from '../../api/client.js'
import { useApiCall, validateTextSize } from '../../hooks/useApiCall.js'
import { ResultView } from '../ResultView.jsx'
import { Button, ErrorBanner, Field, OperationTabs, SecurityNotice, controlClass } from '../ui.jsx'

/**
 * @param {{operation: string, onOperationChange: (id: string) => void}} props
 */
export function CaesarWorkspace({ operation, onOperationChange }) {
  const [input, setInput] = React.useState('')
  const [shift, setShift] = React.useState(3)
  const [output, setOutput] = React.useState('')
  const [formError, setFormError] = React.useState(null)

  const run = useApiCall((body, signal) => runEncryption(body, signal))
  const isEncrypt = operation === 'encrypt'

  async function handleSubmit(event) {
    event.preventDefault()

    const problem = validateTextSize(input)
    if (problem) {
      setFormError(problem)
      return
    }
    if (!Number.isFinite(shift)) {
      setFormError('Shift must be a number.')
      return
    }
    setFormError(null)

    const response = await run.execute({ algorithm: 'caesar', operation, input, shift })
    if (response) setOutput(response.output ?? '')
  }

  function handleClear() {
    setInput('')
    setOutput('')
    setFormError(null)
    run.clear()
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <SecurityNotice title="Educational only. Not cryptographically secure." tone="danger">
        The shift is the only secret, and there are just 25 meaningful keys. Anyone can break this with brute force or
        frequency analysis in seconds. It exists here to demonstrate a classical substitution cipher.
      </SecurityNotice>

      <OperationTabs
        value={operation}
        onChange={onOperationChange}
        options={[
          { id: 'encrypt', label: 'Encrypt' },
          { id: 'decrypt', label: 'Decrypt' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr] sm:items-start">
        <Field label="Shift" htmlFor="caesar-shift" error={formError ?? undefined}>
          <input
            id="caesar-shift"
            type="number"
            className={controlClass}
            value={shift}
            onChange={(event) => setShift(Number(event.target.value))}
            min={-25}
            max={25}
            step={1}
            disabled={run.loading}
          />
        </Field>

        <Field label={isEncrypt ? 'Plaintext' : 'Ciphertext'} htmlFor="caesar-input">
          <textarea
            id="caesar-input"
            className={controlClass}
            rows={5}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={isEncrypt ? 'Text to shift' : 'Shifted text to recover'}
            spellCheck={false}
            disabled={run.loading}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={run.loading} disabled={input.length === 0}>
          {isEncrypt ? 'Encrypt' : 'Decrypt'}
        </Button>
        <span className="text-xs text-ink-faint">Letters shift within the alphabet; case and punctuation are preserved.</span>
      </div>

      <ErrorBanner error={run.error} />

      <ResultView value={output} placeholder="The result will appear here." onClear={handleClear} />
    </form>
  )
}