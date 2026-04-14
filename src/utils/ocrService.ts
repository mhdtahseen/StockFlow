import { createWorker, Worker } from "tesseract.js";

/**
 * OCR Singleton Service
 * Manages a persistent Tesseract worker to avoid expensive create/terminate 
 * cycles and prevent the "postMessage of null" library crash.
 */
class OcrService {
  private worker: Worker | null = null;
  private isInitializing: boolean = false;
  private initPromise: Promise<Worker> | null = null;

  /**
   * Initializes the worker if not already initialized or in progress.
   */
  async getWorker(): Promise<Worker> {
    if (this.worker) return this.worker;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      try {
        // Use a dummy logger to silence WASM/LSTM background statistics
        const worker = await createWorker("eng", 1, {
          logger: () => {}, // Silences the console spam
          errorHandler: (err) => console.warn("Tesseract Worker Error:", err),
        });
        
        await worker.setParameters({
          tessedit_char_whitelist: "0123456789",
          tessedit_pageseg_mode: "6", // "Single uniform block" - more robust for IMEIs on boxes/labels
        });
        this.worker = worker;
        return worker;
      } catch (error) {
        this.initPromise = null;
        this.isInitializing = false;
        throw error;
      } finally {
        this.isInitializing = false;
      }
    })();

    return this.initPromise;
  }

  /**
   * Performs OCR on a canvas.
   * Safe to call even if worker isn't ready (will wait).
   */
  async recognize(canvas: HTMLCanvasElement): Promise<string | null> {
    try {
      const worker = await this.getWorker();
      const { data } = await worker.recognize(canvas);
      return data.text;
    } catch (error) {
      console.warn("OCR Service: Recognition failed", error);
      return null;
    }
  }

  /**
   * Only called on app-level destruction (rarely used in SPA).
   */
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initPromise = null;
    }
  }
}

export const ocrService = new OcrService();
