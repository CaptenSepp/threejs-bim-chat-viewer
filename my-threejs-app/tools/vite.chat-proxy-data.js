// @ts-check

/** @param {any} httpRequest @returns {Promise<any>} */
export function readRequestJsonBody(httpRequest) {                            // reads request body stream and parses JSON, (which arrives in chunks)
  return new Promise((resolve, reject) => {                            // accumulate chunks into a string 
    let requestBodyText = '';
    httpRequest.on('data', chunk => (requestBodyText += chunk));       // append chunks
    httpRequest.on('end', () => {                                      // on stream end, parse or default {}
      try { resolve(requestBodyText ? JSON.parse(requestBodyText) : {}); } catch (e) { reject(e); }
    });
    httpRequest.on('error', reject);                                   // bubble stream errors
  });
}

export function formatReferenceForPrompt(reference) { // include selection id plus marker attributes
  if (!reference || typeof reference !== 'object') return '';
  const lines = [];
  const toText = value => {
    if (value === undefined || value === null || value === '') return 'Not mentioned!';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const appendLine = (label, value) => {
    const textValue = toText(value);
    if (textValue) lines.push(label + ': ' + textValue);
  };
  appendLine('Model ID', reference.modelId);
  appendLine('Item ID', reference.itemId);
  const attrs = reference.attributes;
  const attributeSegments = [];
  let hasAttributeDetails = false; // track whether any attribute text exists
  const appendAttribute = (label, value) => {
    const textValue = toText(value);
    if (!textValue || textValue === 'Not mentioned!') return;
    hasAttributeDetails = true;
    attributeSegments.push(label + ': ' + textValue);
  };
  if (attrs && typeof attrs === 'object') {
    appendAttribute('Name', attrs.name ?? attrs.Name);
    appendAttribute('Object Type', attrs.objectType ?? attrs.ObjectType);
    appendAttribute('Tag', attrs.tag ?? attrs.Tag);
    appendAttribute('Category', attrs.category ?? attrs._category);
    appendAttribute('Local ID', attrs.localId ?? attrs._localId);
  }
  if (hasAttributeDetails) {
    lines.push('Eigenschaften: ' + attributeSegments.join(', '));
  } else if (attrs && typeof attrs === 'object') {
    lines.push('Eigenschaften: Not mentioned!');
  }
  if (!lines.length) {
    const fallback = Object.entries(reference)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .slice(0, 5)
      .map(([key, value]) => key + ': ' + toText(value));
    lines.push(...fallback);
  }
  if (!lines.length) return '';
  return '\n\nReferenzdaten:\n' + lines.join('\\n');
}

/**
 * @param {{ statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }} httpResponse
 * @param {number} httpStatusCode
 * @param {any} responseBody
 * @returns {void}
 */
export function sendJsonResponse(httpResponse, httpStatusCode, responseBody) {            // tiny helper to send JSON responses
  httpResponse.statusCode = httpStatusCode;                            // set HTTP status code
  httpResponse.setHeader('Content-Type', 'application/json');          // JSON content type
  httpResponse.end(JSON.stringify(responseBody));                      // serialize and finish response
}

