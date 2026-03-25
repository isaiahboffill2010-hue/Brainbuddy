/**
 * Opens the browser's native screen/tab/window picker,
 * captures a single video frame, stops the stream immediately,
 * and returns a PNG data URL held only in JS memory.
 *
 * Returns null if the user cancelled or denied permission.
 */
export async function captureScreenFrame(): Promise<string | null> {
  // Must be called synchronously from a user-gesture handler so the
  // browser allows getDisplayMedia without a separate permission prompt.
  let stream: MediaStream | null = null;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 1 },
      audio: false,
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;

    // Wait until the video is ready to play and has real dimensions.
    await new Promise<void>((resolve, reject) => {
      video.oncanplay = () => resolve();
      video.onerror = () => reject(new Error("Video error"));
      video.play().catch(reject);
    });

    // One rAF guarantees the first frame has been decoded.
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("No video dimensions available");
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/png");
  } catch (err: unknown) {
    const e = err as { name?: string };
    // User closed the picker or denied permission — not an error worth logging.
    if (e?.name === "NotAllowedError" || e?.name === "AbortError") return null;
    console.error("[screenCapture] capture failed:", err);
    return null;
  } finally {
    // Stop every track immediately — we never record; one frame is all we need.
    stream?.getTracks().forEach((t) => t.stop());
  }
}
