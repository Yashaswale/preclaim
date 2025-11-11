import { useEffect, useRef, useState } from 'react';
import { Camera, Check } from 'lucide-react';

interface CameraCaptureProps {
  onComplete: (photos: Array<{ side: string; dataUrl: string }>) => void;
}

type CarSide = 'front' | 'left' | 'rear' | 'right';

const SIDES: Array<{ id: CarSide; label: string; isVertical: boolean }> = [
  { id: 'front', label: 'Front of Vehicle', isVertical: true },
  { id: 'right', label: 'Right Side of Vehicle', isVertical: false },
  { id: 'rear', label: 'Rear of Vehicle', isVertical: true },
  { id: 'left', label: 'Left Side of Vehicle', isVertical: false },
];

function CameraCapture({ onComplete }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSideIndex, setCurrentSideIndex] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState<Array<{ side: string; dataUrl: string }>>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const currentSide = SIDES[currentSideIndex];

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

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(video, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const newPhoto = { side: currentSide.label, dataUrl };
    const updatedPhotos = [...capturedPhotos, newPhoto];
    setCapturedPhotos(updatedPhotos);

    setTimeout(() => {
      setIsCapturing(false);

      if (currentSideIndex < SIDES.length - 1) {
        setCurrentSideIndex(currentSideIndex + 1);
      } else {
        stopCamera();
        onComplete(updatedPhotos);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-auto object-cover"
            style={{
              transform: 'rotate(90deg)',
              transformOrigin: 'center center',
              width: '100vh',
              height: '100vw',
            }}
          />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <mask id="frame-mask">
                <rect width="100" height="100" fill="white" />
                <rect
                  x={currentSide.isVertical ? "15" : "10"}
                  y={currentSide.isVertical ? "25" : "30"}
                  width={currentSide.isVertical ? "70" : "80"}
                  height={currentSide.isVertical ? "50" : "40"}
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
              x={currentSide.isVertical ? "15" : "10"}
              y={currentSide.isVertical ? "25" : "30"}
              width={currentSide.isVertical ? "70" : "80"}
              height={currentSide.isVertical ? "50" : "40"}
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

      <div className="bg-gradient-to-t from-black via-black to-transparent p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-white text-xl font-semibold mb-2">
            {currentSide.label}
          </h3>
          <p className="text-gray-300 text-sm">
            Position the vehicle within the frame guide
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          {SIDES.map((side, index) => (
            <div
              key={side.id}
              className={`w-3 h-3 rounded-full transition-all ${
                index < currentSideIndex
                  ? 'bg-green-500'
                  : index === currentSideIndex
                  ? 'bg-blue-500 scale-125'
                  : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={capturePhoto}
          disabled={isCapturing}
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
              Capture Photo ({currentSideIndex + 1}/{SIDES.length})
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
