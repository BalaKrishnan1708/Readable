export interface GazeFlowPacket {
  GazeX: number;
  GazeY: number;
  HeadX: number;
  HeadY: number;
  HeadZ: number;
  HeadYaw: number;
  HeadPitch: number;
  HeadRoll: number;
}

export interface GazeFlowSample extends GazeFlowPacket {
  receivedAt: number;
}

export type GazeFlowStatus =
  | "idle"
  | "connecting"
  | "authorizing"
  | "connected"
  | "closed"
  | "error";
