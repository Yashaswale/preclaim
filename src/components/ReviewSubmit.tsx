import { CheckCircle, RotateCcw } from 'lucide-react';

interface ReviewSubmitProps {
  photos: Array<{ side: string; dataUrl: string }>;
  onSubmit: () => void;
  onRetake: () => void;
}

function ReviewSubmit({ photos, onSubmit, onRetake }: ReviewSubmitProps) {
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

        <div className="grid grid-cols-1 gap-4 mb-8">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
            >
              <div className="p-3 bg-gray-700">
                <h3 className="text-white font-semibold">{photo.side}</h3>
              </div>
              <div className="relative aspect-video bg-black">
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
            onClick={onSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all duration-200"
          >
            Submit Assessment
          </button>

          <button
            onClick={onRetake}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
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
