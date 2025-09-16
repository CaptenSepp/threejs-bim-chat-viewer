// @ts-check

/** @param {any} incomingHttpRequest @returns {Promise<any>} */
export function parseHttpRequestJsonBody(incomingHttpRequest) {                      // reads HTTP request body stream and parses JSON chunks
  return new Promise((resolveRequestBody, rejectRequestBody) => {                    // accumulate request body characters into a single string
    let accumulatedRequestBodyText = '';
    incomingHttpRequest.on('data', chunk => (accumulatedRequestBodyText += chunk));  // append incoming chunk to the buffer
    incomingHttpRequest.on('end', () => {                                            // once stream ends, parse buffered text or fall back to {}
      try {
        resolveRequestBody(accumulatedRequestBodyText ? JSON.parse(accumulatedRequestBodyText) : {});
      } catch (requestBodyParseError) {
        rejectRequestBody(requestBodyParseError);
      }
    });
    incomingHttpRequest.on('error', rejectRequestBody);                              // bubble stream errors to callers
  });
}

export function buildReferenceSummaryForPrompt(referencePayload) {                   // include selection id plus marker attributes
  if (!referencePayload || typeof referencePayload !== 'object') return '';
  const stringifyReferenceValue = value => {
    if (value === undefined || value === null || value === '') return 'Not mentioned!';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const referenceSummarySegments = [];
  referenceSummarySegments.push(`Model ID: ${stringifyReferenceValue(referencePayload.modelId)}`);
  referenceSummarySegments.push(`Item ID: ${stringifyReferenceValue(referencePayload.itemId)}`);
  const referenceAttributesSource = referencePayload.attributes;
  const referenceAttributes = referenceAttributesSource && typeof referenceAttributesSource === 'object' ? referenceAttributesSource : {};
  const referenceAttributePairs = [
    ['Name', referenceAttributes.Name ?? referenceAttributes.name],
    ['Object Type', referenceAttributes.ObjectType ?? referenceAttributes.objectType],
    ['Tag', referenceAttributes.Tag ?? referenceAttributes.tag],
    ['Category', referenceAttributes._category ?? referenceAttributes.category],
    ['Local ID', referenceAttributes._localId ?? referenceAttributes.localId],
  ];
  const referenceSummaryText = 'Eigenschaften: ' + referenceAttributePairs
    .map(([attributeLabel, attributeValue]) => `${attributeLabel}: ${stringifyReferenceValue(attributeValue)}`)
    .join(', ');
  referenceSummarySegments.push(referenceSummaryText);
  return `
Referenzdaten:
${referenceSummarySegments.join(', ')}`;
}

/**
 * @param {{ statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }} outgoingHttpResponse
 * @param {number} responseStatusCode
 * @param {any} responseBodyPayload
 * @returns {void}
 */
export function sendHttpJsonResponse(outgoingHttpResponse, responseStatusCode, responseBodyPayload) {  // tiny helper to send JSON responses
  outgoingHttpResponse.statusCode = responseStatusCode;                                                // set HTTP status code
  outgoingHttpResponse.setHeader('Content-Type', 'application/json');                                  // JSON content type header
  outgoingHttpResponse.end(JSON.stringify(responseBodyPayload));                                       // serialize payload and finish response
}
