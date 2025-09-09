import { Raycasters } from '@thatopen/components';
import { describe, expect, it, vi } from 'vitest';
import { applySelectionHighlight, setupRaycastSelection } from '../src/raycaster.js';


vi.mock('@thatopen/components', () => ({                        // mocks the package to avoid real engine classes (module mock) to isolate unit under test
  FragmentsManager: Symbol('FragmentsManager'),
  Raycasters: Symbol('Raycasters')
}));

vi.mock('@thatopen/fragments', () => ({                         // minimal constants used by selection style to satisfy imports without heavy deps
  RenderedFaces: { ONE: 'ONE' }
}));


describe('raycaster applySelectionHighlight', () => {
  it('calls reset and highlight with correct items', () => {
    const resetHighlight = vi.fn();
    const highlight = vi.fn();                                // create spies to verify calls and args
    const core = { update: vi.fn() };

    const components = { get: vi.fn(() => ({ resetHighlight, highlight, core })) }; // simulate components service registry
    const selection = { modelId: 'model1', itemId: 42 };      // example like a raycast selection to drive expected arguments

    applySelectionHighlight(components, selection);           // call the unit under test (UUT)

    expect(components.get).toHaveBeenCalled();
    expect(resetHighlight).toHaveBeenCalled();
    expect(highlight).toHaveBeenCalledWith(expect.any(Object), { model1: [42] });
    expect(core.update).toHaveBeenCalledWith(true);

  });

});

describe('raycaster setupRaycastSelection', () => {
  it('invokes handler with ray hit ids on click', async () => {
    const handleRaycastSelection = vi.fn();

    // fake canvas that collects event handlers to trigger the click handler manually
    const canvas = {
      handlers: {},
      addEventListener: vi.fn((event, handler) => {
        canvas.handlers[event] = handler;
      })
    };

    // world object exposes the canvas via nested properties to mirror production structure
    const world = { renderer: { three: { domElement: canvas } } };

    // raycast result returned by the mocked raycaster (hit)
    const rayHit = { fragments: { modelId: 'model1' }, localId: 7 };
    const raycaster = {
      mouse: { updateMouseInfo: vi.fn() },
      castRay: vi.fn().mockResolvedValue(rayHit)
    };

    // services to retrieve the raycaster instance to inject our mock into the code path
    const raycastersService = { get: vi.fn(() => raycaster) };
    const engineComponents = { get: vi.fn(() => raycastersService) };

    // initialize and then simulate a click event to test the end-to-end selection flow
    setupRaycastSelection(engineComponents, world, handleRaycastSelection);
    await canvas.handlers.click({});

    // handler should receive the IDs from the raycast result
    expect(engineComponents.get).toHaveBeenCalledWith(Raycasters);
    expect(raycaster.mouse.updateMouseInfo).toHaveBeenCalled();
    expect(handleRaycastSelection).toHaveBeenCalledWith({ modelId: 'model1', itemId: 7 });
  });
}); 
