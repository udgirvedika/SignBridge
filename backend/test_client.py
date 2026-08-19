import asyncio
import base64
import contextlib
import json

import cv2
import websockets

WEBSOCKET_URL = "ws://127.0.0.1:8000/ws/sign-stream"
TARGET_FPS = 12
JPEG_QUALITY = 80


async def receive_predictions(websocket: websockets.WebSocketClientProtocol) -> None:
    async for raw_message in websocket:
        try:
            payload = json.loads(raw_message)
            print(
                f"prediction={payload.get('prediction')} "
                f"confidence={payload.get('confidence')}"
            )
        except json.JSONDecodeError:
            print(f"Received non-JSON message: {raw_message}")


async def stream_webcam() -> None:
    capture = cv2.VideoCapture(0)
    if not capture.isOpened():
        raise RuntimeError("Unable to open the default webcam")

    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY]

    try:
        async with websockets.connect(WEBSOCKET_URL, max_size=None) as websocket:
            receiver_task = asyncio.create_task(receive_predictions(websocket))

            try:
                while True:
                    success, frame = capture.read()
                    if not success:
                        print("Skipping frame because webcam read failed")
                        await asyncio.sleep(1 / TARGET_FPS)
                        continue

                    ok, encoded = cv2.imencode(".jpg", frame, encode_params)
                    if not ok:
                        print("Skipping frame because JPEG encoding failed")
                        await asyncio.sleep(1 / TARGET_FPS)
                        continue

                    payload = {
                        "frame": base64.b64encode(encoded.tobytes()).decode("utf-8")
                    }
                    await websocket.send(json.dumps(payload))
                    await asyncio.sleep(1 / TARGET_FPS)
            finally:
                receiver_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await receiver_task
    finally:
        capture.release()


if __name__ == "__main__":
    try:
        asyncio.run(stream_webcam())
    except KeyboardInterrupt:
        print("Webcam streaming stopped")
