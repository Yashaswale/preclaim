import { CheckCircle, RotateCcw, XCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { CapturedPhoto } from '../App';

interface ReviewSubmitProps {
  photos: CapturedPhoto[];
  onSubmit: () => void;
  onRetake: () => void;
  onRetakeSingle: (sideId: string) => void;
  isSubmitting: boolean;
  uniqueReqId: string;
}

function ReviewSubmit({ photos, onSubmit, onRetake, onRetakeSingle, isSubmitting, uniqueReqId }: ReviewSubmitProps) {
  const getStatusBadge = (carDetected: boolean | null | undefined) => {
    if (carDetected === null || carDetected === undefined) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-600/20 border border-yellow-500/50 rounded-full">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 text-xs font-medium">Unknown</span>
        </div>
      );
    }
    if (carDetected) {
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-green-600/20 border border-green-500/50 rounded-full">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-xs font-medium">Car Detected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/50 rounded-full">
        <XCircle className="w-4 h-4 text-red-400" />
        <span className="text-red-400 text-xs font-medium">No Car Detected</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Review Your Photos
          </h2>
          <p className="text-gray-300">
            Make sure all vehicle sides are clearly visible
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-8">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-white">Request ID:</span> {uniqueReqId}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Keep this ID handy to track your assessment request.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {photos.map((photo, index) => (
            <div
              key={photo.sideId || index}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
            >
              <div className="p-3 bg-gray-700 flex items-center justify-between">
                <h3 className="text-white font-semibold">{photo.side}</h3>
                <div className="flex items-center gap-3">
                  {getStatusBadge(photo.carDetected)}
                  {photo.sideId && (
                    <button
                      type="button"
                      onClick={() => onRetakeSingle(photo.sideId!)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      Retake
                    </button>
                  )}
                </div>
              </div>
              {photo.detectionMessage && (
                <div
                  className={`px-3 py-2 text-xs font-medium border-t border-gray-700 ${
                    photo.carDetected === false
                      ? 'text-red-300'
                      : photo.carDetected === true
                      ? 'text-green-300'
                      : 'text-yellow-200'
                  }`}
                >
                  {photo.detectionMessage}
                </div>
              )}
              <div className="relative aspect-video bg-black border-4 border-blue-500 rounded-lg overflow-hidden m-4">
                <img
                  src={photo.dataUrl}
                  alt={photo.side}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || photos.length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800/60 disabled:text-gray-200 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Assessment'
            )}
          </button>

          <button
            type="button"
            onClick={onRetake}
            disabled={isSubmitting}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Retake Photos
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewSubmit;
