import { describe, it, expect, vi } from 'vitest';

vi.mock('@thatopen/components', () => ({
  FragmentsManager: Symbol('FragmentsManager'),
  Raycasters: Symbol('Raycasters')
}));

vi.mock('@thatopen/fragments', () => ({
  RenderedFaces: { ONE: 'ONE' }
}));

import { highlightSelection } from '../src/raycaster.js';

describe('raycaster highlightSelection', () => {
  it('calls reset and highlight with correct items', () => {
    const resetHighlight = vi.fn();
    const highlight = vi.fn();
    const components = { get: vi.fn(() => ({ resetHighlight, highlight })) };
    const selection = { modelId: 'model1', itemId: 42 };

    highlightSelection(components, selection);

    expect(components.get).toHaveBeenCalled();
    expect(resetHighlight).toHaveBeenCalled();
    expect(highlight).toHaveBeenCalledWith(expect.any(Object), { model1: [42] });
  });
});
