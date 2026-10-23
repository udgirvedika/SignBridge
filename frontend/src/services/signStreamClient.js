const WS_URL =
  import.meta.env.VITE_SIGNBRIDGE_WS_URL ?? 'ws://127.0.0.1:8000/ws/sign-stream';
const TARGET_FPS = Number(import.meta.env.VITE_SIGNBRIDGE_FRAME_FPS ?? 12);
const JPEG_QUALITY = Number(
  import.meta.env.VITE_SIGNBRIDGE_JPEG_QUALITY ?? 0.8
);
const CAPTURE_WIDTH = Number(
  import.meta.env.VITE_SIGNBRIDGE_CAPTURE_WIDTH ?? 640
);
const CAPTURE_HEIGHT = Number(
  import.meta.env.VITE_SIGNBRIDGE_CAPTURE_HEIGHT ?? 480
);

export class SignStreamClient {
  constructor({ onStatusChange, onPrediction, onError }) {
    this.onStatusChange = onStatusChange;
    this.onPrediction = onPrediction;
    this.onError = onError;
    this.socket = null;
    this.stream = null;
    this.captureTimer = null;
    this.canvas = document.createElement('canvas');
    this.canvas.width = CAPTURE_WIDTH;
    this.canvas.height = CAPTURE_HEIGHT;
    this.isStopping = false;
  }

  async start(videoElement) {
    try {
      this.onStatusChange?.('connecting', 'Requesting camera access');

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: CAPTURE_WIDTH },
          height: { ideal: CAPTURE_HEIGHT },
          facingMode: 'user',
        },
        audio: false,
      });

      videoElement.srcObject = this.stream;
      await videoElement.play();

      this.onStatusChange?.('connecting', 'Connecting to recognition service');

      await new Promise((resolve, reject) => {
        const socket = new WebSocket(WS_URL);
        this.socket = socket;

        // Set a connection timeout of 3.5s so the UI responds quickly if backend is down
        const connectTimeout = window.setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            reject(new Error('Sign recognition service is offline (ws://127.0.0.1:8000).'));
          }
        }, 3500);

        socket.onopen = () => {
          window.clearTimeout(connectTimeout);
          this.onStatusChange?.('streaming', 'Camera active and translating signs');
          this.startCaptureLoop(videoElement);
          resolve();
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            this.onPrediction?.(payload);
          } catch {
            this.onError?.(new Error('Received unexpected data from recognition service'));
          }
        };

        socket.onerror = () => {
          window.clearTimeout(connectTimeout);
          reject(new Error('Sign recognition service is offline (ws://127.0.0.1:8000).'));
        };

        socket.onclose = () => {
          window.clearTimeout(connectTimeout);
          if (!this.isStopping) {
            this.onStatusChange?.('error', 'Recognition service disconnected');
          }
        };
      });
    } catch (error) {
      if (this.stream && error.message?.includes('recognition service')) {
        this.onStatusChange?.('offline', 'Camera active (Backend offline)');
        throw error;
      }
      await this.stop();
      throw error;
    }
  }

  startCaptureLoop(videoElement) {
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to initialize frame capture canvas');
    }

    const frameIntervalMs = Math.max(1000 / TARGET_FPS, 66);

    this.captureTimer = window.setInterval(() => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }

      context.drawImage(
        videoElement,
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
      const dataUrl = this.canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      this.socket.send(JSON.stringify({ frame: dataUrl }));
    }, frameIntervalMs);
  }

  async stop() {
    this.isStopping = true;

    if (this.captureTimer) {
      window.clearInterval(this.captureTimer);
      this.captureTimer = null;
    }

    if (this.socket) {
      if (
        this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING
      ) {
        this.socket.close();
      }
      this.socket = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.onStatusChange?.('idle', 'Camera stopped');
    this.isStopping = false;
  }
}
