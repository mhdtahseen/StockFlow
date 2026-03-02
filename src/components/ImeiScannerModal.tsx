import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/library";
import { X, Zap, ZapOff, Camera, AlertCircle, Loader2 } from "lucide-react";
import { sanitizeImei, isValidImeiFormat } from "../utils/validateImei";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImeiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (imei: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImeiScannerModal({
  isOpen,
  onClose,
  onScan,
}: ImeiScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flashOn, setFlashOn] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // ─── Cleanup helper ────────────────────────────────────────────────────────

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setFlashOn(false);
    setFlashSupported(false);
    setIsLoading(true);
    setError(null);
  }, []);

  // ─── Start scanner on open ────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let cancelled = false;

    async function startScanner() {
      setIsLoading(true);
      setError(null);

      try {
        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        // Check flash (torch) support
        const videoTrack = stream.getVideoTracks()[0];
        const caps = videoTrack.getCapabilities?.();
        if (caps && "torch" in caps) {
          setFlashSupported(true);
        }

        // Attach to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start barcode reader
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        reader.decodeFromStream(stream, videoRef.current!, (result, err) => {
          if (cancelled) return;

          if (result) {
            const text = result.getText();
            const cleaned = sanitizeImei(text);

            if (isValidImeiFormat(cleaned)) {
              onScan(cleaned);
              stopScanner();
              onClose();
            } else {
              setError(
                `Scanned "${text}" — not a valid 15-digit IMEI. Try again.`,
              );
            }
          }
          // Ignore DecodeHintType / NotFoundException (continuous scanning)
        });

        setIsLoading(false);
      } catch (err: any) {
        if (cancelled) return;

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
        setIsLoading(false);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isOpen, onScan, onClose, stopScanner]);

  // ─── Flash toggle ─────────────────────────────────────────────────────────

  const toggleFlash = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !flashOn } as any],
      });
      setFlashOn(!flashOn);
    } catch {
      // Flash toggle not supported on this device
    }
  };

  // ─── Close handler ────────────────────────────────────────────────────────

  const handleClose = () => {
    stopScanner();
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
              Scan IMEI Barcode
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
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Scanning overlay guide */}
          {!isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[75%] h-16 border-2 border-white/60 rounded-xl relative">
                {/* Scanning line animation */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400/80 animate-pulse" />
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-white animate-spin" />
              <p className="text-white/70 text-sm font-semibold">
                Starting camera…
              </p>
            </div>
          )}

          {/* Error state */}
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

        {/* Footer hint */}
        <div className="px-5 py-3 text-center">
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Point camera at the IMEI barcode on the device box or SIM tray
          </p>
        </div>
      </div>
    </div>
  );
}
