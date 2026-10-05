/**
 * Typed client for the CipherForge API.
 *
 * Every failure is normalised into an ApiError so the UI never has to inspect
 * raw responses. The backend already returns the structured envelope
 * `{ success: false, error: { code, message } }`, so that is what surfaces here.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** Error carrying the backend's machine readable code alongside the message. */
export class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', status = 0) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** Byte ceiling mirroring the backend's 1 MiB text limit, for early feedback. */
export const MAX_TEXT_BYTES = 1048576

/**
 * Measure the UTF-8 size of a string without allocating a copy per call site.
 *
 * @param {string} value
 * @returns {number} encoded length in bytes
 */
export function byteLength(value) {
  return new TextEncoder().encode(value).length
}

/**
 * Perform a JSON request against the CipherForge API.
 *
 * @param {string} path
 * @param {object} [options]
 * @param {string} [options.method]
 * @param {object} [options.body]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} parsed JSON response
 * @throws {ApiError} on network failure, non-2xx status, or malformed JSON
 */
async function request(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError(
      'Cannot reach the CipherForge API. Confirm the backend is running on port 8000.',
      'NETWORK_ERROR',
      0,
    )
  }

  const text = await response.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const error = payload?.error
    throw new ApiError(
      error?.message ?? `Request failed with status ${response.status}.`,
      error?.code ?? 'HTTP_ERROR',
      response.status,
    )
  }

  if (!payload) {
    throw new ApiError('The API returned an unreadable response.', 'BAD_RESPONSE', response.status)
  }

  return payload
}

/**
 * Load the algorithm catalogue that drives the whole interface.
 *
 * @param {AbortSignal} [signal]
 * @returns {Promise<{categories: string[], encode: object[], encryption: object[], hash: object[]}>}
 */
export function fetchAlgorithms(signal) {
  return request('/api/algorithms', { signal })
}

/**
 * Check backend availability, used for the header status indicator.
 *
 * @param {AbortSignal} [signal]
 * @returns {Promise<{status: string, service: string, version: string}>}
 */
export function fetchHealth(signal) {
  return request('/api/health', { signal })
}

/**
 * Run a Base64 or hexadecimal encode/decode operation.
 *
 * @param {{algorithm: string, operation: string, input: string}} body
 * @param {AbortSignal} [signal]
 * @returns {Promise<{output: string}>}
 */
export function runEncode(body, signal) {
  return request('/api/encode', { method: 'POST', body, signal })
}

/**
 * Run an encryption, decryption, or RSA key generation operation.
 *
 * @param {object} body
 * @param {AbortSignal} [signal]
 * @returns {Promise<object>} response with ciphertext / output / keys as applicable
 */
export function runEncryption(body, signal) {
  return request('/api/encryption', { method: 'POST', body, signal })
}

/**
 * Hash text with MD5, SHA-256, SHA-512, or bcrypt.
 *
 * @param {object} body
 * @param {AbortSignal} [signal]
 * @returns {Promise<{hash: string, digest_size_bits: number, work_factor: number|null}>}
 */
export function runHash(body, signal) {
  return request('/api/hash', { method: 'POST', body, signal })
}

/**
 * Verify a password against an existing bcrypt hash.
 *
 * @param {{password: string, hash: string}} body
 * @param {AbortSignal} [signal]
 * @returns {Promise<{verified: boolean}>}
 */
export function verifyBcrypt(body, signal) {
  return request('/api/hash/bcrypt/verify', { method: 'POST', body, signal })
}