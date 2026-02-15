
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Map, MousePointer2 } from 'lucide-react';

export interface TourChoice {
  label: string;
  action?: () => void;
  nextStepId: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface TourStep {
  id: string;
  targetId?: string; // The HTML ID of the element to highlight
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  choices?: TourChoice[]; // If present, replaces standard Next/Back
  nextStepId?: string; // For linear flow without choices
  prevStepId?: string; // For linear flow back navigation
}

interface OnboardingTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, isOpen, onClose, onComplete }) => {
  const [currentStepId, setCurrentStepId] = useState<string>(steps[0]?.id);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [isFindingElement, setIsFindingElement] = useState(false);

  const currentStep = steps.find(s => s.id === currentStepId);

  // Helper to find element and calculate position with retry logic
  const updatePosition = useCallback(() => {
    if (!isOpen || !currentStep) return;
    
    // If center, no target needed
    if (currentStep.position === 'center' || !currentStep.targetId) {
      setCoords(null);
      setIsFindingElement(false);
      return;
    }

    const findElement = () => {
      const element = document.getElementById(currentStep.targetId!);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        // Auto scroll if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setIsFindingElement(false);
        return true;
      }
      return false;
    };

    // Try immediately
    if (findElement()) return;

    // Retry for elements that might be rendering (e.g. view change)
    setIsFindingElement(true);
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (findElement() || attempts > 10) {
        clearInterval(interval);
        if (attempts > 10) setIsFindingElement(false); // Give up
      }
    }, 200);

    return () => clearInterval(interval);

  }, [isOpen, currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  // Reset to first step when opening
  useEffect(() => {
    if (isOpen && steps.length > 0) {
        // Only reset if we are "lost" or just opening fresh might be better handled by parent, 
        // but here we ensure we have a valid step
        if (!steps.find(s => s.id === currentStepId)) {
            setCurrentStepId(steps[0].id);
        }
    }
  }, [isOpen, steps, currentStepId]);

  const handleChoice = (choice: TourChoice) => {
    if (choice.action) choice.action();
    
    if (choice.nextStepId === 'FINISH') {
      onComplete();
    } else {
      setCurrentStepId(choice.nextStepId);
    }
  };

  const handleNext = () => {
    if (currentStep?.nextStepId) {
        if (currentStep.nextStepId === 'FINISH') {
            onComplete();
        } else {
            setCurrentStepId(currentStep.nextStepId);
        }
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep?.prevStepId) {
      setCurrentStepId(currentStep.prevStepId);
    }
  };

  if (!isOpen || !currentStep) return null;

  const isCenter = !coords || currentStep.position === 'center';

  // Calculate Popover Position
  let popoverStyle: React.CSSProperties = {};
  
  if (isCenter) {
    popoverStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 60,
    };
  } else if (coords) {
    const gap = 16;
    let top = 0;
    let left = 0;
    
    switch (currentStep.position) {
      case 'right':
        top = coords.top;
        left = coords.left + coords.width + gap;
        break;
      case 'bottom':
        top = coords.top + coords.height + gap;
        left = coords.left;
        break;
      case 'top':
        top = coords.top - gap; 
        left = coords.left;
        break;
      case 'left':
        top = coords.top;
        left = coords.left - gap;
        break;
      default:
        top = coords.top + coords.height + gap;
        left = coords.left;
    }

    popoverStyle = {
      position: 'absolute',
      top,
      left,
      zIndex: 60,
      width: '320px',
      transform: currentStep.position === 'top' ? 'translateY(-100%)' : currentStep.position === 'left' ? 'translateX(-100%)' : 'none'
    };
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" />

      {/* Highlight Cutout */}
      {coords && !isFindingElement && (
        <div 
          className="absolute z-50 transition-all duration-500 ease-in-out border-2 border-indigo-500 rounded-lg shadow-[0_0_0_9999px_rgba(15,23,42,0.5)] pointer-events-none"
          style={{
            top: coords.top - 4,
            left: coords.left - 4,
            width: coords.width + 8,
            height: coords.height + 8,
          }}
        />
      )}

      {/* Popover Card */}
      <div 
        className="bg-white p-6 rounded-xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-300 flex flex-col"
        style={popoverStyle}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
             <Map size={20} />
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Gembook Guide
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2 font-serif">{currentStep.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {currentStep.content}
        </p>

        {/* Dynamic Controls */}
        <div className="mt-auto">
          {currentStep.choices ? (
             <div className="flex flex-col gap-2">
                 {currentStep.choices.map((choice, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleChoice(choice)}
                        className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                            choice.variant === 'secondary' 
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        }`}
                    >
                        {choice.label} {choice.variant !== 'secondary' && <ChevronRight size={14} />}
                    </button>
                 ))}
             </div>
          ) : (
            <div className="flex justify-between items-center">
                <button 
                    onClick={handlePrev}
                    disabled={!currentStep.prevStepId}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors disabled:opacity-0"
                >
                    Back
                </button>
                <button 
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                    {currentStep.nextStepId === 'FINISH' ? 'Finish' : 'Next'} <ChevronRight size={14} />
                </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
