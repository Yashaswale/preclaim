import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import InstructionSlides from './components/InstructionSlides';
import OrientationCheck from './components/OrientationCheck';
import CameraCapture from './components/CameraCapture';
import ReviewSubmit from './components/ReviewSubmit';

type Step = 'welcome' | 'instructions' | 'orientation' | 'camera' | 'review';

export interface CapturedPhoto {
  side: string;
  dataUrl: string;
  carDetected?: boolean | null; // null = checking, true = detected, false = not detected
  sideId?: string; // For identifying which side to retake
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
    // CameraCapture returns all photos (existing + newly captured), so we just replace
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

  const handleRetakeSingle = (sideId: string) => {
    // Remove the photo with the given sideId and go back to camera
    setPhotos((prev) => prev.filter((photo) => photo.sideId !== sideId));
    setStep('camera');
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {step === 'welcome' && <WelcomeScreen onStart={handleStartAssessment} />}
      {step === 'instructions' && <InstructionSlides onComplete={handleInstructionsComplete} />}
      {step === 'orientation' && <OrientationCheck onComplete={handleOrientationComplete} />}
      {step === 'camera' && <CameraCapture onComplete={handlePhotosComplete} existingPhotos={photos} />}
      {step === 'review' && <ReviewSubmit photos={photos} onSubmit={handleSubmit} onRetake={handleRetake} onRetakeSingle={handleRetakeSingle} />}
    </div>
  );
}

export default App;
