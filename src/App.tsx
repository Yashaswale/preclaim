import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import InstructionSlides from './components/InstructionSlides';
import OrientationCheck from './components/OrientationCheck';
import CameraCapture from './components/CameraCapture';
import ReviewSubmit from './components/ReviewSubmit';

type Step = 'welcome' | 'instructions' | 'orientation' | 'camera' | 'review';

interface CapturedPhoto {
  side: string;
  dataUrl: string;
}

function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

  const handleStartAssessment = () => {
    setStep('instructions');
  };

  const handleInstructionsComplete = () => {
    setStep('orientation');
  };

  const handleOrientationComplete = () => {
    setStep('camera');
  };

  const handlePhotosComplete = (capturedPhotos: CapturedPhoto[]) => {
    setPhotos(capturedPhotos);
    setStep('review');
  };

  const handleSubmit = () => {
    alert('Photos submitted successfully!');
    setStep('welcome');
    setPhotos([]);
  };

  const handleRetake = () => {
    setPhotos([]);
    setStep('camera');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {step === 'welcome' && <WelcomeScreen onStart={handleStartAssessment} />}
      {step === 'instructions' && <InstructionSlides onComplete={handleInstructionsComplete} />}
      {step === 'orientation' && <OrientationCheck onComplete={handleOrientationComplete} />}
      {step === 'camera' && <CameraCapture onComplete={handlePhotosComplete} />}
      {step === 'review' && <ReviewSubmit photos={photos} onSubmit={handleSubmit} onRetake={handleRetake} />}
    </div>
  );
}

export default App;
