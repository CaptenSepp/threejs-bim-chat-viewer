import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initAppGuide } from "../src/ui/app-guide.js";

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  document.body.innerHTML = `
    <div id="three-canvas"></div>
    <div id="chat-messages"></div>
    <textarea id="input-field"></textarea>
    <label class="ai-switch"></label>
  `;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("first-visit app guide", () => {
  it("moves through all five steps and remembers completion", () => {
    initAppGuide();
    const guideCard = document.querySelector(".app-guide");
    const okButton = document.querySelector(".app-guide__button-ok");
    if (!(guideCard instanceof HTMLElement)) throw new Error("Missing guide card");
    if (!(okButton instanceof HTMLButtonElement)) throw new Error("Missing OK button");

    expect(guideCard.textContent).toContain("left-drag rotates");
    okButton.click();
    vi.advanceTimersByTime(180);
    expect(guideCard.textContent).toContain("× button");

    for (let step = 1; step < 5; step += 1) {
      okButton.click();
      vi.advanceTimersByTime(180);
    }
    expect(document.querySelector(".app-guide")).toBeNull();
    expect(localStorage.getItem("app-guide-completed")).toBe("true");

    initAppGuide();
    expect(document.querySelector(".app-guide")).toBeNull();
    initAppGuide(true);
    expect(document.querySelector(".app-guide")).not.toBeNull();
  });

  it("stops the complete guide when Skip is clicked", () => {
    initAppGuide();
    const skipButton = document.querySelector(".app-guide__button-skip");
    if (!(skipButton instanceof HTMLButtonElement)) throw new Error("Missing Skip button");

    skipButton.click();
    vi.advanceTimersByTime(180);
    expect(document.querySelector(".app-guide")).toBeNull();
    expect(localStorage.getItem("app-guide-completed")).toBe("true");
  });

  it("shows and removes only a temporary message preview", () => {
    initAppGuide();
    const okButton = document.querySelector(".app-guide__button-ok");
    if (!(okButton instanceof HTMLButtonElement)) throw new Error("Missing OK button");

    for (let step = 0; step < 4; step += 1) {
      okButton.click();
      vi.advanceTimersByTime(180);
    }
    const previewCircle = document.querySelector(".app-guide__preview-message .message__select-btn");
    if (!(previewCircle instanceof HTMLButtonElement)) throw new Error("Missing preview circle");
    previewCircle.click();
    expect(document.querySelector(".app-guide__preview-message .message--selected")).not.toBeNull();
    expect(localStorage.getItem("chat-history")).toBeNull();

    okButton.click();
    vi.advanceTimersByTime(180);
    expect(document.querySelector(".app-guide__preview-message")).toBeNull();
  });
});
