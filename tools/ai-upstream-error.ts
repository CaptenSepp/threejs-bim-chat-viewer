const AI_ERROR_MESSAGES = {
  auth: 'AI service authentication failed.',
  rateLimit: 'AI request limit reached. Please try again later.',
  modelUnavailable: 'The AI model is currently unavailable.',
  timeout: 'The AI service took too long to respond.',
  network: 'Could not connect to the AI service.',
  unavailable: 'The AI service is temporarily unavailable.',
} as const;

type AiErrorKind = keyof typeof AI_ERROR_MESSAGES;

export class AiUpstreamError extends Error {
  constructor(kind: AiErrorKind) {
    super(AI_ERROR_MESSAGES[kind]);
    this.name = 'AiUpstreamError';
  }
}

export function classifyAiResponseError(status: number): AiUpstreamError {
  if (status === 400 || status === 401 || status === 403) return new AiUpstreamError('auth');
  if (status === 429) return new AiUpstreamError('rateLimit');
  if (status === 404) return new AiUpstreamError('modelUnavailable');
  if (status === 408 || status === 504) return new AiUpstreamError('timeout');
  return new AiUpstreamError('unavailable');
}

export function classifyAiRequestError(error: unknown): AiUpstreamError {
  return new AiUpstreamError(error instanceof DOMException && error.name === 'TimeoutError' ? 'timeout' : 'network');
}

export function trackAiResponseError(provider: 'Groq' | 'Google', status: number): AiUpstreamError {
  console.log(`${provider} upstream status`, status);
  return classifyAiResponseError(status);
}

export function trackAiRequestError(provider: 'Groq' | 'Google', error: unknown): AiUpstreamError {
  const safeError = classifyAiRequestError(error);
  console.log(`${provider} upstream failure`, safeError.message);
  return safeError;
}
