declare module 'cropperjs' {
  export default class Cropper {
    constructor(element: HTMLImageElement, options?: Cropper.Options);
    destroy(): void;
    getCroppedCanvas(options?: Cropper.GetCroppedCanvasOptions): HTMLCanvasElement | null;
    
    static Options: {
      viewMode?: number;
      autoCrop?: boolean;
      autoCropArea?: number;
      background?: boolean;
      dragMode?: string;
      movable?: boolean;
      zoomable?: boolean;
      scalable?: boolean;
      rotatable?: boolean;
    };
    
    static GetCroppedCanvasOptions: {
      width?: number;
      height?: number;
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
      fillColor?: string;
      imageSmoothingEnabled?: boolean;
      imageSmoothingQuality?: string;
    };
  }

  namespace Cropper {
    interface Options {
      viewMode?: number;
      autoCrop?: boolean;
      autoCropArea?: number;
      background?: boolean;
      dragMode?: string;
      movable?: boolean;
      zoomable?: boolean;
      scalable?: boolean;
      rotatable?: boolean;
    }

    interface GetCroppedCanvasOptions {
      width?: number;
      height?: number;
      minWidth?: number;
      minHeight?: number;
      maxWidth?: number;
      maxHeight?: number;
      fillColor?: string;
      imageSmoothingEnabled?: boolean;
      imageSmoothingQuality?: string;
    }
  }
}
