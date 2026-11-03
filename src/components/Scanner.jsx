import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Camera, RefreshCw, AlertCircle, Zap, ZapOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Scanner({ onScan, paused = false }) {
  const { t } = useTranslation()
  const [cameras, setCameras] = useState([])
  const [selectedCameraId, setSelectedCameraId] = useState('')
  const [cameraError, setCameraError] = useState(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isScanning, setIsScanning] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)

  const scannerRef = useRef(null)
  const isScanningRef = useRef(false)
  const elementId = 'mattrack-reader-viewport'

  // Get list of cameras
  useEffect(() => {
    let isMounted = true

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!isMounted) return
        if (devices && devices.length > 0) {
          setCameras(devices)
          // Prefer back/environment facing camera
          const backCam = devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          )
          setSelectedCameraId(backCam ? backCam.id : devices[0].id)
        } else {
          setCameraError('No cameras found on this device.')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        console.warn('Unable to get cameras:', err)
        setCameraError(err.message || 'Camera permission denied or camera not accessible.')
      })
      .finally(() => {
        if (isMounted) setIsInitializing(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Start/Stop scanner when selected camera or pause state changes
  useEffect(() => {
    if (!selectedCameraId || paused) {
      if (scannerRef.current && isScanningRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            isScanningRef.current = false
            setIsScanning(false)
          })
          .catch((e) => console.warn('Scanner stop error:', e))
      }
      return
    }

    let isSubscribed = true
    const html5QrCode = new Html5Qrcode(elementId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.DATA_MATRIX,
      ],
      verbose: false,
    })

    scannerRef.current = html5QrCode

    const config = {
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        const qrboxSize = Math.floor(minEdge * 0.75)
        return {
          width: Math.max(250, qrboxSize),
          height: Math.max(160, Math.floor(qrboxSize * 0.65)),
        }
      },
      aspectRatio: 1.333333,
    }

    html5QrCode
      .start(
        selectedCameraId,
        config,
        (decodedText, decodedResult) => {
          if (!isSubscribed) return
          // Trigger subtle haptic feedback on supported mobile devices
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 30, 80])
          }
          if (onScan) {
            onScan(decodedText, decodedResult)
          }
        },
        () => {
          // Scanner frame error (normal during searching, ignore)
        }
      )
      .then(() => {
        if (!isSubscribed) return
        isScanningRef.current = true
        setIsScanning(true)
        setCameraError(null)

        // Check if camera supports torch (flashlight)
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities()
          if (capabilities && 'torch' in capabilities) {
            setHasTorch(true)
          }
        } catch (e) {
          console.log('Torch capability check not supported', e)
        }
      })
      .catch((err) => {
        if (!isSubscribed) return
        console.error('Failed to start scanner:', err)
        setCameraError(t('scanner.cameraError'))
        isScanningRef.current = false
        setIsScanning(false)
      })

    return () => {
      isSubscribed = false
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear()
          })
          .catch((e) => console.warn('Error stopping scanner during cleanup:', e))
      }
    }
  }, [selectedCameraId, paused, onScan, t])

  // Toggle torch/flashlight
  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return
    try {
      const nextState = !torchOn
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }],
      })
      setTorchOn(nextState)
    } catch (e) {
      console.warn('Torch toggle failed:', e)
    }
  }

  // Switch between available cameras
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId)
    const nextIndex = (currentIndex + 1) % cameras.length
    setSelectedCameraId(cameras[nextIndex].id)
  }

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-black text-white shadow-2xl border-2 border-slate-700/60">
      {/* Viewport container where html5-qrcode mounts */}
      <div id={elementId} className="w-full min-h-[300px] max-h-[460px] overflow-hidden" />

      {/* Loading state */}
      {isInitializing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-6 z-20">
          <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          <p className="text-base font-semibold text-slate-200">
            {t('scanner.cameraLoading')}
          </p>
        </div>
      )}

      {/* Error state */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center z-20">
          <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-white mb-2">Camera Unavailable</h4>
          <p className="text-sm text-slate-300 max-w-sm mb-6">{cameraError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 active:scale-95 touch-manipulation"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Scanning Target Overlay Guidelines */}
      {isScanning && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10 p-4">
          <div className="relative w-64 h-40 border-2 border-dashed border-blue-400/80 rounded-2xl flex items-center justify-center">
            {/* Corner accents */}
            <div className="absolute -top-1 -start-1 w-6 h-6 border-t-4 border-s-4 border-blue-500 rounded-tl-lg" />
            <div className="absolute -top-1 -end-1 w-6 h-6 border-t-4 border-e-4 border-blue-500 rounded-tr-lg" />
            <div className="absolute -bottom-1 -start-1 w-6 h-6 border-b-4 border-s-4 border-blue-500 rounded-bl-lg" />
            <div className="absolute -bottom-1 -end-1 w-6 h-6 border-b-4 border-e-4 border-blue-500 rounded-br-lg" />

            {/* Red Laser Scanning Line animation */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse" />
          </div>

          <p className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-xs font-semibold text-slate-200 border border-slate-700">
            {t('scanner.instruction')}
          </p>
        </div>
      )}

      {/* On-screen controls bar (Switch camera, Torch) */}
      <div className="absolute top-3 end-3 flex items-center gap-2 z-20">
        {hasTorch && (
          <button
            type="button"
            onClick={toggleTorch}
            aria-label="Toggle Torch"
            className={`min-w-11 min-h-11 rounded-xl p-2.5 backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
              torchOn ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900/70 text-white hover:bg-slate-800'
            }`}
          >
            {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
          </button>
        )}

        {cameras.length > 1 && (
          <button
            type="button"
            onClick={handleSwitchCamera}
            aria-label={t('scanner.switchCamera')}
            title={t('scanner.switchCamera')}
            className="min-w-11 min-h-11 rounded-xl p-2.5 bg-slate-900/70 hover:bg-slate-800 backdrop-blur-md text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
          >
            <Camera className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
