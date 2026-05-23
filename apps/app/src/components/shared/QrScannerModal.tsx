/**
 * QrScannerModal — Full-screen camera overlay for scanning QR codes.
 *
 * Uses @zxing/browser (same lib as ImeiScannerModal) with QR-only hints for
 * fast decode. Accepts three QR value formats:
 *   1. com.hyllos.finventree://connect/{CODE}
 *   2. https://finventree.app/connect/{CODE}
 *   3. Raw 6-char Trade Code (A-Z2-9)
 *
 * On success → calls onScan(code) with the extracted 6-char trade code.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { X, Keyboard, Loader2 } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRADE_CODE_RE = /^[A-Z2-9]{6}$/;

/** Extract a 6-char trade code from a QR value string. */
function extractTradeCode(raw: string): string | null {
  const trimmed = raw.trim();

  // Deep link: com.hyllos.finventree://connect/ABC123
  const deepLink = trimmed.match(
    /com\.hyllos\.finventree:\/\/connect\/([A-Z2-9]{6})/i,
  );
  if (deepLink) return deepLink[1].toUpperCase();

  // Web link: https://finventree.app/connect/ABC123
  const webLink = trimmed.match(
    /finventree\.app\/connect\/([A-Z2-9]{6})/i,
  );
  if (webLink) return webLink[1].toUpperCase();

  // Raw code
  const upper = trimmed.toUpperCase();
  if (TRADE_CODE_RE.test(upper)) return upper;

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the 6-char trade code extracted from the QR. */
  onScan: (code: string) => void;
  /** Called when user taps "Type code manually". */
  onManualEntry: () => void;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  onScan,
  onManualEntry,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const isMounted = useRef(false);
  const { triggerSuccess } = useHaptics();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Cleanup ─────────────────────────────────────────────────────────────

  const stopEverything = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    readerRef.current = null;
    setError(null);
  }, []);

  // ─── Start ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;
    isMounted.current = true;
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const start = async () => {
      try {
        // Request camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        // Wire video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setIsLoading(false);

        // Create QR-only reader
        const reader = new BrowserQRCodeReader();
        readerRef.current = reader;

        // Continuous decode from the video element
        const controls = await reader.decodeFromStream(stream, videoRef.current!, (result, err) => {
          if (!isMounted.current || cancelled) return;
          if (result) {
            const code = extractTradeCode(result.getText());
            if (code) {
              triggerSuccess();
              onScan(code);
              stopEverything();
              onClose();
            }
          }
          // Ignore decode errors (no QR visible yet) — they're expected
        });
        controlsRef.current = controls;
      } catch (err: any) {
        if (!cancelled) {
          setError("Camera access is required to scan QR codes.");
          setIsLoading(false);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      isMounted.current = false;
      stopEverything();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 pt-safe-area-inset-top">
        <div className="pt-3">
          <h2 className="text-white text-sm font-bold">Scan QR Code</h2>
          <p className="text-white/60 text-[11px]">
            Point at a Finventree QR code
          </p>
        </div>
        <button
          onClick={() => { stopEverything(); onClose(); }}
          className="mt-3 size-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition-transform"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Camera feed */}
      <div className="flex-1 relative overflow-hidden bg-black">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          playsInline
          muted
          autoPlay
        />

        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Dimmed border — semi-transparent around, transparent center */}
          <div className="relative w-64 h-64">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-xl" />

            {/* Scan line animation */}
            <div className="absolute inset-x-4 top-4 h-0.5 bg-violet-400/80 rounded-full animate-[scanLine_2s_ease-in-out_infinite]" />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 size={32} className="text-white animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center">
              <p className="text-white text-sm">{error}</p>
              <button
                onClick={() => { stopEverything(); onClose(); }}
                className="mt-4 px-6 py-2 bg-white/20 text-white text-sm font-bold rounded-full active:scale-95 transition-transform"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 inset-x-0 z-10 pb-safe-area-inset-bottom">
        <div className="px-4 pb-6 pt-4">
          <button
            onClick={() => {
              stopEverything();
              onClose();
              onManualEntry();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 backdrop-blur-md text-white text-sm font-semibold rounded-2xl active:scale-[0.98] transition-transform"
          >
            <Keyboard size={16} />
            Type code manually
          </button>
        </div>
      </div>

      {/* Scan-line animation keyframes */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(224px); }
        }
      `}</style>
    </div>
  );
}
