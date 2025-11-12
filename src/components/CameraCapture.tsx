import { useEffect, useRef, useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { CapturedPhoto } from '../App';
import { useToast, ToastContainer } from './Toast';
import { DEZZEX_API_BASE_URL, DEZZEX_API_KEY } from '../config';
import { dataURLtoBlob } from '../utils/image';

interface CameraCaptureProps {
  onComplete: (photos: CapturedPhoto[]) => void;
  existingPhotos?: CapturedPhoto[];
}

type CarSide = 'front' | 'left' | 'rear' | 'right';

const SIDES: Array<{ id: CarSide; label: string; isVertical: boolean }> = [
  { id: 'front', label: 'Front of Vehicle', isVertical: true },
  { id: 'right', label: 'Right Side of Vehicle', isVertical: false },
  { id: 'rear', label: 'Rear of Vehicle', isVertical: true },
  { id: 'left', label: 'Left Side of Vehicle', isVertical: false },
];

const FRAME_CONFIG = {
  portrait: { x: 12, y: 4, width: 76, height: 92 },
  landscape: { x: 2, y: 14, width: 96, height: 72 },
};

// API call to check if car is detected
const checkIfCar = async (imageBlob: Blob): Promise<{ carDetected: boolean | null; message?: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    const response = await fetch(`${DEZZEX_API_BASE_URL}/api/check_if_car`, {
      method: 'POST',
      headers: {
        'x-api-key': DEZZEX_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error Response:', errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData ? JSON.stringify(errorData) : ''}`);
    }

    const data = await response.json();
    console.log('API Response:', data);

    if (typeof data === 'object' && data !== null) {
      if ('status' in data && data.status === false) {
        return {
          carDetected: null,
          message: typeof data.message === 'string' ? data.message : 'Unable to process image.',
        };
      }
      if ('car_found' in data) {
        const carFound = data.car_found === true;
        const message = typeof data.message === 'string' ? data.message : carFound ? 'Car detected in image.' : 'No car found in image.';
        console.log('Car detected (car_found):', carFound, message);
        return { carDetected: carFound, message };
      }
      if ('car_detected' in data) {
        const carDetected = data.car_detected === true;
        return { carDetected, message: typeof data.message === 'string' ? data.message : undefined };
      }
      if ('carDetected' in data) {
        const carDetected = data.carDetected === true;
        return { carDetected, message: typeof data.message === 'string' ? data.message : undefined };
      }
      if ('detected' in data) {
        const carDetected = data.detected === true;
        return { carDetected, message: typeof data.message === 'string' ? data.message : undefined };
      }
      if ('has_car' in data) {
        const carDetected = data.has_car === true;
        return { carDetected, message: typeof data.message === 'string' ? data.message : undefined };
      }
      if ('hasCar' in data) {
        const carDetected = data.hasCar === true;
        return { carDetected, message: typeof data.message === 'string' ? data.message : undefined };
      }
      if ('result' in data) {
        const carDetected = data.result === true || data.result === 'car_detected';
        return { carDetected, message: typeof data.message === 'string' ? data.message : undefined };
      }
      if ('message' in data && typeof data.message === 'string') {
        const message = data.message;
        const carDetected = /car/.test(message.toLowerCase()) && /(detected|found)/.test(message.toLowerCase());
        return { carDetected, message };
      }
    }

    console.warn('Unexpected API response format, defaulting to null:', data);
    return { carDetected: null, message: undefined };
  } catch (error) {
    console.error('Error checking car:', error);
    throw error;
  }
};

function CameraCapture({ onComplete, existingPhotos = [] }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSideIndex, setCurrentSideIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>(existingPhotos);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toasts, showToast, removeToast } = useToast();
  const isMountedRef = useRef(true);
  const capturedPhotosRef = useRef<CapturedPhoto[]>(existingPhotos);

  const currentSide = SIDES[currentSideIndex];
  const frame = currentSide.isVertical ? FRAME_CONFIG.portrait : FRAME_CONFIG.landscape;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    capturedPhotosRef.current = capturedPhotos;
  }, [capturedPhotos]);

  useEffect(() => {
    if (currentSide.isVertical) {
      showToast(`Hold your phone in portrait orientation for the ${currentSide.label.toLowerCase()}.`, 'info');
    } else {
      showToast(`Hold your phone in landscape orientation for the ${currentSide.label.toLowerCase()}.`, 'info');
    }
  }, [currentSide, showToast]);

  // Initialize with existing photos - find the next side to capture
  useEffect(() => {
    if (existingPhotos.length > 0) {
      setCapturedPhotos(existingPhotos);
      capturedPhotosRef.current = existingPhotos;
      const capturedSideIds = existingPhotos.map((p) => p.sideId);
      const nextIndex = SIDES.findIndex((side) => !capturedSideIds.includes(side.id));
      if (nextIndex !== -1) {
        setCurrentSideIndex(nextIndex);
      }
    }
  }, [existingPhotos]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (capturedPhotos.length === SIDES.length) {
      onComplete(capturedPhotos);
    }
  }, [capturedPhotos, onComplete]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const sideId = currentSide.id;
    const sideLabel = currentSide.label;
    const isVertical = currentSide.isVertical;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    const videoWidth = video.videoWidth || video.clientWidth;
    const videoHeight = video.videoHeight || video.clientHeight;

    if (isVertical) {
      canvas.width = videoHeight;
      canvas.height = videoWidth;
      ctx.save();
      ctx.translate(videoHeight / 2, videoWidth / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(video, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);
      ctx.restore();
    } else {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      ctx.restore();
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setIsCapturing(false);

    const newPhoto: CapturedPhoto = {
      side: sideLabel,
      dataUrl,
      sideId,
      carDetected: null,
      detectionMessage: undefined,
    };

    // Always use the correct updated list for all further logic
    const updatedPhotos = [
      ...capturedPhotos.filter((photo) => photo.sideId !== sideId),
      newPhoto
    ];
    setCapturedPhotos(updatedPhotos);
    capturedPhotosRef.current = updatedPhotos;

    // Advance to the next uncaptured side, or stop
    const capturedSideIds = updatedPhotos.map((p) => p.sideId);
    const nextIndex = SIDES.findIndex((side) => !capturedSideIds.includes(side.id));

    if (nextIndex !== -1) {
      setCurrentSideIndex(nextIndex);
    } else {
      stopCamera();
    }

    // Run detection in the background so the user can continue.
    void (async () => {
      try {
        const imageBlob = dataURLtoBlob(dataUrl);
        const { carDetected, message } = await checkIfCar(imageBlob);

        const basePhotos = capturedPhotosRef.current;
        const finalPhotos = basePhotos.map((photo) =>
          photo.sideId === sideId
            ? { ...photo, carDetected, detectionMessage: message }
            : photo
        );
        capturedPhotosRef.current = finalPhotos;
        if (isMountedRef.current) {
          setCapturedPhotos(finalPhotos);
        }
        if (finalPhotos.length === SIDES.length) {
          onComplete(finalPhotos);
        }
        if (!isMountedRef.current) {
          return;
        }
        if (carDetected === true) {
          showToast(message || 'Car detected in image.', 'success');
        } else if (carDetected === false) {
          showToast(message || 'No car found in image. You can continue and retake later if needed.', 'info');
        } else {
          showToast(message || 'Unable to determine if a car is present.', 'info');
        }
      } catch (error) {
        console.error('Error checking car:', error);
        if (!isMountedRef.current) {
          return;
        }
        showToast('Error checking car detection', 'error');
      }
    })();
  };

  return (
    <div className="min-h-screen bg-black relative flex flex-col">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <mask id="frame-mask">
                <rect width="100" height="100" fill="white" />
                <rect
                  x={frame.x.toString()}
                  y={frame.y.toString()}
                  width={frame.width.toString()}
                  height={frame.height.toString()}
                  fill="black"
                  rx="3"
                />
              </mask>
            </defs>
            <rect
              width="100"
              height="100"
              fill="rgba(0, 0, 0, 0.6)"
              mask="url(#frame-mask)"
            />
            <rect
              x={frame.x.toString()}
              y={frame.y.toString()}
              width={frame.width.toString()}
              height={frame.height.toString()}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="0.6"
              strokeDasharray="2,2"
              rx="3"
            />
          </svg>
        </div>

        {isCapturing && (
          <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 pt-4 pb-12 space-y-4">
        <div className="text-center">
          <h3 className="text-white text-xl font-semibold mb-2">
            {currentSide.label}
          </h3>
          <p className="text-gray-300 text-sm">
            Position the vehicle within the frame guide
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Hold your phone {currentSide.isVertical ? 'vertically (portrait)' : 'horizontally (landscape)'} for this photo.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          {SIDES.map((side) => {
            const isCompleted = capturedPhotos.some((p) => p.sideId === side.id);
            const isCurrent = side.id === currentSide.id;
            return (
              <div
                key={side.id}
                className={`w-3 h-3 rounded-full transition-all ${
                  isCompleted
                    ? 'bg-green-500'
                    : isCurrent
                    ? 'bg-blue-500 scale-125'
                    : 'bg-gray-600'
                }`}
              />
            );
          })}
        </div>

        <button
          onClick={capturePhoto}
          disabled={isCapturing || capturedPhotos.length === SIDES.length}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isCapturing ? (
            <>
              <Check className="w-5 h-5" />
              Captured!
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Capture {currentSide.label} ({Math.min(capturedPhotos.length + 1, SIDES.length)}/{SIDES.length})
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default CameraCapture;
