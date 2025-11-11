import { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

interface OrientationCheckProps {
  onComplete: () => void;
}

function OrientationCheck({ onComplete }: OrientationCheckProps) {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight;
      setIsLandscape(landscape);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    if (!isLandscape) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLandscape, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="animate-spin-slow">
              <RotateCw className="w-24 h-24 text-blue-400" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-16 border-4 border-blue-400 rounded-lg"></div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">
          Keep Your Phone Upright
        </h2>

        <p className="text-gray-300 mb-6">
          Hold your phone in portrait mode (vertically) while taking photos.
        </p>

        {isLandscape && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-red-200 font-medium">
              Please rotate your device to portrait mode
            </p>
          </div>
        )}

        {!isLandscape && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 mb-6">
            <p className="text-green-200 font-medium">
              Perfect! Starting camera...
            </p>
          </div>
        )}

        <style>{`
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}

export default OrientationCheck;
