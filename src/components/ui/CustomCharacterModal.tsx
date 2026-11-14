import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { getAvatarDefinition } from '../../pages/__stubs__/avatarAdapter'
import { AvatarPreview } from './AvatarPreview'
import {
  detectFaceCoordinates,
  extractFaceToCanvas,
  type DetectedFaceBox,
  type FaceCropSettings,
} from './faceExtractor'

interface CustomCharacterModalProps {
  currentPhoto: string | null
  onSave: (photoDataUrl: string) => void
  onClear: () => void
  onClose: () => void
}

export function CustomCharacterModal({
  currentPhoto,
  onSave,
  onClear,
  onClose,
}: CustomCharacterModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('upload')
  const [cameraRequested, setCameraRequested] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Raw source image (from camera snap or file upload)
  const [rawPhotoUrl, setRawPhotoUrl] = useState<string | null>(null)
  const [detectedFace, setDetectedFace] = useState<DetectedFaceBox | null>(null)
  const [isDetectingFace, setIsDetectingFace] = useState(false)

  // Extracted face image for the spacesuit
  const [extractedFaceUrl, setExtractedFaceUrl] = useState<string | null>(currentPhoto)

  // Face alignment settings
  const [settings, setSettings] = useState<FaceCropSettings>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    feather: true,
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rawImageRef = useRef<HTMLImageElement | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Start webcam only after the child explicitly chooses Start Camera.
  useEffect(() => {
    let currentStream: MediaStream | null = null
    let cancelled = false
    const videoElement = videoRef.current

    if (activeTab === 'camera' && cameraRequested && !rawPhotoUrl) {
      if (!navigator.mediaDevices?.getUserMedia) {
        return
      }

      navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
        })
        .then((mediaStream) => {
          if (cancelled) {
            mediaStream.getTracks().forEach((track) => track.stop())
            return
          }
          currentStream = mediaStream
          setStream(mediaStream)
          setCameraError(null)
          if (videoElement) {
            videoElement.srcObject = mediaStream
            videoElement.play().catch(() => {})
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err)
          setCameraError(
            'Unable to access camera. Please check browser permissions or use the Upload Photo tab.'
          )
        })
    }

    return () => {
      cancelled = true
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }
      if (videoElement) videoElement.srcObject = null
    }
  }, [activeTab, cameraRequested, rawPhotoUrl])

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.querySelector<HTMLElement>('button:not([disabled])')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog.addEventListener('keydown', onKeyDown)
    return () => {
      dialog.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  // Process and extract face onto canvas
  const processFaceExtraction = useCallback(
    (img: HTMLImageElement, faceBox?: DetectedFaceBox | null, customSettings?: FaceCropSettings) => {
      if (!canvasRef.current) return
      const s = customSettings ?? settings
      const extracted = extractFaceToCanvas(img, s, canvasRef.current, faceBox ?? detectedFace)
      if (extracted) {
        setExtractedFaceUrl(extracted)
      }
    },
    [settings, detectedFace]
  )

  // Update extracted face when zoom or pan changes
  useEffect(() => {
    if (rawImageRef.current) {
      processFaceExtraction(rawImageRef.current, detectedFace, settings)
    }
  }, [settings, detectedFace, processFaceExtraction])

  // Detect face on a new raw image
  const handleRawPhotoLoaded = async (dataUrl: string) => {
    setPhotoError(null)
    setRawPhotoUrl(dataUrl)
    setIsDetectingFace(true)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = async () => {
      rawImageRef.current = img
      const box = await detectFaceCoordinates(img)
      setDetectedFace(box)
      setIsDetectingFace(false)

      const initialSettings: FaceCropSettings = {
        zoom: box ? 1.05 : 1.0,
        panX: 0,
        panY: 0,
        feather: true,
      }
      setSettings(initialSettings)
      processFaceExtraction(img, box, initialSettings)
    }
    img.onerror = () => {
      setIsDetectingFace(false)
      setRawPhotoUrl(null)
      setPhotoError('That image could not be read. Please choose a JPG, PNG, or WebP photo.')
    }
    img.src = dataUrl
  }

  const handleSnapPhoto = () => {
    const video = videoRef.current
    if (!video) return

    const size = Math.min(video.videoWidth || 480, video.videoHeight || 480)
    const snapCanvas = document.createElement('canvas')
    snapCanvas.width = size
    snapCanvas.height = size
    const ctx = snapCanvas.getContext('2d')
    if (!ctx) return

    const startX = ((video.videoWidth || 480) - size) / 2
    const startY = ((video.videoHeight || 480) - size) / 2

    // Mirror for natural selfie orientation
    ctx.translate(snapCanvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, startX, startY, size, size, 0, 0, snapCanvas.width, snapCanvas.height)

    const dataUrl = snapCanvas.toDataURL('image/jpeg', 0.9)

    // Stop camera track after capture
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    handleRawPhotoLoaded(dataUrl)
  }

  const handleRetake = () => {
    setRawPhotoUrl(null)
    rawImageRef.current = null
    setDetectedFace(null)
    setExtractedFaceUrl(currentPhoto)
    setSettings({ zoom: 1.0, panX: 0, panY: 0, feather: true })
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Please choose a JPG, PNG, or WebP photo.')
      e.target.value = ''
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError('That photo is larger than 8 MB. Please choose a smaller image.')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleRawPhotoLoaded(reader.result)
      }
    }
    reader.onerror = () => setPhotoError('That photo could not be opened. Please choose another image.')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleConfirm = () => {
    if (extractedFaceUrl) {
      onSave(extractedFaceUrl)
      onClose()
    }
  }

  const selectSource = (source: 'camera' | 'upload') => {
    stream?.getTracks().forEach((track) => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setStream(null)
    setCameraRequested(false)
    setCameraError(null)
    setPhotoError(null)
    setActiveTab(source)
  }

  const requestCamera = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not provide camera access. You can still upload a photo.')
      setCameraRequested(true)
      return
    }
    setCameraError(null)
    setCameraRequested(true)
  }

  const customAvatarDef = getAvatarDefinition('avatar-custom')

  return (
    <div className="custom-character-modal-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="custom-character-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-modal-title"
      >
        <button
          type="button"
          className="custom-character-modal__close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <header className="custom-character-modal__header">
          <span className="eyebrow">MISSION CONTROL · CADET SUIT FITTER</span>
          <h2 id="custom-modal-title">Extract Face & Fit Astronaut Suit</h2>
          <p>
            {rawPhotoUrl
              ? 'Align the crop inside the spacesuit visor. Face detection is optional; the manual controls always remain available.'
              : 'Take a photo or choose one from this device. The image stays in this browser and is not sent to a server.'}
          </p>
        </header>

        <div className="custom-character-modal__body">
          {/* Left Column: Camera / Upload OR Face Alignment Studio */}
          <div className="custom-character-modal__source">
            {!rawPhotoUrl ? (
              <>
                <div className="custom-character-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'camera'}
                    className={`custom-tab-btn ${activeTab === 'camera' ? 'custom-tab-btn--active' : ''}`}
                    onClick={() => selectSource('camera')}
                  >
                    📷 Open Camera
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'upload'}
                    className={`custom-tab-btn ${activeTab === 'upload' ? 'custom-tab-btn--active' : ''}`}
                    onClick={() => selectSource('upload')}
                  >
                    📁 Upload Photo
                  </button>
                </div>

                {activeTab === 'camera' && (
                  <div className="camera-viewport-card">
                    {!cameraRequested ? (
                      <div className="camera-consent-box">
                        <strong>Camera stays off until you start it.</strong>
                        <p>Your photo is processed on this device and is never uploaded by ASTER BASE.</p>
                        <button
                          type="button"
                          className="primary-button"
                          onClick={requestCamera}
                        >
                          Start Camera
                        </button>
                      </div>
                    ) : cameraError ? (
                      <div className="camera-error-box">
                        <p>{cameraError}</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => selectSource('upload')}
                        >
                          Switch to Photo Upload
                        </button>
                      </div>
                    ) : (
                      <div className="camera-live-wrap">
                        <video
                          ref={videoRef}
                          playsInline
                          autoPlay
                          muted
                          className="camera-video-feed"
                        />
                        <div className="camera-face-guide">
                          <span className="face-oval-guide" />
                          <small>Center face inside helmet guide</small>
                        </div>
                      </div>
                    )}
                    {cameraRequested && !cameraError && (
                      <button
                        type="button"
                        className="primary-button snap-btn"
                        disabled={!stream}
                        onClick={handleSnapPhoto}
                      >
                        📸 Snap & Extract Face
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'upload' && (
                  <div className="upload-viewport-card">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="upload-dropzone"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span className="upload-icon">📂</span>
                      <strong>Choose a photo with your face</strong>
                      <small>JPG, PNG, WebP supported</small>
                    </button>
                    <small className="custom-character-privacy">
                      Photos stay on this device. ASTER BASE does not upload, identify, or analyze who you are.
                    </small>
                  </div>
                )}
                {photoError && <p className="custom-character-error" role="alert">{photoError}</p>}
              </>
            ) : (
              /* Face Alignment & Extraction Studio */
              <div className="face-align-studio">
                <div className="face-align-header">
                  <span className="section-kicker">
                    {isDetectingFace ? 'DETECTING FACE...' : detectedFace ? '✓ FACE DETECTED & CENTERED' : 'ADJUST FACE FIT'}
                  </span>
                  <button type="button" className="secondary-button small-btn" onClick={handleRetake}>
                    🔄 Retake / Change
                  </button>
                </div>

                {/* Extracted Face Canvas Preview */}
                <div className="face-canvas-wrap">
                  <canvas ref={canvasRef} className="extracted-face-canvas" />
                  <div className="face-visor-overlay-ring" />
                </div>

                {/* Alignment Sliders */}
                <div className="face-adjust-controls">
                  <label className="adjust-slider-row">
                    <span>🔍 Face Size / Zoom:</span>
                    <input
                      type="range"
                      min="0.7"
                      max="2.0"
                      step="0.05"
                      value={settings.zoom}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))
                      }
                    />
                  </label>

                  <label className="adjust-slider-row">
                    <span>↕️ Vertical Position:</span>
                    <input
                      type="range"
                      min="-70"
                      max="70"
                      step="2"
                      value={settings.panY}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, panY: parseInt(e.target.value, 10) }))
                      }
                    />
                  </label>

                  <label className="adjust-slider-row">
                    <span>↔️ Horizontal Position:</span>
                    <input
                      type="range"
                      min="-70"
                      max="70"
                      step="2"
                      value={settings.panX}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, panX: parseInt(e.target.value, 10) }))
                      }
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Astronaut Suit Preview */}
          <div className="custom-character-modal__preview">
            <span className="section-kicker">SPACESUIT VISOR PREVIEW</span>
            <div className="preview-astronaut-box">
              <AvatarPreview
                avatar={customAvatarDef}
                customPhotoUrl={extractedFaceUrl}
              />
              <span className="preview-cadet-name">Cadet You</span>
              <p className="preview-help">
                {extractedFaceUrl
                  ? 'Your extracted face is blended inside the helmet visor across all Aster Base menus, HUDs, and 3D exploration.'
                  : 'Capture or upload a photo to extract your face into the astronaut suit.'}
              </p>
            </div>
          </div>
        </div>

        <footer className="custom-character-modal__footer">
          {currentPhoto && (
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                onClear()
                setExtractedFaceUrl(null)
                onClose()
              }}
            >
              Remove Local Photo
            </button>
          )}
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!extractedFaceUrl}
            onClick={handleConfirm}
          >
            Add to Astronaut 🚀
          </button>
        </footer>
      </div>
    </div>
  )
}
