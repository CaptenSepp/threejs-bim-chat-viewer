import { describe, expect, it } from 'vitest';
import { classifyAiRequestError, classifyAiResponseError } from '../tools/ai-upstream-error.js';

describe('safe AI upstream errors', () => {
  it.each([
    [401, 'AI service authentication failed.'],
    [400, 'AI service authentication failed.'],
    [429, 'AI request limit reached. Please try again later.'],
    [404, 'The AI model is currently unavailable.'],
    [504, 'The AI service took too long to respond.'],
    [503, 'The AI service is temporarily unavailable.'],
  ])('maps HTTP %i to a predefined message', (status, message) => {
    expect(classifyAiResponseError(status).message).toBe(message);
  });

  it('does not expose network exception details', () => {
    expect(classifyAiRequestError(new Error('secret detail')).message).toBe('Could not connect to the AI service.');
  });
});
