# Phase 1: Scanner Persistence & Performance - Implementation Plan

## Goal
Eliminate scanning latency and accuracy issues by optimizing the ZXing and Tesseract integration in `ImeiScannerModal.tsx`.

## Proposed Changes

### 1. Unified Canvas-Based Decoding [Orders.tsx](file:///Users/taaha/Desktop/Projects/Products/StockFlow/src/components/ImeiScannerModal.tsx)
Instead of letting ZXing manage its own high-frequency video stream decoding, we will implement a controlled "Region of Interest" (ROI) loop.
- **Action**: Use the existing `canvasRef` to capture a cropped center-box strip.
- **Action**: **Advanced Preprocessing**: Implement a lightweight **Adaptive Thresholding** (Otsu-style) algorithm on the canvas ROI. Unlike simple contrast, this handles uneven glare hotspots by normalizing local pixel neighborhoods.
- **Action**: **Sharpening**: Apply a 3x3 convolution kernel (sharpening matrix) to the canvas before decoding to counteract focal blur.

### 2. Hardware Overrides & Exposure Control
To solve the "Screen Glare" and "Blur" issues:
- **Action**: **Exposure Compensation**: Detect `exposureCompensation` capability. If glare is detected (high average brightness in ROI), automatically dial down exposure by -1.0 to -2.0 stops.
- **Action**: **Zoom & Focus**: Default the camera to a slight **1.2x - 1.5x zoom** if supported. This forces the user to stand further back (outside the focal "blur zone") while keeping the barcode large enough to read.
- **Action**: Request `ideal: 1920x1080` resolution to ensure no detail loss during the crop.

### 3. OCR & Barcode Loop Sync
- **Action**: Synchronize both engines to a single high-resolution capture interval.
- **Action**: Throttle the OCR engine to 800ms while keeping Barcode at 100ms for responsiveness.

## Verification Plan

### Manual Verification
- **Glare Stress Test**: Verify that a barcode on a bright phone screen with overhead office lights can be read at various angles.
- **Minimal Focal Test**: Confirm that the 1.5x zoom allows reading a small IMEI barcode from 25cm away (crystal clear) without needing to move into the "blur zone."
- **Android TWA Test**: Run inside PWABuilder wrapper to confirm `exposureCompensation` and `zoom` constraints are respected by the Android WebView.
