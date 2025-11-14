import { useState } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import InstructionSlides from './components/InstructionSlides';
import OrientationCheck from './components/OrientationCheck';
import CameraCapture from './components/CameraCapture';
import ReviewSubmit from './components/ReviewSubmit';
import { DEZZEX_API_BASE_URL, DEZZEX_API_KEY, DEZZEX_DAMAGE_ASSESSMENT_VERSION } from './config';
import { dataURLtoBlob } from './utils/image';

type Step = 'welcome' | 'instructions' | 'orientation' | 'camera' | 'review' | 'submission';

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
    setStep('submission'); // Immediately go to submission screen

    // Run API call in background, don't block UI
    (async () => {
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
          // Optionally store/retry error
        }
        // Success: Optionally show notification later/trigger status poll etc.
        // No alert, no step set here, user already on submission screen
        setPhotos([]);
      } catch (error) {
        console.error('Error submitting damage assessment:', error);
        // Optionally store/retry error
      } finally {
        setIsSubmitting(false);
      }
    })();
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
      {step === 'submission' ? (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-blue-800 text-white">
        <div className="flex flex-col items-center p-10 bg-gray-950 rounded-2xl shadow-2xl border-2 border-blue-400 gap-6 max-w-lg text-center">
            <svg className="w-20 h-20 text-blue-300 mb-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2"/><path d="M7 13l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <h2 className="text-2xl font-bold mb-2">Thank you!</h2>
            <p className="text-lg font-medium text-blue-100 text-center max-w-xs">Your images have been submitted.<br />Our team is reviewing them. You will receive a response soon.</p>
          <div className="text-sm text-blue-200">
            Please keep this tab open in the background. You may minimize it while we process your assessment.
          </div>
          <div className="mt-2 text-xs text-blue-300 opacity-80">(You cannot submit new images until the process is complete.)</div>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

export default App;
