declare global {
  interface Window {
    applyChatSelHighlight: (sel: { modelId: string; itemId: number }) => void;
  }
}

export {};
