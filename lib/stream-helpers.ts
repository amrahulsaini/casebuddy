/**
 * Stream Helpers for Server-Sent Events
 */

export interface StreamUpdate {
  type: 'status' | 'data_log' | 'image_result' | 'image_start' | 'error' | 'done';
  msg: string;
  progress: number;
  payload?: any;
}

export function createStreamUpdate(
  type: StreamUpdate['type'],
  message: string,
  progress: number = 0,
  payload: any = null
): string {
  return JSON.stringify({
    type,
    msg: message,
    progress,
    payload,
  }) + '\n';
}

export class StreamWriter {
  private encoder: TextEncoder;
  private controller: ReadableStreamDefaultController;

  constructor(controller: ReadableStreamDefaultController) {
    this.encoder = new TextEncoder();
    this.controller = controller;
  }

  send(
    type: StreamUpdate['type'],
    message: string,
    progress: number = 0,
    payload: any = null
  ) {
    const data = createStreamUpdate(type, message, progress, payload);
    this.controller.enqueue(this.encoder.encode(data));
  }
}
