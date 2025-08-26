import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWorkerUrl, loadFragments } from '../src/utils.js';

// Store original global functions so they can be restored after tests.
const originalFetch = global.fetch;
const originalCreateObjectURL = global.URL.createObjectURL;

// Restore globals and clear mocks after each test to keep state clean.
afterEach(() => {
  global.fetch = originalFetch;
  global.URL.createObjectURL = originalCreateObjectURL;
  vi.restoreAllMocks();
});

describe('getWorkerUrl', () => {
  it('returns object URL on successful fetch', async () => {
    // Fake worker file returned by fetch.
    const blob = new Blob(['worker']);
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
    global.fetch = mockFetch;
    global.URL.createObjectURL = vi.fn(() => 'object-url');

    // Execute the function under test.
    const result = await getWorkerUrl('worker.js');

    // Verify the mocked APIs were called correctly.
    expect(mockFetch).toHaveBeenCalledWith('worker.js');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(result).toBe('object-url');
  });

  it('throws error when fetch fails', async () => {
    // Simulate a network error.
    global.fetch = vi.fn().mockRejectedValue(new Error('network'));
    await expect(getWorkerUrl('worker.js')).rejects.toThrow(/network/);
  });
});

describe('loadFragments', () => {
  it('loads fragments on successful fetch', async () => {
    // Mock a successful fetch returning an ArrayBuffer.
    const buffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(buffer) });
    const load = vi.fn();
    const fragments = { core: { load } };

    await loadFragments(fragments, '/path');

    // The loader should receive the downloaded buffer.
    expect(global.fetch).toHaveBeenCalledWith('/path');
    expect(load).toHaveBeenCalledWith(buffer, { modelId: 'school_str' });
  });

  it('logs error when fetch fails', async () => {
    // Simulate fetch failure and spy on console.error.
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    const load = vi.fn();
    const fragments = { core: { load } };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    await loadFragments(fragments, '/path');

    expect(errorSpy).toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});