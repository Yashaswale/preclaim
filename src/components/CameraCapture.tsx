import { useEffect, useRef, useState } from 'react';
import { Camera, Check } from 'lucide-react';
import { CapturedPhoto } from '../App';
import { useToast, ToastContainer } from './Toast';

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

// Helper function to convert dataURL to Blob
const dataURLtoBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

// API call to check if car is detected
const checkIfCar = async (imageBlob: Blob): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('file', imageBlob, 'image.jpg');

    const response = await fetch('https://aiapi.dezzex.com/api/check_if_car', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('API Error Response:', errorData);
      throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData ? JSON.stringify(errorData) : ''}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    // Try multiple possible response formats
    if (typeof data === 'boolean') {
      return data;
    }
    if (typeof data === 'object' && data !== null) {
      // Check various possible field names
      if ('car_detected' in data) {
        const result = data.car_detected === true;
        console.log('Car detected (car_detected):', result);
        return result;
      }
      if ('carDetected' in data) {
        const result = data.carDetected === true;
        console.log('Car detected (carDetected):', result);
        return result;
      }
      if ('detected' in data) {
        const result = data.detected === true;
        console.log('Car detected (detected):', result);
        return result;
      }
      if ('has_car' in data) {
        const result = data.has_car === true;
        console.log('Car detected (has_car):', result);
        return result;
      }
      if ('hasCar' in data) {
        const result = data.hasCar === true;
        console.log('Car detected (hasCar):', result);
        return result;
      }
      if ('result' in data) {
        const result = data.result === true || data.result === 'car_detected';
        console.log('Car detected (result):', result);
        return result;
      }
      // If response has a message or status, check it
      if ('message' in data && typeof data.message === 'string') {
        const result = data.message.toLowerCase().includes('car') && 
               (data.message.toLowerCase().includes('detected') || data.message.toLowerCase().includes('found'));
        console.log('Car detected (message):', result);
        return result;
      }
    }
    
    // Default to false if we can't determine
    console.warn('Unexpected API response format, defaulting to false:', data);
    return false;
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
  const [isCheckingCar, setIsCheckingCar] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const currentSide = SIDES[currentSideIndex];

  // Initialize with existing photos - find the next side to capture
  useEffect(() => {
    if (existingPhotos.length > 0) {
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

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    canvas.width = videoHeight;
    canvas.height = videoWidth;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(videoHeight / 2, videoWidth / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(video, -videoWidth / 2, -videoHeight / 2, videoWidth, videoHeight);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setIsCapturing(false);
    setIsCheckingCar(true);

    // Create photo object with initial state (checking)
    const newPhoto: CapturedPhoto = {
      side: currentSide.label,
      dataUrl,
      sideId: currentSide.id,
      carDetected: null, // null means checking
    };

    // Add photo with checking state
    const photosWithNew = [...capturedPhotos, newPhoto];
    setCapturedPhotos(photosWithNew);

    // Call API to check if car is detected
    try {
      const imageBlob = dataURLtoBlob(dataUrl);
      const carDetected = await checkIfCar(imageBlob);

      // Update the photo with the detection result (replace the one we just added)
      const updatedPhoto = { ...newPhoto, carDetected };
      const finalPhotos = photosWithNew.map((p) =>
        p.sideId === currentSide.id ? updatedPhoto : p
      );
      setCapturedPhotos(finalPhotos);

      // Show toast notification
      if (carDetected) {
        showToast('Car detected in image', 'success');
      } else {
        showToast('No car detected in image', 'error');
      }

      // Move to next side or complete
      const capturedSideIds = finalPhotos.map((p) => p.sideId);
      const nextIndex = SIDES.findIndex((side) => !capturedSideIds.includes(side.id));
      
      if (nextIndex !== -1) {
        setCurrentSideIndex(nextIndex);
      } else {
        // All sides captured
        stopCamera();
        onComplete(finalPhotos);
      }
    } catch (error) {
      console.error('Error checking car:', error);
      showToast('Error checking car detection', 'error');
      // Photo already added with null status, so we keep it as is
      // (carDetected: null means unknown/error)
      const finalPhotos = photosWithNew;

      // Still proceed to next side or complete
      const capturedSideIds = finalPhotos.map((p) => p.sideId);
      const nextIndex = SIDES.findIndex((side) => !capturedSideIds.includes(side.id));
      
      if (nextIndex !== -1) {
        setCurrentSideIndex(nextIndex);
      } else {
        // All sides captured
        stopCamera();
        onComplete(finalPhotos);
      }
    } finally {
      setIsCheckingCar(false);
    }
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
                  x={currentSide.isVertical ? "20" : "5"}
                  y={currentSide.isVertical ? "20" : "15"}
                  width={currentSide.isVertical ? "60" : "90"}
                  height={currentSide.isVertical ? "60" : "70"}
                  fill="black"
                  rx="2"
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
              x={currentSide.isVertical ? "20" : "5"}
              y={currentSide.isVertical ? "20" : "15"}
              width={currentSide.isVertical ? "60" : "90"}
              height={currentSide.isVertical ? "60" : "70"}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="0.5"
              strokeDasharray="2,2"
              rx="2"
            />
          </svg>
        </div>

        {isCapturing && (
          <div className="absolute inset-0 bg-white animate-flash pointer-events-none" />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-white text-xl font-semibold mb-2">
            {currentSide.label}
          </h3>
          <p className="text-gray-300 text-sm">
            Position the vehicle within the frame guide
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
          disabled={isCapturing || isCheckingCar}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isCapturing ? (
            <>
              <Check className="w-5 h-5" />
              Captured!
            </>
          ) : isCheckingCar ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Checking for car...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Capture {currentSide.label} ({capturedPhotos.length + 1}/{SIDES.length})
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
