import { afterEach, describe, expect, it, vi } from 'vitest';
import { getWorkerUrl, loadFragments } from '../src/utils.js';

const originalFetch = global.fetch;
const originalCreateObjectURL = global.URL.createObjectURL;

afterEach(() => {
    global.fetch = originalFetch;
    global.URL.createObjectURL = originalCreateObjectURL;
    vi.restoreAllMocks();
});

describe('getWorkerUrl', () => {
    it('returns object URL on successful fetch', async () => {
        const blob = new Blob(['worker']);
        const mockFetch = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
        global.fetch = mockFetch;
        global.URL.createObjectURL = vi.fn(() => 'object-url');

        const result = await getWorkerUrl('worker.js');

        expect(mockFetch).toHaveBeenCalledWith('worker.js');
        expect(URL.createObjectURL).toHaveBeenCalled();
        expect(result).toBe('object-url');
    });

    it('throws error when fetch fails', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('network'));
        await expect(getWorkerUrl('worker.js')).rejects.toThrow(/network/);
    });
});

describe('loadFragments', () => {
    it('loads fragments on successful fetch', async () => {
        const buffer = new ArrayBuffer(8);
        global.fetch = vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(buffer) });
        const load = vi.fn();
        const fragments = { core: { load } };

        await loadFragments(fragments, '/path');

        expect(global.fetch).toHaveBeenCalledWith('/path');
        expect(load).toHaveBeenCalledWith(buffer, { modelId: 'school_str' });
    });

    it('logs error when fetch fails', async () => {
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