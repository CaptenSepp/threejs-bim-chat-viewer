declare global {
  interface Window {
    applyChatSelectionHighlight: (sel: { modelId: string; itemId: number }) => void;
  }
}

export {};

