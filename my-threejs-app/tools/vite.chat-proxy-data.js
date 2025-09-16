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
  const toText = value => {
    if (value === undefined || value === null || value === '') return 'Not mentioned!';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const summaryParts = [];
  summaryParts.push(`Model ID: ${toText(reference.modelId)}`);
  summaryParts.push(`Item ID: ${toText(reference.itemId)}`);
  const attrsSource = reference.attributes;
  const attrs = attrsSource && typeof attrsSource === 'object' ? attrsSource : {};
  const attributePairs = [
    ['Name', attrs.Name ?? attrs.name],
    ['Object Type', attrs.ObjectType ?? attrs.objectType],
    ['Tag', attrs.Tag ?? attrs.tag],
    ['Category', attrs._category ?? attrs.category],
    ['Local ID', attrs._localId ?? attrs.localId],
  ];
  const attributeText = 'Eigenschaften: ' + attributePairs
    .map(([label, value]) => `${label}: ${toText(value)}`)
    .join(', ');
  summaryParts.push(attributeText);
  return `
Referenzdaten:
${summaryParts.join(', ')}`;
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

