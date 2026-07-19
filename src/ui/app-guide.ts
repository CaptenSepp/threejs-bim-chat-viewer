const GUIDE_STORAGE_KEY = "app-guide-completed";
const GUIDE_ANIMATION_MS = 180;

type GuidePlacement = "target" | "canvas-corner" | "canvas-center";
type GuideStep = {
  text: string;
  getTarget: () => HTMLElement | null;
  placement?: GuidePlacement;
  showMessagePreview?: boolean;
};

const guideSteps: GuideStep[] = [
  {
    text: "Explore the model: left-drag rotates, right-drag moves, and the wheel or middle-drag zooms.",
    getTarget: () => document.getElementById("three-canvas"),
    placement: "canvas-corner",
  },
  {
    text: "Click an element to highlight it and attach its information to chat. Remove the reference later with the × button.",
    getTarget: () => document.getElementById("three-canvas"),
    placement: "canvas-center",
  },
  {
    text: "Write your question or note here. Press Enter or use Send to add it to the chat.",
    getTarget: () => document.getElementById("input-field"),
  },
  {
    text: "Keep AI Switch on for AI answers. Turn it off to add messages without contacting the AI service.",
    getTarget: () => document.querySelector(".ai-switch"),
  },
  {
    text: "Select a message with its circle, then use the trash button to remove it.",
    getTarget: () => document.querySelector(".app-guide__preview-message .message__select-btn")
      || document.getElementById("chat-messages"),
    showMessagePreview: true,
  },
];

export function initAppGuide(forceStart = false): void {
  if (document.querySelector(".app-guide")) return;
  if (!forceStart && localStorage.getItem(GUIDE_STORAGE_KEY)) return;

  let currentStepIndex = 0;
  let currentTarget: HTMLElement | null = null;
  let previewMessage: HTMLElement | null = null;
  let isTransitioning = false;

  const guideCard = document.createElement("div");
  guideCard.className = "app-guide app-guide--entering";
  guideCard.setAttribute("role", "dialog");

  const guideText = document.createElement("p");
  const guideActions = document.createElement("div");
  guideActions.className = "app-guide__actions";

  const skipButton = document.createElement("button");
  skipButton.className = "app-guide__button app-guide__button-skip";
  skipButton.type = "button";
  skipButton.textContent = "Skip";

  const okButton = document.createElement("button");
  okButton.className = "app-guide__button app-guide__button-ok";
  okButton.type = "button";
  okButton.textContent = "OK";

  guideActions.append(skipButton, okButton);
  guideCard.append(guideText, guideActions);
  document.body.appendChild(guideCard);

  function createMessagePreview(): void {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages || previewMessage) return;

    previewMessage = document.createElement("div");
    previewMessage.className = "message-wrapper self app-guide__preview-message";
    const messageBubble = document.createElement("div");
    messageBubble.className = "message";
    messageBubble.append("Example message");

    const messageControls = document.createElement("div");
    messageControls.className = "message__controls";
    const deleteButton = document.createElement("button");
    deleteButton.className = "message__delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "🗑️";

    const selectButton = document.createElement("button");
    selectButton.className = "message__select-btn";
    selectButton.type = "button";
    selectButton.setAttribute("aria-label", "Select example message");
    selectButton.addEventListener("click", () => {
      const isSelected = messageBubble.classList.toggle("message--selected");
      selectButton.setAttribute("aria-pressed", String(isSelected));
    });

    messageControls.append(deleteButton, selectButton);
    messageBubble.appendChild(messageControls);
    previewMessage.appendChild(messageBubble);
    chatMessages.appendChild(previewMessage);
  }

  function removeMessagePreview(): void {
    previewMessage?.remove();
    previewMessage = null;
  }

  function completeGuide(): void {
    currentTarget?.classList.remove("app-guide__target");
    window.removeEventListener("resize", positionGuide);
    localStorage.setItem(GUIDE_STORAGE_KEY, "true");
    removeMessagePreview();
    guideCard.remove();
  }

  function closeGuide(): void {
    if (isTransitioning) return;
    isTransitioning = true;
    guideCard.classList.add("app-guide--leaving");
    previewMessage?.classList.add("app-guide__preview-message--leaving");
    window.setTimeout(completeGuide, GUIDE_ANIMATION_MS);
  }

  function positionGuide(): void {
    if (!currentTarget) return;
    const targetRect = currentTarget.getBoundingClientRect();
    const cardRect = guideCard.getBoundingClientRect();
    const currentPlacement = guideSteps[currentStepIndex]?.placement ?? "target";
    const gap = 12;

    let left = targetRect.right + gap;
    let top = targetRect.top + (targetRect.height - cardRect.height) / 2;
    if (currentPlacement === "canvas-corner") {
      left = targetRect.right - cardRect.width - 24;
      top = targetRect.top + 24;
    } else if (currentPlacement === "canvas-center") {
      left = targetRect.left + targetRect.width * 0.62 - cardRect.width / 2;
      top = targetRect.top + targetRect.height * 0.35 - cardRect.height / 2;
    } else if (left + cardRect.width > window.innerWidth - gap) {
      left = targetRect.left - cardRect.width - gap;
    }

    // Keep the card visible when the target is close to a screen edge.
    left = Math.max(gap, Math.min(left, window.innerWidth - cardRect.width - gap));
    top = Math.max(gap, Math.min(top, window.innerHeight - cardRect.height - gap));
    guideCard.style.left = `${left}px`;
    guideCard.style.top = `${top}px`;
  }

  function showStep(): void {
    currentTarget?.classList.remove("app-guide__target");
    const currentStep = guideSteps[currentStepIndex];
    if (currentStep?.showMessagePreview) createMessagePreview();
    currentTarget = currentStep?.getTarget() ?? null;
    currentTarget?.classList.add("app-guide__target");
    guideText.textContent = currentStep?.text ?? "";
    positionGuide();
  }

  function showNextStep(): void {
    if (isTransitioning) return;
    if (currentStepIndex >= guideSteps.length - 1) return closeGuide();
    isTransitioning = true;
    guideCard.classList.add("app-guide--leaving");

    window.setTimeout(() => {
      currentStepIndex += 1;
      showStep();
      guideCard.classList.remove("app-guide--leaving");
      guideCard.classList.add("app-guide--entering");
      window.requestAnimationFrame(() => guideCard.classList.remove("app-guide--entering"));
      isTransitioning = false;
    }, GUIDE_ANIMATION_MS);
  }

  skipButton.addEventListener("click", closeGuide);
  okButton.addEventListener("click", showNextStep);
  window.addEventListener("resize", positionGuide);
  showStep();
  window.requestAnimationFrame(() => guideCard.classList.remove("app-guide--entering"));
}
