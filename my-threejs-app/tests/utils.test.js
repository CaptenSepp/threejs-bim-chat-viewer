import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWorkerObjectUrl, loadFragmentsFromPath } from '../src/utils.js';

// stores original globals to restore later to avoid polluting other tests
const originalFetch = global.fetch;
const originalCreateObjectURL = global.URL.createObjectURL;

// restores globals and clears mocks after each test to keep tests isolated
afterEach(() => {
  global.fetch = originalFetch;
  global.URL.createObjectURL = originalCreateObjectURL;
  vi.restoreAllMocks();
});

describe('createWorkerObjectUrl', () => {
  it('returns object URL on successful fetch', async () => {
    // fake worker file returned by fetch (mock response) to simulate a successful network response
    const blob = new Blob(['worker']);
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
    global.fetch = mockFetch;
    global.URL.createObjectURL = vi.fn(() => 'object-url');

    // execute the function under test (UUT) to capture the result for assertions
    const result = await createWorkerObjectUrl('worker.js');

    // verify calls and output (assertion) to ensure correct API usage
    expect(mockFetch).toHaveBeenCalledWith('worker.js');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(result).toBe('object-url');
  });

  it('throws error when fetch fails', async () => {
    // simulate a network error (rejected promise) to cover the error path
    global.fetch = vi.fn().mockRejectedValue(new Error('network'));
    await expect(createWorkerObjectUrl('worker.js')).rejects.toThrow(/network/);
  });
});

describe('loadFragmentsFromPath', () => {
  it('loads fragments on successful fetch', async () => {
    // mock fetch returning an ArrayBuffer (mock response) to simulate binary payload download
    const buffer = new ArrayBuffer(8);
    global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(buffer) });
    const load = vi.fn();
    const fragments = { core: { load } };

    await loadFragmentsFromPath(fragments, '/path');

    // loader should receive the downloaded buffer to confirm integration between fetch and loader
    expect(global.fetch).toHaveBeenCalledWith('/path');
    expect(load).toHaveBeenCalledWith(buffer, { modelId: 'school_str' });
  });

  it('logs error when fetch fails', async () => {
    // simulate fetch failure and spy on console.error to assert error handling logic
    global.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    const load = vi.fn();
    const fragments = { core: { load } };
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    await loadFragmentsFromPath(fragments, '/path');

    expect(errorSpy).toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
