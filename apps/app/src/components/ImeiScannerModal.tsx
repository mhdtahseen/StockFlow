import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  X,
  Zap,
  ZapOff,
  Camera,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { sanitizeImei, isValidImeiLuhn } from "../utils/validateImei";
import { applyAdaptiveThreshold, applySharpen } from "../utils/scannerUtils";
import { ocrService } from "../utils/ocrService";
import { useHaptics } from "@/hooks/useHaptics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ImeiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (imei: string) => void;
}

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
    if (isValidImeiLuhn(candidate)) return candidate;
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
  const animationFrameRef = useRef<number | null>(null);
  const lastOcrTime = useRef<number>(0);
  const isMounted = useRef(false);
  const ocrBadgeRef = useRef<HTMLDivElement>(null);
  const isScanningInternal = useRef(false);
  const { triggerSuccess } = useHaptics();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);
  const [exposureLevel, setExposureLevel] = useState(0);
  const [canExposure, setCanExposure] = useState(false);

  // ─── Cleanup ───────────────────────────────────────────────────────────────

  const stopEverything = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    // We NO LONGER terminate the global OCR worker here to prevent the library crash
    // and provide "Instant-On" performance for the next scan.
    setFlashOn(false);
    setFlashSupported(false);
    setHasHardwareZoom(false);
    // setIsLoading(true) removed; prevents the "Flash-to-Black" flicker when closing or resets occur
    setError(null);
    if (ocrBadgeRef.current) ocrBadgeRef.current.style.opacity = "0";
    isScanningInternal.current = false;
  }, []);

  // ─── Constraints management ──────────────────────────────────────────────

  const applyHardwareConstraints = useCallback(async (constraints: any) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({ advanced: [constraints] });
    } catch (e) {
      console.warn("Failed to apply hardware constraints", e);
    }
  }, []);

  // ─── Start camera stream ────────────────────────────────────────────────

  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", 
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() || {};
      
      if ("torch" in caps) setFlashSupported(true);
      if ("zoom" in caps) {
        setHasHardwareZoom(true);
        // Start with a slight 1.2x zoom to clear focal blur zone
        const initialZoom = Math.max(1.2, (caps as any).zoom.min || 1);
        setZoomLevel(initialZoom);
        await applyHardwareConstraints({ zoom: initialZoom });
      }
      if ("exposureCompensation" in caps) {
        setCanExposure(true);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      return stream;
    } catch (err: any) {
      setError("Camera access required for scanning.");
      return null;
    }
  }, [applyHardwareConstraints]);

  // ─── Unified Processing Loop (Barcode + OCR) ─────────────────────────────

  const processingLoop = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !readerRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0) {
      animationFrameRef.current = requestAnimationFrame(processingLoop);
      return;
    }

    // 1. Define ROI - center strip
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cropW = vw * 0.9;
    const cropH = vh * 0.12; 
    const cropX = (vw - cropW) / 2;
    const cropY = (vh - cropH) / 2;

    const cW = Math.floor(cropW);
    const cH = Math.floor(cropH);
    if (canvas.width !== cW || canvas.height !== cH) {
      canvas.width = cW;
      canvas.height = cH;
    }
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // 2. Pre-processing
    const imageData = ctx.getImageData(0, 0, cropW, cropH);
    applySharpen(imageData);
    applyAdaptiveThreshold(imageData);
    ctx.putImageData(imageData, 0, 0);

    // 3. BARCODE
    try {
      const result = await readerRef.current.decodeFromCanvas(canvas);
      if (result) {
        const cleaned = sanitizeImei(result.getText());
        if (isValidImeiLuhn(cleaned)) {
          triggerSuccess();
          onScan(cleaned);
          stopEverything();
          onClose();
          return;
        }
      }
    } catch {}

    // 4. OCR
    const now = Date.now();
    if (now - lastOcrTime.current > 800 && !isScanningInternal.current && isMounted.current) {
      lastOcrTime.current = now;
      (async () => {
        if (!isMounted.current) return;

        try {
          if (ocrBadgeRef.current) ocrBadgeRef.current.style.opacity = "1";
          isScanningInternal.current = true;

          const rawText = await ocrService.recognize(canvas);
          
          if (!isMounted.current || !rawText) return; 

          const found = extractImeiFromText(rawText);
          if (found && streamRef.current) {
            triggerSuccess();
            onScan(found);
            stopEverything();
            onClose();
          }
        } catch (e) {
          console.warn("OCR Service: recognition failed", e);
        } finally {
          if (isMounted.current) {
            if (ocrBadgeRef.current) ocrBadgeRef.current.style.opacity = "0";
            isScanningInternal.current = false;
          }
        }
      })();
    }

    // Performance Throttle: Skip 1 frame to keep the UI buttery smooth
    animationFrameRef.current = requestAnimationFrame(() => {
      if (isMounted.current) {
        animationFrameRef.current = requestAnimationFrame(processingLoop);
      }
    });
  }, [onScan, onClose, stopEverything]);

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    isMounted.current = true;
    if (!isOpen) { 
      stopEverything(); 
      isMounted.current = false;
      return; 
    }
    const cancelled = { v: false };
    (async () => {
      try {
        // Just trigger the singleton initialization lazily
        await ocrService.getWorker();
        if (cancelled.v || !isMounted.current) return;
      } catch (e) { console.error("OCR Service Init Failed", e); }

      const stream = await startStream();
      if (!stream || cancelled.v) return;

      const reader = new BrowserMultiFormatReader();
      const hints = new Map();
      hints.set(2, [3, 1]); 
      (reader as any).hints = hints;
      readerRef.current = reader;

      setIsLoading(false);
      animationFrameRef.current = requestAnimationFrame(processingLoop);
    })();
    return () => { 
      cancelled.v = true; 
      isMounted.current = false;
      stopEverything(); 
    };
  }, [isOpen, startStream, processingLoop, stopEverything]);

  // ─── Controls ────────────────────────────────────────────────────────────

  const handleZoomChange = useCallback(async (val: number) => {
    setZoomLevel(val);
    if (hasHardwareZoom) {
      await applyHardwareConstraints({ zoom: val });
    } else if (videoRef.current) {
      // Digital Zoom Fallback: CSS Scale
      videoRef.current.style.transform = `scale(${val})`;
      videoRef.current.style.transformOrigin = "center center";
    }
  }, [hasHardwareZoom, applyHardwareConstraints]);

  const handleExposureToggle = () => {
    const nextExc = exposureLevel === 0 ? -1.5 : 0;
    setExposureLevel(nextExc);
    applyHardwareConstraints({ exposureCompensation: nextExc });
  };

  const toggleFlash = () => {
    const nextFlash = !flashOn;
    setFlashOn(nextFlash);
    applyHardwareConstraints({ torch: nextFlash });
  };

  const handleClose = () => {
    stopEverything();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Camera size={18} strokeWidth={2.5} className="text-primary-500" />
            <h3 className="text-sm font-black dark:text-slate-100">Scan IMEI</h3>
          </div>
          <div className="flex items-center gap-2">
            {canExposure && (
              <button
                type="button"
                onClick={handleExposureToggle}
                className={`size-9 rounded-full flex items-center justify-center transition-colors ${
                  exposureLevel !== 0 ? "bg-amber-100 text-amber-600" : "hover:bg-slate-100 text-slate-500"
                }`}
                title="Antiglare Mode"
              >
                <RefreshCw size={16} className={exposureLevel !== 0 ? "animate-pulse" : ""} />
              </button>
            )}
            {flashSupported && (
              <button
                type="button"
                onClick={toggleFlash}
                className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500"
              >
                {flashOn ? <Zap size={18} className="text-amber-500" /> : <ZapOff size={18} />}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="size-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="relative aspect-[4/3] bg-black mx-4 my-3 rounded-2xl overflow-hidden shadow-inner">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />

          {!isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="border-2 rounded-xl relative w-[90%] h-14 border-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-pulse top-1/2 -translate-y-1/2" />
              </div>
              <span className="mt-4 text-[10px] font-black bg-black/40 px-3 py-1 rounded-full text-emerald-400 tracking-wider">
                STABILIZING FOCUS...
              </span>
            </div>
          )}

          {/* ZOOM CONTROL - Visible on all devices (Hardware or Digital) */}
          {!isLoading && (
            <div className="absolute bottom-4 inset-x-0 px-6 flex items-center gap-3">
              <div className="flex-1 px-4 py-2 bg-slate-900/90 rounded-2xl flex items-center gap-4 pointer-events-auto shadow-lg border border-white/10">
                <span className="text-[10px] font-black text-white/70">1X</span>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.1"
                  value={zoomLevel}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="flex-1 accent-emerald-400 h-1 rounded-full appearance-none bg-white/20"
                />
                <span className="text-[10px] font-black text-white/70">{zoomLevel.toFixed(1)}X</span>
              </div>
            </div>
          )}

          {/* OCR ACTIVE BADGE - Passive DOM Layer to prevent React-driven flickering */}
          <div 
            ref={ocrBadgeRef}
            className="absolute top-3 right-3 bg-slate-900/90 rounded-lg px-2 py-1 flex items-center gap-2 transition-opacity duration-300 opacity-0 pointer-events-none"
          >
            <Loader2 size={10} className="text-white animate-spin" />
            <span className="text-[8px] font-black text-white tracking-widest">OCR ACTIVE</span>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-white animate-spin opacity-50" />
              <p className="text-white/70 text-sm font-black tracking-widest animate-pulse">BOOTING SCANNER...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle size={32} className="text-rose-400" />
              <p className="text-white/80 text-sm font-bold leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex flex-col items-center gap-2">
          {exposureLevel !== 0 && (
            <span className="text-[10px] font-black text-amber-500 tracking-tight flex items-center gap-1.5 opacity-80 mb-1">
              <Zap size={10} /> ANTI-GLARE MODE ACTIVE
            </span>
          )}
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center leading-tight">
            Use zoom to stay 20cm back<br />
            <span className="text-slate-300">prevents focal blur & glares</span>
          </p>
        </div>
      </div>
    </div>
  );
}
