import { describe, it, expect, beforeEach } from 'vitest';

let setReference, clearReference;

beforeEach(async () => {
  document.body.innerHTML = `
    <div id="chat-messages"></div>
    <form id="input-elements"></form>
    <input id="input-field" />
    <div id="chat-reference-container" class="hidden"></div>
    <span id="chat-reference-text"></span>
    <button id="clear-reference-btn"></button>
  `;
  const mod = await import('../src/chat.js');
  setReference = mod.setReference;
  clearReference = mod.clearReference;
});

describe('chat references', () => {
  it('sets and clears reference', () => {
    setReference({ label: 'Item 1', modelId: 'm1', itemId: 1 });
    const refText = document.getElementById('chat-reference-text');
    const container = document.getElementById('chat-reference-container');
    expect(refText.textContent).toBe('Item 1');
    expect(container.classList.contains('hidden')).toBe(false);

    clearReference();
    expect(refText.textContent).toBe('');
    expect(container.classList.contains('hidden')).toBe(true);
  });
});