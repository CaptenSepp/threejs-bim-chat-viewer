import { FragmentsManager } from "@thatopen/components";

let components, world, overlayDiv, currentPoint;

export function initObjectMeta(engineComponents, worldInstance) {
    console.log("[object-meta] initObjectMeta", { engineComponents, worldInstance }); // Debug init arguments
    components = engineComponents;
    world = worldInstance;
    overlayDiv = document.createElement("div");
    overlayDiv.style.position = "fixed";
    overlayDiv.style.zIndex = "2148647";      // ensure above canvas
    overlayDiv.style.pointerEvents = "none";
    overlayDiv.style.background = "rgba(0,0,0,0.7)";
    overlayDiv.style.color = "white";
    overlayDiv.style.padding = "4px";
    overlayDiv.style.borderRadius = "4px";
    overlayDiv.style.fontSize = "12px";
    overlayDiv.style.display = "none";
    document.body.appendChild(overlayDiv);

    world.camera.controls.addEventListener("change", () => {
        if (overlayDiv.style.display !== "none" && currentPoint) {
            console.log("[object-meta] camera controls changed, updating position"); // Debug camera movement
            updatePosition();
        }
    });
}

function updatePosition() {
    if (!currentPoint || !world) {
        console.log("[object-meta] updatePosition called without point/world", { currentPoint, world }); // Debug missing info
        return;
    }
    const canvas = world.renderer.three.domElement;
    const rect = canvas.getBoundingClientRect(); // canvas offset in the page

    const vector = currentPoint.clone().project(world.camera.three);
    const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left; // <-- Offset dazu
    const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top; // <-- Offset dazu
    console.log("[object-meta] updatePosition", { currentPoint, vector, x, y }); // Debug computed screen position
    overlayDiv.style.transform =
        `translate(-50%, -100%) translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

export async function showObjectMeta({ modelId, itemId, point }) {
    console.log("[object-meta] showObjectMeta called", { modelId, itemId, point }); // Debug call details
    if (!components) {
        console.log("[object-meta] components missing"); // Debug missing components
        return;
    }
    const fragments = components.get(FragmentsManager);
    console.log("[object-meta] fragments manager", fragments); // Debug fragments manager
    const model = fragments.list.get(modelId);
    if (!model) {
        console.log("[object-meta] model not found", modelId); // Debug missing model
        return;
    }
    const item = model.getItem(itemId);
    if (!item) {
        console.log("[object-meta] item not found", { modelId, itemId }); // Debug missing item
        return;
    }
    const attrs = await item.getAttributes();
    const guid = await item.getGuid();
    console.log("[object-meta] retrieved metadata", { attrs, guid }); // Debug metadata

    const lines = [
        `Model: ${modelId}`, // Delete this line to hide the model identifier
        `Item: ${itemId}`, // Delete this line to hide the item identifier
        `GUID: ${guid ?? "n/a"}`, // Delete this line to hide the GUID
        `Name: ${attrs?.get("Name")?.value ?? "n/a"}`, // Delete this line to hide the Name attribute
        `Category: ${attrs?.get("Category")?.value ?? "n/a"}`, // Delete this line to hide the Category attribute
    ];

    overlayDiv.innerHTML = lines.join("<br>");
    overlayDiv.style.display = "block";
    if (point) {
        currentPoint = point.clone();
        console.log("[object-meta] positioning at point", currentPoint); // Debug positioning point
        updatePosition();
    } else {
        currentPoint = null;
        overlayDiv.style.left = "0";
        overlayDiv.style.top = "0";
        overlayDiv.style.transform = "translate(0, 0)";
        console.log("[object-meta] no point provided, using default position"); // Debug default positioning
    }
}

export function hideObjectMeta() {
    console.log("[object-meta] hideObjectMeta called"); // Debug hide call
    if (overlayDiv) overlayDiv.style.display = "none";
    currentPoint = null;
}