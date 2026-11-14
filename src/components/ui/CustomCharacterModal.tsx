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
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

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

  // Start webcam when camera tab is active and not adjusting
  useEffect(() => {
    let currentStream: MediaStream | null = null

    if (activeTab === 'camera' && !rawPhotoUrl) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
        })
        .then((mediaStream) => {
          currentStream = mediaStream
          setStream(mediaStream)
          setCameraError(null)
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream
            videoRef.current.play().catch(() => {})
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
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [activeTab, rawPhotoUrl])

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

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

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleRawPhotoLoaded(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleConfirm = () => {
    if (extractedFaceUrl) {
      onSave(extractedFaceUrl)
      onClose()
    }
  }

  const customAvatarDef = getAvatarDefinition('avatar-custom')

  return (
    <div className="custom-character-modal-backdrop" role="presentation">
      <div
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
              ? 'Align and fit your face inside the spacesuit visor. We remove the background so your face is seamlessly placed into your astronaut helmet!'
              : 'Take a photo with your camera or upload a picture to extract your face into the spacesuit visor.'}
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
                    onClick={() => setActiveTab('camera')}
                  >
                    📷 Open Camera
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'upload'}
                    className={`custom-tab-btn ${activeTab === 'upload' ? 'custom-tab-btn--active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                  >
                    📁 Upload Photo
                  </button>
                </div>

                {activeTab === 'camera' && (
                  <div className="camera-viewport-card">
                    {cameraError ? (
                      <div className="camera-error-box">
                        <p>{cameraError}</p>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => setActiveTab('upload')}
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
                    <button
                      type="button"
                      className="primary-button snap-btn"
                      disabled={Boolean(cameraError)}
                      onClick={handleSnapPhoto}
                    >
                      📸 Snap & Extract Face
                    </button>
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
                  </div>
                )}
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
              Reset to Standard Suit
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
