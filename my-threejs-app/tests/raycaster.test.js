import { Raycasters } from '@thatopen/components';
import { describe, expect, it, vi } from 'vitest';
import { highlightSelection, initRaycaster } from '../src/raycaster.js';


vi.mock('@thatopen/components', () => ({                        // Mockt das Paket '@thatopen/components' damit keine echeten Klassen
  FragmentsManager: Symbol('FragmentsManager'),
  Raycasters: Symbol('Raycasters')
}));

vi.mock('@thatopen/fragments', () => ({
  RenderedFaces: { ONE: 'ONE' }
}));


describe('raycaster highlightSelection', () => {
  it('calls reset and highlight with correct items', () => {
    const resetHighlight = vi.fn();
    const highlight = vi.fn();                                // Erzeugt zwei Spy-Funktionen. So können wir später prüfen,OB und WIE sie aufgerufen wurden
    const core = { update: vi.fn() };

    const components = { get: vi.fn(() => ({ resetHighlight, highlight, core })) }; // Simuliert das "components"-Service-Registry-Objekt
    const selection = { modelId: 'model1', itemId: 42 };      // Eine Beispiel wie sie aus Raycast kommen würde

    highlightSelection(components, selection);                // Aufruf der Funktion unter Test

    expect(components.get).toHaveBeenCalled();
    expect(resetHighlight).toHaveBeenCalled();
    expect(highlight).toHaveBeenCalledWith(expect.any(Object), { model1: [42] });
    expect(core.update).toHaveBeenCalledWith(true);

  });

});
describe('raycaster initRaycaster', () => {
  it('invokes handler with ray hit ids on click', async () => {
    const handleRaycastSelection = vi.fn();

    // Mock a canvas element that can register event handlers
    const canvas = {
      handlers: {},
      addEventListener: vi.fn((event, handler) => {
        canvas.handlers[event] = handler;
      })
    };

    // World object exposes the canvas through nested properties
    const world = { renderer: { three: { domElement: canvas } } };

    // Result returned by the mocked raycaster.
    const rayHit = { fragments: { modelId: 'model1' }, localId: 7 };
    const raycaster = {
      mouse: { updateMouseInfo: vi.fn() },
      castRay: vi.fn().mockResolvedValue(rayHit)
    };

    // Mock services to retrieve the raycaster instance
    const raycastersService = { get: vi.fn(() => raycaster) };
    const engineComponents = { get: vi.fn(() => raycastersService) };

    // Initialize the system and simulate a click event
    initRaycaster(engineComponents, world, handleRaycastSelection);
    await canvas.handlers.click({});

    // The handler should receive the IDs from the raycast result
    expect(engineComponents.get).toHaveBeenCalledWith(Raycasters);
    expect(raycaster.mouse.updateMouseInfo).toHaveBeenCalled();
    expect(handleRaycastSelection).toHaveBeenCalledWith({ modelId: 'model1', itemId: 7 });
  });
}); 