import { beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";

const displayOffscreenBanner = vi.fn();
const hideOffscreenBanner = vi.fn();
const applyMarkerLabelValues = vi.fn();

vi.mock("../src/ui/marker-banner.js", () => ({
  displayOffscreenBanner,
  hideOffscreenBanner,
}));

vi.mock("../src/modules/target/marker-helpers.js", () => ({
  applyMarkerLabelValues,
}));

describe("marker visibility watcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = `
      <template id="marker-banner-template">
        <div class="banner-row"></div>
      </template>
    `;
  });

  it("subscribes to both camera control events", async () => {
    const addEventListener = vi.fn();
    const { initMarkerVisibilityWatcher } = await import("../src/modules/target/marker-visibility.js");

    // fake world keeps only the camera pieces the watcher reads
    initMarkerVisibilityWatcher({
      camera: {
        three: new THREE.PerspectiveCamera(),
        controls: { addEventListener },
      },
    });

    // both events matter because different controls can emit different updates
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith("update", expect.any(Function));
  });

  it("renders offscreen marker html when the point leaves the view", async () => {
    const addEventListener = vi.fn();
    const { initMarkerVisibilityWatcher, updateActiveMarkerContext } = await import("../src/modules/target/marker-visibility.js");

    // use a real camera so Vector3.project behaves like production code
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.set(0, 0, 0);
    camera.lookAt(0, 0, -1);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    initMarkerVisibilityWatcher({
      camera: {
        three: camera,
        controls: { addEventListener },
      },
    });

    // x=50 is clearly offscreen for this simple camera setup
    updateActiveMarkerContext(
      new THREE.Vector3(50, 0, -5),
      {
        name: "Door",
        objectType: "IfcDoor",
        tag: "D-01",
        category: "Doors",
        localId: "42",
      },
    );

    // if this fails, the watcher/template path is broken and the UI silently hides evidence
    expect(applyMarkerLabelValues).toHaveBeenCalled();
    expect(displayOffscreenBanner).toHaveBeenCalledWith(expect.stringContaining("banner-row"));
    expect(hideOffscreenBanner).not.toHaveBeenCalled();
  });
});
