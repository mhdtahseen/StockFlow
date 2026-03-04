import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import {
  X,
  Zap,
  ZapOff,
  Camera,
  AlertCircle,
  Loader2,
  Hash,
  ScanBarcode,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { createWorker } from "tesseract.js";
import { sanitizeImei, isValidImeiFormat } from "../utils/validateImei";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImeiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (imei: string) => void;
}

type ScanMode = "barcode" | "ocr";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract all 15-digit runs from raw OCR text */
function extractImeiFromText(raw: string): string | null {
  const cleaned = raw
    .replace(/\s/g, "")
    .replace(/[oO]/g, "0")
    .replace(/[lI]/g, "1");
  const matches = cleaned.match(/\d{14,16}/g);
  if (!matches) return null;
  for (const m of matches) {
    const candidate = sanitizeImei(m.substring(0, 15));
    if (isValidImeiFormat(candidate)) return candidate;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImeiScannerModal({
  isOpen,
  onClose,
  onScan,
}: ImeiScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ocrWorkerRef = useRef<Awaited<ReturnType<typeof createWorker>> | null>(
    null,
  );
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [ocrSuggestion, setOcrSuggestion] = useState<string | null>(null);
  const [ocrScanning, setOcrScanning] = useState(false);

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  const stopEverything = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    ocrWorkerRef.current?.terminate().catch(() => {});
    ocrWorkerRef.current = null;
    setFlashOn(false);
    setFlashSupported(false);
    setIsLoading(true);
    setError(null);
    setOcrSuggestion(null);
    setOcrScanning(false);
  }, []);

  // ─── Start camera stream (shared) ─────────────────────────────────────────

  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.();
      if (caps && "torch" in caps) setFlashSupported(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      return stream;
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setError("Camera permission denied. Please allow camera access.");
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        setError("No camera found on this device.");
      } else {
        setError("Could not start camera. Please try again.");
      }
      return null;
    }
  }, []);

  // ─── Dual Scanner (Optical & Text) ────────────────────────────────────────

  const startDualScanner = useCallback(
    async (stream: MediaStream, cancelled: { v: boolean }) => {
      // 1. Initialize Barcode Reader
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      reader.decodeFromStream(stream, videoRef.current!, (result, _err) => {
        if (cancelled.v) return;
        if (result) {
          const text = result.getText();
          const cleaned = sanitizeImei(text);
          if (isValidImeiFormat(cleaned)) {
            onScan(cleaned);
            stopEverything();
            onClose();
          }
        }
      });

      // 2. Initialize OCR Engine concurrently
      try {
        const worker = await createWorker("eng", 1, {
          workerPath:
            "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
          corePath:
            "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core-simd.wasm.js",
          logger: () => {},
        });

        if (cancelled.v) {
          await worker.terminate();
          return;
        }

        ocrWorkerRef.current = worker;
        await worker.setParameters({ tessedit_char_whitelist: "0123456789" });
      } catch (e) {
        console.error("OCR initialization failed", e);
        // Continue anyway; barcode scanner is still running
      }

      setIsLoading(false);

      // 3. OCR Analysis Loop
      captureIntervalRef.current = setInterval(async () => {
        if (
          cancelled.v ||
          !videoRef.current ||
          !canvasRef.current ||
          !ocrWorkerRef.current
        )
          return;
        if (ocrScanning) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx || video.videoWidth === 0) return;

        // Crop to the inner guide box area (~80% width, centre strip)
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const cropW = vw * 0.85;
        const cropH = 80;
        const cropX = (vw - cropW) / 2;
        const cropY = vh / 2 - cropH / 2;

        canvas.width = cropW;
        canvas.height = cropH;
        ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        try {
          setOcrScanning(true);
          const { data } = await ocrWorkerRef.current.recognize(canvas);
          if (cancelled.v) return;

          const found = extractImeiFromText(data.text);
          if (found) {
            setOcrSuggestion(found);
            // Auto-accept if it's a completely valid format
            if (isValidImeiFormat(found)) {
              onScan(found);
              stopEverything();
              onClose();
            }
          }
        } catch {
          // ignore OCR errors silently
        } finally {
          setOcrScanning(false);
        }
      }, 1200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScan, onClose, ocrScanning, stopEverything],
  );

  // ─── Main effect: start/stop based on isOpen ───────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      stopEverything();
      return;
    }

    setOcrSuggestion(null);
    setError(null);
    setIsLoading(true);

    const cancelled = { v: false };

    (async () => {
      const stream = await startStream();
      if (!stream || cancelled.v) return;

      await startDualScanner(stream, cancelled);
    })();

    return () => {
      cancelled.v = true;
      stopEverything();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ─── Flash toggle ──────────────────────────────────────────────────────────

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !flashOn } as any],
      });
      setFlashOn(!flashOn);
    } catch {
      // not supported
    }
  };

  // ─── Confirm OCR suggestion ────────────────────────────────────────────────

  const confirmSuggestion = () => {
    if (ocrSuggestion) {
      onScan(ocrSuggestion);
      stopEverything();
      onClose();
    }
  };

  const handleClose = () => {
    stopEverything();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl dark:shadow-black/50 border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Camera
              size={18}
              strokeWidth={2.5}
              className="text-[#064a98] dark:text-blue-400"
            />
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Scan IMEI
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {flashSupported && (
              <button
                type="button"
                onClick={toggleFlash}
                className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              >
                {flashOn ? (
                  <Zap size={18} className="text-amber-500" />
                ) : (
                  <ZapOff size={18} />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Camera viewport */}
        <div className="relative aspect-[4/3] bg-black mx-4 my-3 rounded-2xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Hidden canvas for OCR frame capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scan guide overlay */}
          {!isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 rounded-xl relative w-[90%] h-14 border-emerald-400/80">
                {/* OCR scanning line animation */}
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-bounce top-1/2 -translate-y-1/2" />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/70 whitespace-nowrap">
                  Align IMEI barcode or digits inside the box
                </span>
              </div>
            </div>
          )}

          {/* OCR spinning indicator */}
          {ocrScanning && !isLoading && (
            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
              <RefreshCw size={12} className="text-white animate-spin" />
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-white animate-spin" />
              <p className="text-white/70 text-sm font-semibold">
                Starting scanner engine…
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 p-6">
              <AlertCircle size={32} className="text-rose-400" />
              <p className="text-white/80 text-sm font-semibold text-center leading-relaxed">
                {error}
              </p>
              <button
                onClick={handleClose}
                className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* OCR detected number banner */}
        {ocrSuggestion && (
          <div className="mx-4 mb-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Text Detected (Verify)
              </p>
              <p className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm tracking-widest truncate">
                {ocrSuggestion}
              </p>
            </div>
            <button
              type="button"
              onClick={confirmSuggestion}
              className="shrink-0 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-lg transition-colors"
            >
              Use
            </button>
          </div>
        )}

        {/* Footer hint */}
        <div className="px-5 pb-4 text-center">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Scanning for barcodes and printed numbers...
          </p>
        </div>
      </div>
    </div>
  );
}
