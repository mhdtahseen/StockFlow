/**
 * Scanner Image Processing Utilities
 * Optimized for real-time barcode and OCR enhancement.
 */

/**
 * Applies an adaptive threshold (binarization) to ImageData.
 * This helps ZXing and Tesseract see through glare and uneven lighting.
 * 
 * Algorithm: Simple localized mean subtraction.
 */
export function applyAdaptiveThreshold(imageData: ImageData, windowSize: number = 25, offset: number = 15) {
  const { data, width, height } = imageData;
  const size = width * height;
  
  // 1. Grayscale pass
  const gray = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const idx = i * 4;
    gray[i] = (data[idx] * 77 + data[idx+1] * 151 + data[idx+2] * 28) >> 8;
  }

  // 2. Compute Integral Image (Summed Area Table)
  // We use Int32Array to prevent overflow for large images
  const integral = new Int32Array(size);
  for (let y = 0; y < height; y++) {
    let rowSum = 0;
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      rowSum += gray[idx];
      integral[idx] = rowSum + (y > 0 ? integral[idx - width] : 0);
    }
  }

  // 3. Adaptive Threshold pass using O(1) local mean lookup
  const half = (windowSize / 2) | 0;
  for (let y = 0; y < height; y++) {
    const y1 = Math.max(0, y - half);
    const y2 = Math.min(height - 1, y + half);
    
    for (let x = 0; x < width; x++) {
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(width - 1, x + half);
      
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      
      // I(x2, y2) - I(x1-1, y2) - I(x2, y1-1) + I(x1-1, y1-1)
      const sum = integral[y2 * width + x2]
                - (x1 > 0 ? integral[y2 * width + (x1 - 1)] : 0)
                - (y1 > 0 ? integral[(y1 - 1) * width + x2] : 0)
                + (x1 > 0 && y1 > 0 ? integral[(y1 - 1) * width + (x1 - 1)] : 0);

      const idx = y * width + x;
      const pixelValue = gray[idx];
      const threshold = (sum / count) - offset;
      const val = pixelValue > threshold ? 255 : 0;
      
      const outIdx = idx * 4;
      data[outIdx] = data[outIdx+1] = data[outIdx+2] = val;
      data[outIdx + 3] = 255;
    }
  }
}

/**
 * Applies a 3x3 Sharpening Convolution Kernel.
 * Forces edges to be more distinct for better focal performance.
 */
export function applySharpen(imageData: ImageData) {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  
  // Sharpening kernel:
  // [ 0, -1,  0 ]
  // [-1,  5, -1 ]
  // [ 0, -1,  0 ]
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // R, G, B
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
            sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        const outIdx = (y * width + x) * 4 + c;
        output[outIdx] = Math.min(255, Math.max(0, sum));
      }
      output[(y * width + x) * 4 + 3] = 255; // Alpha
    }
  }

  for (let i = 0; i < data.length; i++) {
    data[i] = output[i];
  }
}
