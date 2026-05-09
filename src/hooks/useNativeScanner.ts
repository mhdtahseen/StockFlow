import { useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { CameraPreview, CameraPreviewOptions } from "@capgo/camera-preview";
import { BarcodeScanner, Barcode } from "@capacitor-mlkit/barcode-scanning";
import { Filesystem, Directory } from "@capacitor/filesystem";

export interface NativeScannerFrame {
  /** Base64-encoded JPEG of the current camera frame */
  base64: string;
}

interface UseNativeScannerReturn {
  /** Whether the native scanner path is active */
  isNative: boolean;
  /** Start the native camera preview */
  startNativeCamera: (containerEl?: HTMLElement | null) => Promise<void>;
  /** Stop the native camera preview */
  stopNativeCamera: () => Promise<void>;
  /** Capture a single frame as base64 JPEG */
  captureFrame: () => Promise<NativeScannerFrame | null>;
  /** Run ML Kit barcode scanning on a base64 frame. Returns detected barcodes. */
  detectBarcodes: (base64: string) => Promise<Barcode[]>;
  /** Toggle torch on native camera */
  toggleTorch: (on: boolean) => Promise<void>;
  /** Set zoom level on native camera */
  setZoom: (factor: number) => Promise<void>;
}

export function useNativeScanner(): UseNativeScannerReturn {
  const isNative = Capacitor.isNativePlatform();
  const previewActiveRef = useRef(false);

  const startNativeCamera = useCallback(async (containerEl?: HTMLElement | null) => {
    if (!isNative || previewActiveRef.current) return;

    const options: CameraPreviewOptions = {
      position: "rear",
      parent: containerEl?.id ?? "camera-preview-container",
      className: "camera-preview",
      width: window.innerWidth,
      height: window.innerHeight,
      toBack: true,       // Render camera behind the WebView so our HTML overlay shows on top
      disableAudio: true,
      enableHighResolution: true,
    };
    await CameraPreview.start(options);
    previewActiveRef.current = true;
  }, [isNative]);

  const stopNativeCamera = useCallback(async () => {
    if (!isNative || !previewActiveRef.current) return;
    await CameraPreview.stop();
    previewActiveRef.current = false;
  }, [isNative]);

  const captureFrame = useCallback(async (): Promise<NativeScannerFrame | null> => {
    if (!isNative || !previewActiveRef.current) return null;
    try {
      const result = await CameraPreview.captureSample({ quality: 85 });
      return { base64: result.value };
    } catch {
      return null;
    }
  }, [isNative]);

  const detectBarcodes = useCallback(async (base64: string): Promise<Barcode[]> => {
    if (!isNative) return [];
    try {
      let path: string;
      if (Capacitor.getPlatform() === 'ios') {
        // iOS WKWebView ML Kit plugin accepts data URIs directly
        path = `data:image/jpeg;base64,${base64}`;
      } else {
        // Android: ML Kit needs a real file path — write to cache directory
        const filename = 'sf_scanner_frame.jpg';
        await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Cache,
        });
        const { uri } = await Filesystem.getUri({ path: filename, directory: Directory.Cache });
        path = uri;
      }

      const result = await BarcodeScanner.readBarcodesFromImage({
        path,
        formats: [], // empty = all formats (covers Code128, QR, EAN for IMEI barcodes)
      });
      return result.barcodes;
    } catch {
      return [];
    }
  }, [isNative]);

  const toggleTorch = useCallback(async (on: boolean) => {
    if (!isNative) return;
    try {
      if (on) {
        await BarcodeScanner.enableTorch();
      } else {
        await BarcodeScanner.disableTorch();
      }
    } catch {
      // Torch not available on this device — ignore
    }
  }, [isNative]);

  const setZoom = useCallback(async (factor: number) => {
    if (!isNative) return;
    try {
      await CameraPreview.setZoom({ factor });
    } catch {
      // Zoom not supported
    }
  }, [isNative]);

  return {
    isNative,
    startNativeCamera,
    stopNativeCamera,
    captureFrame,
    detectBarcodes,
    toggleTorch,
    setZoom,
  };
}
