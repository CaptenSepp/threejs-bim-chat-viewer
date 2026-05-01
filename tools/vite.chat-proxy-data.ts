import type { IncomingMessage, ServerResponse } from 'node:http';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

function isJsonObject(value: JsonValue | object | null | undefined): value is JsonObject {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function parseHttpRequestJsonBody(incomingHttpRequest: IncomingMessage): Promise<JsonObject> { // reads HTTP request body stream and parses JSON chunks
  return new Promise<JsonObject>((resolveRequestBody, rejectRequestBody) => {        // accumulate request body characters into a single string
    let accumulatedRequestBodyText = '';
    incomingHttpRequest.on('data', (chunk: Buffer | string) => (accumulatedRequestBodyText += chunk)); // append incoming chunk to the buffer
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

export function buildReferenceSummaryForPrompt(referencePayload: JsonValue | undefined): string {  // include selection id plus marker attributes
  if (!isJsonObject(referencePayload)) return '';
  const stringifyReferenceValue = (value: JsonValue | undefined) => {
    if (value === undefined || value === null || value === '') return 'Not mentioned!';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };
  const referenceSummarySegments: string[] = [];
  referenceSummarySegments.push(`Model ID: ${stringifyReferenceValue(referencePayload.modelId)}`);
  referenceSummarySegments.push(`Item ID: ${stringifyReferenceValue(referencePayload.itemId)}`);
  const referenceAttributesSource = referencePayload.attributes;
  const referenceAttributes = isJsonObject(referenceAttributesSource) ? referenceAttributesSource : {};
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

export function sendHttpJsonResponse(outgoingHttpResponse: ServerResponse, responseStatusCode: number, responseBodyPayload: JsonValue): void { // tiny helper to send JSON responses
  outgoingHttpResponse.statusCode = responseStatusCode;                                                // set HTTP status code
  outgoingHttpResponse.setHeader('Content-Type', 'application/json');                                  // JSON content type header
  outgoingHttpResponse.end(JSON.stringify(responseBodyPayload));                                       // serialize payload and finish response
}

export function stringifyChatHistoryForPrompt(historyPayload: JsonValue | undefined): string { // return chat history as JSON text for prompts
  if (!Array.isArray(historyPayload)) return '[]';              // when payload missing or invalid -> empty history
  try {
    return JSON.stringify(historyPayload);                      // serialize list to JSON string (stable formatting)
  } catch {
    return '[]';                                                // fallback to empty history on stringify failure
  }
}
