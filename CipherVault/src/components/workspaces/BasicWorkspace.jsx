/**
 * Workspaces for the algorithms that need only an input, a submit action and a
 * result: Base64, hexadecimal, and the SHA-2 / MD5 / bcrypt digests.
 */

import React from 'react'
import { runEncode, runHash } from '../../api/client.js'
import { useApiCall, validateTextSize } from '../../hooks/useApiCall.js'
import { ResultView } from '../ResultView.jsx'
import { Button, ErrorBanner, Field, OperationTabs, controlClass } from '../ui.jsx'

/** Placeholder copy per encoding, so the field explains both directions. */
const ENCODE_HINTS = {
  base64: 'Text to encode, or Base64 to decode',
  hex: 'Text to encode, or hexadecimal to decode',
}

/**
 * Encode / hash workspace.
 *
 * @param {{algorithm: object, operation: string, onOperationChange: (id: string) => void}} props
 */
export function BasicWorkspace({ algorithm, operation, onOperationChange }) {
  const [value, setValue] = React.useState('')
  const [result, setResult] = React.useState('')
  const [sizeError, setSizeError] = React.useState(null)

  const run = useApiCall(async (text, signal) => {
    if (algorithm.category === 'encode') {
      return runEncode({ algorithm: algorithm.id, operation, input: text }, signal)
    }
    return runHash({ algorithm: algorithm.id, operation: 'generate', input: text }, signal)
  })

  const isEncode = algorithm.category === 'encode'
  const operations = algorithm.operations ?? []
  const inputLabel = isEncode ? 'Input' : 'Input'
  const outputLabel = isEncode ? 'Output' : algorithm.id === 'bcrypt' ? 'bcrypt hash' : 'Hash'

  async function handleSubmit(event) {
    event.preventDefault()
    const problem = validateTextSize(value)
    setSizeError(problem)
    if (problem) return
    const response = await run.execute(value)
    if (response) setResult(response.output ?? response.hash ?? '')
  }

  function handleClear() {
    setValue('')
    setResult('')
    setSizeError(null)
    run.clear()
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {operations.length > 1 && (
        <OperationTabs
          value={operation}
          onChange={onOperationChange}
          options={operations.map((id) => ({ id, label: id === 'encode' ? 'Encode' : 'Decode' }))}
        />
      )}

      <Field
        label={inputLabel}
        htmlFor={`${algorithm.id}-input`}
        error={sizeError ?? undefined}
        hint={isEncode ? 'Up to 1 MB' : undefined}
      >
        <textarea
          id={`${algorithm.id}-input`}
          className={controlClass}
          rows={6}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={isEncode ? ENCODE_HINTS[algorithm.id] : 'Text to hash'}
          spellCheck={false}
          autoComplete={algorithm.id === 'bcrypt' ? 'new-password' : 'off'}
          disabled={run.loading}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" loading={run.loading} disabled={value.length === 0}>
          {isEncode ? 'Execute' : 'Generate hash'}
        </Button>
        <span className="text-xs text-ink-faint">
          {isEncode
            ? `Performing a ${operation} on ${algorithm.name}.`
            : algorithm.id === 'bcrypt'
              ? 'bcrypt salts every password automatically. The plaintext is never returned.'
              : 'Output is lowercase hexadecimal.'}
        </span>
      </div>

      <ErrorBanner error={run.error} />

      <ResultView
        value={result}
        title={outputLabel}
        placeholder="The result will appear here."
        onClear={handleClear}
        extra={
          algorithm.id === 'bcrypt' && result
            ? [{ label: 'Work factor', value: resultWorkFactor(result), rows: 1 }]
            : []
        }
      />
    </form>
  )
}

/**
 * Read the cost factor straight out of the bcrypt hash prefix ($2b$12$...).
 *
 * @param {string} hash
 * @returns {string}
 */
function resultWorkFactor(hash) {
  const match = /^\$2[aby]\$(\d{2})\$/.exec(hash)
  return match ? `Cost factor ${match[1]} (encoded in the hash prefix $2b$${match[1]}$)` : 'Unknown'
}