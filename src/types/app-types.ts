import type { Box3, Vector3 } from "three";

export type MarkerAttributesType = {
  name: string;
  objectType: string;
  tag: string;
  category: string;
  localId: string | number;
};

export type ModelReferenceType = {
  label: string;
  modelId: string;
  itemId: number;
  attributes?: MarkerAttributesType | null;
};

export type ChatMessageType = {
  time: number;
  reference: ModelReferenceType | null;
  text: string;
  sender: "user" | "assistant" | "system";
};

export type ApiReplyType = {
  reply?: string;
};

export type ModelSelectionType = {
  modelId: string;
  itemId: number;
  center?: Vector3;
  box?: Box3;
};
