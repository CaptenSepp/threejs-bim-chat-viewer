import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadFragments } from '../src/loadFrag.js';

function mockFetchSuccess(data = new ArrayBuffer(8)) {
  global.fetch = vi.fn(async () => new Response(data, { status: 200 }));
  return data;
}

function mockFetchFail() {
  global.fetch = vi.fn(async () => new Response('', { status: 404 }));
}

describe('IFC fragment loading', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="viewer"></div>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads fragment data into the manager', async () => {
    const buffer = mockFetchSuccess();
    const fragments = { core: { load: vi.fn(async () => {}) }, list: new Map() };
    await loadFragments(fragments, '/frags/school_str.frag');
    expect(global.fetch).toHaveBeenCalledWith('/frags/school_str.frag');
    expect(fragments.core.load).toHaveBeenCalledWith(buffer, { modelId: 'school_str' });
  });

  it('does not load when fetch fails', async () => {
    mockFetchFail();
    const fragments = { core: { load: vi.fn() }, list: new Map() };
    await loadFragments(fragments, '/frags/missing.frag');
    expect(global.fetch).toHaveBeenCalledWith('/frags/missing.frag');
    expect(fragments.core.load).not.toHaveBeenCalled();
  });

  it('adds model to scene when fragments event fires', async () => {
    mockFetchSuccess();
    const world = { scene: { three: { add: vi.fn() } }, camera: { three: {} } };
    const model = { object: {}, useCamera: vi.fn() };
    const fragments = {
      core: {
        load: vi.fn(async () => {
          fragments.list.onItemSet.trigger({ value: model });
        }),
        update: vi.fn(),
      },
      list: {
        onItemSet: {
          handlers: [],
          add(fn) { this.handlers.push(fn); },
          trigger(arg) { this.handlers.forEach(h => h(arg)); },
        },
      },
    };

    fragments.list.onItemSet.add(({ value }) => {
      value.useCamera(world.camera.three);
      world.scene.three.add(value.object);
      fragments.core.update(true);
    });

    await loadFragments(fragments, '/frags/school_str.frag');

    expect(world.scene.three.add).toHaveBeenCalledWith(model.object);
    expect(model.useCamera).toHaveBeenCalledWith(world.camera.three);
    expect(fragments.core.update).toHaveBeenCalledWith(true);
  });
});