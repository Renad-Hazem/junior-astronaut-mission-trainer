export interface FaceCropSettings {
  zoom: number // 0.8 to 2.5
  panX: number // in px (-100 to 100)
  panY: number // in px (-100 to 100)
  feather: boolean
}

export interface DetectedFaceBox {
  x: number
  y: number
  width: number
  height: number
}

interface DetectedFace {
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface FaceDetectorInstance {
  detect: (
    image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ) => Promise<DetectedFace[]>
}

/**
 * Attempts to detect face coordinates using native browser FaceDetector API if available.
 */
export async function detectFaceCoordinates(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<DetectedFaceBox | null> {
  const win = window as unknown as {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorInstance
  }

  if (typeof win.FaceDetector === 'function') {
    try {
      const detector = new win.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
      const faces = await detector.detect(source)
      if (faces && faces.length > 0) {
        const { x, y, width, height } = faces[0].boundingBox
        return { x, y, width, height }
      }
    } catch (e) {
      console.info('FaceDetector API check completed with fallback:', e)
    }
  }

  return null
}

/**
 * Renders the photo through a circular/oval astronaut helmet mask,
 * removing the messy room background and blending the face into the spacesuit.
 */
export function extractFaceToCanvas(
  image: HTMLImageElement,
  settings: FaceCropSettings,
  canvas: HTMLCanvasElement,
  faceBox?: DetectedFaceBox | null
): string {
  const size = 320
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.clearRect(0, 0, size, size)

  // Determine base scale and center
  const imgW = image.naturalWidth || image.width
  const imgH = image.naturalHeight || image.height

  let focusX = imgW / 2
  let focusY = imgH / 2
  let initialScale = size / Math.min(imgW, imgH)

  // If face box was detected, center directly on the face
  if (faceBox) {
    focusX = faceBox.x + faceBox.width / 2
    focusY = faceBox.y + faceBox.height * 0.45 // slightly higher for eyes
    // Scale so the face fills about 60% of the astronaut visor
    initialScale = (size * 0.6) / Math.max(faceBox.width, faceBox.height)
  }

  const finalScale = initialScale * settings.zoom

  ctx.save()

  // 1. Create astronaut oval helmet mask with rounded chin
  ctx.beginPath()
  ctx.ellipse(size / 2, size / 2, size * 0.44, size * 0.47, 0, 0, Math.PI * 2)
  ctx.clip()

  // 2. Draw interior helmet shadow background
  ctx.fillStyle = '#0a102b'
  ctx.fillRect(0, 0, size, size)

  // 3. Draw image centered on face focus point + user pan adjustments
  const drawX = size / 2 - focusX * finalScale + settings.panX
  const drawY = size / 2 - focusY * finalScale + settings.panY

  ctx.drawImage(image, drawX, drawY, imgW * finalScale, imgH * finalScale)

  // 4. Feather edges if requested so head smoothly blends inside helmet
  if (settings.feather) {
    ctx.globalCompositeOperation = 'destination-in'
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.3,
      size / 2,
      size / 2,
      size * 0.48
    )
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)')
    grad.addColorStop(0.78, 'rgba(0, 0, 0, 1)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    // Reset composite
    ctx.globalCompositeOperation = 'source-over'
  }

  // 5. Add subtle astronaut visor golden ambient reflection
  const ambientSheen = ctx.createLinearGradient(0, 0, size, size)
  ambientSheen.addColorStop(0, 'rgba(240, 200, 104, 0.22)')
  ambientSheen.addColorStop(0.4, 'transparent')
  ambientSheen.addColorStop(1, 'rgba(85, 189, 235, 0.15)')
  ctx.fillStyle = ambientSheen
  ctx.fillRect(0, 0, size, size)

  ctx.restore()

  return canvas.toDataURL('image/png')
}
