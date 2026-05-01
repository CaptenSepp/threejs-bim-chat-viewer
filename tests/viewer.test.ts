import { beforeEach, describe, expect, it, vi } from "vitest";

// keep shared spies outside so each test can inspect the latest fake engine state
const fragmentsUpdate = vi.fn();
const fragmentsInit = vi.fn();
const setLookAt = vi.fn().mockResolvedValue(undefined);
const controlsAddEventListener = vi.fn();
const setAnimationLoop = vi.fn();
const sceneAdd = vi.fn();
const gridsCreate = vi.fn();
const componentsInit = vi.fn();
const useCamera = vi.fn();

// expose the current onItemSet callback so tests can simulate a loaded model
let onItemSetHandler: ((entry: { value: { useCamera(camera: object): void; object: object } }) => void) | null = null;

vi.mock("@thatopen/components", () => {
  // fake scene class with the same shape the app uses
  class SimpleScene {
    three = { background: "bg", add: sceneAdd };
    setup = vi.fn();
  }

  // fake camera class with controls and a three camera object
  class OrthoPerspectiveCamera {
    three = { cameraId: "cam" };
    controls = {
      setLookAt,
      addEventListener: controlsAddEventListener,
    };
  }

  // fake components registry that returns the services createViewerEngine reads
  class Components {
    get(token: symbol) {
      if (token === Worlds) {
        return {
          create: () => ({
            scene: null,
            renderer: null,
            camera: null,
          }),
        };
      }

      if (token === Grids) {
        return { create: gridsCreate };
      }

      if (token === FragmentsManager) {
        return {
          init: fragmentsInit,
          core: { update: fragmentsUpdate },
          list: {
            onItemSet: {
              add: (handler: typeof onItemSetHandler) => {
                onItemSetHandler = handler;
              },
            },
          },
        };
      }

      throw new Error(`Unexpected token: ${String(token)}`);
    }

    init() {
      componentsInit();
    }
  }

  // use symbols so equality checks inside the fake registry are simple
  const Worlds = Symbol("Worlds");
  const Grids = Symbol("Grids");
  const FragmentsManager = Symbol("FragmentsManager");

  return {
    Components,
    Worlds,
    Grids,
    FragmentsManager,
    SimpleScene,
    OrthoPerspectiveCamera,
  };
});

vi.mock("@thatopen/components-front", () => ({
  // fake renderer keeps only the fields touched by the app
  PostproductionRenderer: class {
    three = {
      domElement: document.createElement("canvas"),
      setAnimationLoop,
    };

    update = vi.fn();
  },
}));

vi.mock("../src/core/utils.js", () => ({
  createWorkerObjectUrl: vi.fn().mockResolvedValue("worker-object-url"),
}));

describe("createViewerEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onItemSetHandler = null;
  });

  it("wires fragments to camera change events", async () => {
    const { createViewerEngine } = await import("../src/core/viewer.js");

    // use a simple host element because the fake renderer only needs an HTMLElement
    await createViewerEngine(document.createElement("div"));

    // this is the exact event that keeps the loaded model updating while navigating
    expect(controlsAddEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  it("binds loaded models to the active camera and scene", async () => {
    const { createViewerEngine } = await import("../src/core/viewer.js");

    // initialize the fake engine so the onItemSet subscription is registered
    await createViewerEngine(document.createElement("div"));

    expect(onItemSetHandler).toBeTypeOf("function");

    // simulate the fragments service reporting one freshly loaded model
    onItemSetHandler?.({
      value: {
        useCamera,
        object: { objectId: "model-object" },
      },
    });

    // if this breaks, the model may technically load but never become visible
    expect(useCamera).toHaveBeenCalledWith({ cameraId: "cam" });
    expect(sceneAdd).toHaveBeenCalledWith({ objectId: "model-object" });
    expect(fragmentsUpdate).toHaveBeenCalledWith(true);
  });
});
