export const ERROR_CODES = [
  'invalid-host', 'unrecognized-host', 'unsafe-domain', 'invalid-mode', 'invalid-timeout',
  'invalid-theme', 'invalid-pause', 'invalid-tab', 'tab-closed', 'tab-missing',
  'rule-not-found', 'unsupported-message', 'discard-unconfirmed', 'extension-required',
  'bridge-unavailable', 'unexpected',
] as const;
export type ErrorCode = typeof ERROR_CODES[number];
export interface ErrorData { code: ErrorCode; detail?: string }

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly detail?: string;
  constructor(code: ErrorCode, detail?: string) {
    super(code); this.name = 'AppError'; this.code = code; this.detail = detail;
  }
}

export function toErrorData(error: unknown): ErrorData {
  if (error instanceof AppError) return { code: error.code, ...(error.detail ? { detail: error.detail } : {}) };
  if (error && typeof error === 'object' && 'code' in error &&
      ERROR_CODES.includes(error.code as ErrorCode)) {
    const detail = 'detail' in error && typeof error.detail === 'string' ? error.detail : undefined;
    return { code: error.code as ErrorCode, ...(detail ? { detail } : {}) };
  }
  const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : undefined;
  return { code: 'unexpected', ...(detail ? { detail } : {}) };
}
