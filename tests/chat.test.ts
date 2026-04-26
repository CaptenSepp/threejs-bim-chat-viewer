import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let setComposerReference: (referenceObject: { label: string; modelId: string; itemId: number }) => void;
let clearComposerReference: () => void;

beforeEach(async () => { // sets up a minimal DOM for tests to simulate browser environment
                         // element IDs match chat-ui.js (DOM contract) to match query selectors used by the code
                         // runs before each test to reset state (test lifecycle)
  const store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null), // read value from in-memory store (mock storage)
    setItem: (key, value) => {                            // write value to in-memory store (mock storage)
      store[key] = String(value);
    },
    removeItem: (key) => {                                // removes a single key from localStorage (delete)
      delete store[key];
    },
    clear: () => {                                        // clears all keys in the mock
      for (const key in store) delete store[key];
    },
    length: 0,
    key: () => null
  };

  document.body.innerHTML = `
    <div id="chat-messages"></div>
    <form id="input-form"></form>
    <input id="input-field" />
    <div id="chat-reference-container" class="hidden"></div>
    <span id="chat-reference-label"></span>
    <button id="clear-reference-btn"></button>
    <input id="ai-toggle" type="checkbox" />
  `;
  vi.resetModules();                                                      // reset module cache so each test gets fresh DOM bindings
  const mod = await import('../src/modules/chat/chat.js');                // dynamically import chat module (dynamic import) to bind to DOM elements created above
  setComposerReference = mod.setComposerReference;   // get API export
  clearComposerReference = mod.clearComposerReference;
});

afterEach(() => {
  localStorage.clear();
});


describe('chat references', () => {
  it('sets and clears reference', () => {
    setComposerReference({ label: 'Item 1', modelId: 'm1', itemId: 1 });   // simulate setting a 3D chat reference (reference)
    const refText = document.getElementById('chat-reference-label');
    const container = document.getElementById('chat-reference-container');

    expect(refText.textContent).toBe('Item 1');                            // expects label to show selected item
    expect(container.classList.contains('hidden')).toBe(false);            // expects chip to be visible

    clearComposerReference();

    expect(refText.textContent).toBe('');
    expect(container.classList.contains('hidden')).toBe(true);             // expects chip to hide after clearing
  });
});

describe('chat delete button removal', () => {
  it('removes one specific message after browser confirmation', async () => {
    const inputField = document.getElementById('input-field') as HTMLInputElement;
    const inputForm = document.getElementById('input-form') as HTMLFormElement;
    const chatMessages = document.getElementById('chat-messages') as HTMLElement;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true); // browser confirm should allow deletion in this test

    inputField.value = 'First';                                            // prepare the first message to create visible chat entries
    inputForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    inputField.value = 'Second';                                           // add a second message so only the newest one should be removed
    inputForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(chatMessages.children).toHaveLength(2);                         // make sure both messages were rendered before the shortcut runs

    const selectButtons = chatMessages.querySelectorAll('.message__select-btn');
    (selectButtons[0] as HTMLButtonElement).click();                     // select first message to show its delete button

    const deleteButtons = chatMessages.querySelectorAll('.message__delete-btn');
    (deleteButtons[0] as HTMLButtonElement).click();                     // remove the first selected message only

    expect(chatMessages.children).toHaveLength(1);                         // only the last rendered message should be removed
    expect(localStorage.getItem('chat-history')).not.toContain('First');   // removed message should no longer exist in storage
    expect(localStorage.getItem('chat-history')).toContain('Second');      // untouched message should still exist in storage
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this message?');
  });
});
