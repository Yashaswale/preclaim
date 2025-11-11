import { Camera } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-full">
            <Camera className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Pre-Claim Policy Inspection
        </h1>

        <p className="text-blue-100 mb-12 text-lg">
          Take photos of your vehicle from all four sides for inspection
        </p>

        <button
          onClick={onStart}
          className="w-full bg-white text-blue-600 font-semibold py-4 px-8 rounded-lg shadow-lg hover:bg-blue-50 active:scale-95 transition-all duration-200 text-lg"
        >
          Start Assessment
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
