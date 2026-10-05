/** Shared hook for request lifecycle: loading, error, and abort on unmount. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/client.js'

/**
 * Wrap an async API call with loading/error state and automatic cancellation.
 *
 * Any in-flight request is aborted when a new one starts or the component
 * unmounts, so a slow response can never overwrite a newer result.
 *
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} run
 * @returns {{execute: (...args: unknown[]) => Promise<T|undefined>, loading: boolean, error: object|null, clear: () => void}}
 */
export function useApiCall(run) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const controllerRef = useRef(null)
  const mountedRef = useRef(true)
  const runRef = useRef(run)

  useEffect(() => {
    runRef.current = run
  }, [run])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const execute = useCallback(async (...args) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const result = await runRef.current(...args, controller.signal)
      if (controller.signal.aborted) return undefined
      return result
    } catch (caught) {
      if (caught?.name === 'AbortError') return undefined
      if (!mountedRef.current) return undefined
      setError(
        caught instanceof ApiError
          ? { code: caught.code, message: caught.message }
          : { code: 'UNEXPECTED_ERROR', message: 'Something went wrong while running the operation.' },
      )
      return undefined
    } finally {
      if (mountedRef.current && controllerRef.current === controller) {
        setLoading(false)
        controllerRef.current = null
      }
    }
  }, [])

  const clear = useCallback(() => setError(null), [])

  return { execute, loading, error, clear }
}

/**
 * Validate text against the backend's 1 MiB ceiling before sending it.
 *
 * @param {string} value
 * @returns {string|null} error message, or null when acceptable
 */
export function validateTextSize(value) {
  const bytes = new TextEncoder().encode(value).length
  if (bytes > 1048576) {
    return `Input is ${(bytes / 1048576).toFixed(2)} MB. The maximum is 1 MB.`
  }
  return null
}