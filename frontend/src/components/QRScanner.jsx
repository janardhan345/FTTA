import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// QRScanner: opens the device camera and scans for a QR code.
// Uses the html5-qrcode library which handles camera permission requests,
// viewfinder UI, and QR detection automatically.
//
// Props:
//   onScanSuccess(decodedText) — called once when a QR is successfully read
//   onScanError(error)         — called on scan errors (can ignore most noise)
export default function QRScanner({ onScanSuccess, onScanError }) {
  // useRef holds the scanner instance so we can clean it up on unmount
  const scannerRef = useRef(null);

  useEffect(() => {
    const qrBoxSize = Math.max(180, Math.min(280, window.innerWidth - 96));

    // The second argument configures the scanner:
    //   fps: 10 = try to decode 10 times per second
    //   qrbox: the green scan area shown in the viewfinder
    // The third argument (false) = don't show verbose logs
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: qrBoxSize, height: qrBoxSize } },
      false
    );
    scannerRef.current = scanner;

    // .render() starts the camera and begins scanning
    // onScanSuccess fires once when a QR is detected with the decoded string
    scanner.render(onScanSuccess, onScanError ?? (() => {}));

    // Cleanup: stop the camera when this component is removed from the page
    // Without this, the camera stays on even after navigating away
    return () => {
      scanner.clear().catch(() => {});
    };
  }, []); // empty deps = run once on mount, cleanup on unmount

  return (
    <div>
      {/* html5-qrcode renders the camera viewfinder inside this div */}
      <div id="qr-reader" style={{ width: '100%', maxWidth: 400 }} />
    </div>
  );
}
