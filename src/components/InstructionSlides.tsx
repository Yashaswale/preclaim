import { useState } from 'react';
import { ChevronRight, SmartphoneNfc, CheckCircle2, XCircle } from 'lucide-react';

interface InstructionSlidesProps {
  onComplete: () => void;
}

function InstructionSlides({ onComplete }: InstructionSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'Turn Off Auto-Rotation',
      icon: <SmartphoneNfc className="w-20 h-20 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-200">
            Before we begin, please turn off your phone's auto-rotation feature.
          </p>
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mt-6">
            <p className="text-blue-200 text-sm">
              This ensures the camera stays in the correct orientation while you take photos.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Photo Tips - Do\'s',
      icon: <CheckCircle2 className="w-20 h-20 text-green-400" />,
      content: (
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Ensure good lighting conditions</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Keep the vehicle within the frame guide</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Take photos from a reasonable distance</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Ensure the entire vehicle is visible</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Photo Tips - Don\'ts',
      icon: <XCircle className="w-20 h-20 text-red-400" />,
      content: (
        <div className="space-y-3 text-left">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Don't take photos in very dark conditions</p>
          </div>
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Don't block any part of the vehicle</p>
          </div>
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Don't capture blurry or shaky images</p>
          </div>
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <p className="text-gray-200">Don't stand too far from the vehicle</p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            {currentSlideData.icon}
          </div>
          <h2 className="text-2xl font-bold text-white mb-6">
            {currentSlideData.title}
          </h2>
          <div className="text-center">
            {currentSlideData.content}
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-blue-500'
                  : 'w-2 bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {currentSlide < slides.length - 1 ? 'Next' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default InstructionSlides;
