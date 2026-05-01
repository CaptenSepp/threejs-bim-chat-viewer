import type { Box3, Vector3 } from "three";

export type ChatHistoryIndexType = number | null; // delete buttons may have an index or no index yet

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

// Options passed when rendering one chat message.
export type AppendMessageOptionsType = {
  historyIndex?: ChatHistoryIndexType;
};

export type ModelSelectionType = {
  modelId: string;
  itemId: number;
  center?: Vector3;
  box?: Box3;
};

// Selection shape used when marker code needs a real center point.
export type ModelSelectionWithCenterType = ModelSelectionType & {
  center: Vector3;
};

// Small camera-control shape used by this project.
export type CameraControlsFitType = {
  fitToBox(box: Box3, smooth: boolean): Promise<void>;
};

// Small marker-service shape used by this project.
export type MarkerServiceType = {
  create(world: unknown, markerLabelElemTemp: HTMLElement, markerWorldPosition: Vector3, isStatic: boolean): string;
  delete(activeMarkerInstId: string): void;
};

// Small IFC-loader shape used by this project.
export type IfcLoaderLikeType = {
  setup(options: { autoSetWasm: boolean; wasm: { path: string; absolute: boolean } }): Promise<void>;
  load(bytes: Uint8Array, coordinate: boolean, modelId: string): Promise<unknown>;
};

// Small viewer-world shape used by app modules.
export type ViewerWorldType = {
  camera: {
    controls?: CameraControlsFitType;
    three: unknown;
  };
  renderer: {
    three: {
      domElement: HTMLCanvasElement;
      setAnimationLoop?: (callback: () => void) => void;
    };
    update(): void;
  } | null;
  scene: {
    three: {
      add(object: unknown): void;
    };
  };
};
