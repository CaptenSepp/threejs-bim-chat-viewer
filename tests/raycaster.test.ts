import { FragmentsManager, Raycasters } from '@thatopen/components';
import type { Components } from '@thatopen/components';
import type { ViewerWorldType } from '../src/types/app-types.js';
import { describe, expect, it, vi } from 'vitest';
import { SELECTION_HIGHLIGHT_STYLE, applySelHighlight, setRaycastEvents } from '../src/modules/target/raycaster.js';


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
    const sel = { modelId: 'model1', itemId: 42 };      // example like a raycast selection to drive expected arguments

    applySelHighlight(components as unknown as Components, sel);           // call the unit under test (UUT)

    expect(components.get).toHaveBeenCalled();
    expect(resetHighlight).toHaveBeenCalled();
    expect(highlight).toHaveBeenCalledWith(SELECTION_HIGHLIGHT_STYLE, { model1: new Set([42]) });
    expect(core.update).toHaveBeenCalledWith(true);

  });

});

describe('raycaster setupRaycastEvents', () => {
  it('invokes handler with ray hit ids on click', async () => {
    const handleRaycastSelection = vi.fn();
    const handlers: Record<string, (event: MouseEvent) => Promise<void> | void> = {}; // store callbacks by event name for manual triggering

    // fake canvas that collects event handlers to trigger the click handler manually
    const canvas = {
      addEventListener: vi.fn((event, handler) => { // Fake addEventListener to save the handler instead of real DOM (mock)
        handlers[event] = handler; // Store the handler by event name (e.g., 'click')
      })
    };

    // world object exposes the canvas via nested properties to mirror production structure
    const world = { renderer: { three: { domElement: canvas } } };

    // raycast result returned by the mocked raycaster (hit)
    const rayHit = { fragments: { modelId: 'model1' }, localId: 7 }; // Define a fake rayHit with modelId and localId (test data)
    const raycaster = {
      mouse: { updateMouseInfo: vi.fn() },
      castRay: vi.fn().mockResolvedValue(rayHit)
    };

    // services to retrieve the raycaster instance to inject our mock into the code path
    const raycastersService = { get: vi.fn(() => raycaster) };
    const fragmentsService = { resetHighlight: vi.fn(), core: { update: vi.fn() } };
    const getSpy = vi.fn();
    function get(service: typeof FragmentsManager | typeof Raycasters) {
      getSpy(service);
      return service === Raycasters ? raycastersService : fragmentsService;
    }
    const engineComponents = { get };

    // initialize and then simulate a click event to test the end-to-end selection flow
    setRaycastEvents(engineComponents as unknown as Components, world as unknown as ViewerWorldType, handleRaycastSelection);
    await handlers.click(new MouseEvent('click'));

    // handler should receive the IDs from the raycast result
    expect(getSpy).toHaveBeenCalledWith(Raycasters);
    expect(raycaster.mouse.updateMouseInfo).toHaveBeenCalled();
    expect(handleRaycastSelection).toHaveBeenCalledWith({ modelId: 'model1', itemId: 7 });
  });
}); 
