import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import InstructionSlides from './components/InstructionSlides';
import OrientationCheck from './components/OrientationCheck';
import CameraCapture from './components/CameraCapture';
import ReviewSubmit from './components/ReviewSubmit';
import { DEZZEX_API_BASE_URL, DEZZEX_API_KEY, DEZZEX_DAMAGE_ASSESSMENT_VERSION } from './config';
import { dataURLtoBlob } from './utils/image';

type Step = 'welcome' | 'instructions' | 'orientation' | 'camera' | 'review';

export interface CapturedPhoto {
  side: string;
  dataUrl: string;
  carDetected?: boolean | null; // null = checking, true = detected, false = not detected
  sideId?: string; // For identifying which side to retake
  detectionMessage?: string;
}

function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [uniqueReqId] = useState(() => {
    if (typeof window === 'undefined') {
      return `req-${Date.now()}`;
    }

    const params = new URLSearchParams(window.location.search);
    return (
      params.get('unique_req_id') ||
      params.get('req_id') ||
      params.get('request_id') ||
      `req-${Date.now()}`
    );
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (photos.length === 0 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      photos.forEach((photo, index) => {
        const blob = dataURLtoBlob(photo.dataUrl);
        const safeSideId = photo.sideId || `photo-${index + 1}`;
        formData.append('files', blob, `${safeSideId}.jpg`);
      });

      formData.append('unique_req_id', uniqueReqId);

      const response = await fetch(
        `${DEZZEX_API_BASE_URL}/api/damage_assessment/${DEZZEX_DAMAGE_ASSESSMENT_VERSION}`,
        {
          method: 'POST',
          headers: {
            'x-api-key': DEZZEX_API_KEY,
          },
          body: formData,
        },
      );

      const responseText = await response.text();
      let result: unknown = null;

      if (responseText) {
        try {
          result = JSON.parse(responseText);
        } catch (parseError) {
          console.warn('Unable to parse damage assessment response as JSON', parseError);
          result = responseText;
        }
      }

      if (!response.ok) {
        console.error('Damage assessment submission failed:', result);
        const message =
          typeof result === 'string'
            ? result
            : result
            ? JSON.stringify(result)
            : 'Unexpected error submitting assessment.';
        throw new Error(message);
      }

      console.log('Damage assessment response:', result);
      alert(`Photos submitted successfully! Request ID: ${uniqueReqId}`);
      setStep('welcome');
      setPhotos([]);
    } catch (error) {
      console.error('Error submitting damage assessment:', error);
      alert('Failed to submit photos. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      {step === 'review' && (
        <ReviewSubmit
          photos={photos}
          onSubmit={handleSubmit}
          onRetake={handleRetake}
          onRetakeSingle={handleRetakeSingle}
          isSubmitting={isSubmitting}
          uniqueReqId={uniqueReqId}
        />
      )}
    </div>
  );
}

export default App;
