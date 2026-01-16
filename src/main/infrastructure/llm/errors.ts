/**
 * @fileoverview Custom error classes for LLM operations
 * @lastmodified 2026-01-16T00:00:00Z
 *
 * Features: Typed LLM errors with context, rate limiting, API errors, validation errors
 * Main APIs: LLMError, LLMRateLimitError, LLMAPIError, LLMValidationError
 * Constraints: All errors extend base LLMError for consistent handling
 * Patterns: Error codes for programmatic error handling, retry metadata for rate limits
 */

/** Error codes for LLM operations */
export type LLMErrorCode =
  | 'API_ERROR'
  | 'RATE_LIMITED'
  | 'AUTHENTICATION_FAILED'
  | 'INVALID_RESPONSE'
  | 'VALIDATION_FAILED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'CONFIGURATION_ERROR';

/**
 * Base LLM error with structured context
 */
export class LLMError extends Error {
  readonly code: LLMErrorCode;
  readonly cause: Error | undefined;
  readonly context: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: LLMErrorCode,
    options?: { cause?: Error | undefined; context?: Record<string, unknown> | undefined }
  ) {
    super(message);
    this.name = 'LLMError';
    this.code = code;
    this.cause = options?.cause;
    this.context = options?.context;

    Error.captureStackTrace?.(this, LLMError);
  }
}

/**
 * Error thrown when rate limited by the LLM provider
 */
export class LLMRateLimitError extends LLMError {
  readonly retryAfterMs: number | undefined;

  constructor(
    message: string,
    options?: {
      cause?: Error | undefined;
      retryAfterMs?: number | undefined;
      context?: Record<string, unknown> | undefined;
    }
  ) {
    super(message, 'RATE_LIMITED', {
      cause: options?.cause,
      context: { ...options?.context, retryAfterMs: options?.retryAfterMs },
    });
    this.name = 'LLMRateLimitError';
    this.retryAfterMs = options?.retryAfterMs;
  }
}

/**
 * Error thrown when LLM API call fails
 */
export class LLMAPIError extends LLMError {
  readonly statusCode: number | undefined;
  readonly provider: string;

  constructor(
    message: string,
    provider: string,
    options?: {
      cause?: Error | undefined;
      statusCode?: number | undefined;
      context?: Record<string, unknown> | undefined;
    }
  ) {
    super(message, 'API_ERROR', {
      cause: options?.cause,
      context: { ...options?.context, provider, statusCode: options?.statusCode },
    });
    this.name = 'LLMAPIError';
    this.provider = provider;
    this.statusCode = options?.statusCode;
  }
}

/**
 * Error thrown when LLM response fails validation
 */
export class LLMValidationError extends LLMError {
  readonly rawResponse: string | undefined;

  constructor(
    message: string,
    options?: {
      cause?: Error | undefined;
      rawResponse?: string | undefined;
      context?: Record<string, unknown> | undefined;
    }
  ) {
    super(message, 'VALIDATION_FAILED', {
      cause: options?.cause,
      context: options?.context,
    });
    this.name = 'LLMValidationError';
    this.rawResponse = options?.rawResponse;
  }
}

/**
 * Error thrown when LLM configuration is invalid
 */
export class LLMConfigurationError extends LLMError {
  readonly missingFields: string[];

  constructor(
    message: string,
    missingFields: string[],
    options?: { cause?: Error | undefined }
  ) {
    super(message, 'CONFIGURATION_ERROR', {
      cause: options?.cause,
      context: { missingFields },
    });
    this.name = 'LLMConfigurationError';
    this.missingFields = missingFields;
  }
}
