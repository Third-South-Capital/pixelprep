import { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  id: string;
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showArrow?: boolean;
  children: React.ReactNode;
  className?: string;
  delay?: number;
  trigger?: 'hover' | 'click' | 'auto';
  onboardingStep?: number;
}

interface OnboardingState {
  currentStep: number;
  completedSteps: Set<string>;
  isActive: boolean;
  hasSeenOnboarding: boolean;
}

// Global onboarding state management
const onboardingState: OnboardingState = {
  currentStep: 0,
  completedSteps: new Set(),
  isActive: false,
  hasSeenOnboarding: false
};

const onboardingListeners = new Set<() => void>();
let onboardingInitialized = false;

function notifyListeners() {
  onboardingListeners.forEach(listener => listener());
}

export function useOnboarding() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(prev => prev + 1);
    onboardingListeners.add(listener);

    // Only initialize once globally to prevent race conditions
    if (!onboardingInitialized) {
      onboardingInitialized = true;

      // Check localStorage first - don't restart onboarding if user already completed it
      const hasCompleted = localStorage.getItem('pixelprep_onboarding_completed');
      if (hasCompleted) {
        console.log('[ONBOARDING] User has already completed onboarding, not starting');
        onboardingState.hasSeenOnboarding = true;
        onboardingState.isActive = false;
      } else {
        console.log('[ONBOARDING] Starting onboarding system for new user...');
        startOnboarding();
      }
    }

    return () => {
      onboardingListeners.delete(listener);
    };
  }, []);

  return {
    ...onboardingState,
    startOnboarding,
    completeStep,
    skipOnboarding,
    resetOnboarding
  };
}

function startOnboarding() {
  console.log('[ONBOARDING] Starting onboarding - isActive:', onboardingState.isActive);
  onboardingState.isActive = true;
  onboardingState.currentStep = 0;
  onboardingState.completedSteps.clear();
  onboardingState.hasSeenOnboarding = false;
  notifyListeners();
  console.log('[ONBOARDING] Started - currentStep:', onboardingState.currentStep, 'isActive:', onboardingState.isActive);
}

function completeStep(stepId: string) {
  console.log('[ONBOARDING] Completing step:', stepId);
  onboardingState.completedSteps.add(stepId);
  onboardingState.currentStep++;

  // Check if all steps are complete
  const totalSteps = 4; // Upload, presets, file-size, optimization
  if (onboardingState.completedSteps.size >= totalSteps) {
    onboardingState.isActive = false;
    onboardingState.hasSeenOnboarding = true;
    localStorage.setItem('pixelprep_onboarding_completed', 'true');
  }

  console.log('[ONBOARDING] After completion:', {
    completedSteps: onboardingState.completedSteps.size,
    currentStep: onboardingState.currentStep,
    isActive: onboardingState.isActive
  });
  notifyListeners();
}

function skipOnboarding(event?: Event | React.MouseEvent) {
  // Prevent event bubbling to avoid triggering other click handlers
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    // Only call stopImmediatePropagation if it exists (native Event has it, React MouseEvent doesn't)
    if ('stopImmediatePropagation' in event && typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
  }

  console.log('[ONBOARDING] Skipping onboarding - clearing all state');
  onboardingState.isActive = false;
  onboardingState.hasSeenOnboarding = true;
  onboardingState.currentStep = 0;
  onboardingState.completedSteps.clear();
  localStorage.setItem('pixelprep_onboarding_completed', 'true');

  // Cancel any pending auto-processing BEFORE notifying listeners
  if (typeof (window as any).cancelAutoProcessing === 'function') {
    console.log('[ONBOARDING] Cancelling auto-processing before skip');
    (window as any).cancelAutoProcessing();
  }

  notifyListeners();

  // Force all tooltips to hide immediately
  setTimeout(() => {
    const allTooltips = document.querySelectorAll('[data-onboarding-step]');
    allTooltips.forEach(tooltip => {
      const tooltipElement = tooltip.querySelector('[role="tooltip"]');
      if (tooltipElement) {
        (tooltipElement as HTMLElement).style.display = 'none';
      }
    });
  }, 50);
}

function resetOnboarding() {
  localStorage.removeItem('pixelprep_onboarding_completed');
  onboardingState.hasSeenOnboarding = false;
  onboardingState.isActive = false;
  onboardingState.completedSteps.clear();
  onboardingState.currentStep = 0;
  onboardingInitialized = false; // Allow re-initialization
  notifyListeners();
}

export function OnboardingTooltip({
  id,
  content,
  title,
  position = 'top',
  showArrow = true,
  children,
  className = '',
  delay = 200,
  trigger = 'auto',
  onboardingStep = 0
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { isActive, currentStep, completedSteps } = useOnboarding();

  // Determine if this tooltip should be shown
  useEffect(() => {
    // Immediately check localStorage for completion status
    const hasCompletedOnboarding = localStorage.getItem('pixelprep_onboarding_completed') === 'true';

    console.log(`[TOOLTIP ${id}] Effect running:`, {
      isActive,
      currentStep,
      onboardingStep,
      hasCompleted: completedSteps.has(id),
      trigger,
      hasSeenOnboarding: onboardingState.hasSeenOnboarding,
      localStorageCompleted: hasCompletedOnboarding
    });

    // Clear any existing timeout first
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // NEVER show tooltips if user has completed onboarding (localStorage check)
    // or if onboarding was skipped/completed or not active
    if (hasCompletedOnboarding || !isActive || onboardingState.hasSeenOnboarding) {
      console.log(`[TOOLTIP ${id}] Onboarding completed/not active/skipped, hiding`);
      setShouldShow(false);
      setIsVisible(false);
      return;
    }

    // Show tooltip if it's the current step and hasn't been completed
    const shouldShowTooltip = currentStep === onboardingStep && !completedSteps.has(id);
    console.log(`[TOOLTIP ${id}] Should show:`, shouldShowTooltip);
    setShouldShow(shouldShowTooltip);

    if (shouldShowTooltip && trigger === 'auto') {
      // Immediate show for first step, shorter delay for subsequent steps
      const actualDelay = onboardingStep === 0 ? 100 : delay;
      console.log(`[TOOLTIP ${id}] Setting timeout with delay:`, actualDelay);
      timeoutRef.current = setTimeout(() => {
        // Triple-check: localStorage, onboarding state, and component state
        const stillCompleted = localStorage.getItem('pixelprep_onboarding_completed') === 'true';
        if (!stillCompleted && onboardingState.isActive && !onboardingState.hasSeenOnboarding) {
          console.log(`[TOOLTIP ${id}] Showing tooltip after delay`);
          setIsVisible(true);
        } else {
          console.log(`[TOOLTIP ${id}] State changed during delay - not showing tooltip`);
        }
      }, actualDelay);
    } else {
      setIsVisible(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, currentStep, completedSteps, id, onboardingStep, delay, trigger]);

  const handleMouseEnter = () => {
    if (shouldShow && trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (shouldShow && trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleGotIt = () => {
    setIsVisible(false);
    completeStep(id);

    // Smooth transition to next step (only if onboarding is still active)
    setTimeout(() => {
      // Don't scroll if onboarding was skipped or completed
      if (!onboardingState.isActive || onboardingState.hasSeenOnboarding) {
        console.log(`[TOOLTIP ${id}] Skipping scroll - onboarding no longer active`);
        return;
      }

      // Auto-focus next interactive element if available
      const nextStepElements = document.querySelectorAll('[data-onboarding-step]');
      const nextElement = Array.from(nextStepElements).find(
        el => el.getAttribute('data-onboarding-step') === String(onboardingStep + 1)
      );
      if (nextElement && 'scrollIntoView' in nextElement) {
        nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  };

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      data-onboarding-step={onboardingStep}
    >
      {children}

      {/* Highlight ring for current onboarding step */}
      {shouldShow && (
        <div className="absolute inset-0 rounded-xl ring-4 ring-blue-400 ring-opacity-60 animate-pulse pointer-events-none z-10"></div>
      )}

      {/* Tooltip */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 w-80 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-gray-700
            animate-in fade-in slide-in-from-bottom-2 duration-200
            ${positionClasses[position]}
          `}
        >
          {showArrow && (
            <div className={`absolute w-0 h-0 border-8 ${arrowClasses[position]}`}></div>
          )}

          <div className="space-y-3">
            {title && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <h4 className="font-bold text-sm text-white">{title}</h4>
              </div>
            )}

            <p className="text-sm text-gray-200 leading-relaxed">{content}</p>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-400">
                Step {onboardingStep + 1} of 4
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => skipOnboarding(e)}
                  className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Skip tour
                </button>
                <button
                  onClick={handleGotIt}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-lg font-medium transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for onboarding controls
export function OnboardingControls() {
  const { isActive } = useOnboarding();

  // Only show controls in development mode or when onboarding is actively running
  // Don't show for new users who simply haven't completed onboarding yet
  const showControls = import.meta.env.DEV || isActive;

  if (showControls) {
    return (
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {/* Restart onboarding button */}
        <button
          onClick={startOnboarding}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors block"
          title="Start/Restart onboarding tour"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Development mode reset button */}
        {import.meta.env.DEV && (
          <button
            onClick={() => {
              localStorage.removeItem('pixelprep_onboarding_completed');
              resetOnboarding();
              console.log('[DEV] Onboarding state reset');
            }}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors block text-xs"
            title="[DEV] Reset onboarding localStorage"
          >
            🔄
          </button>
        )}
      </div>
    );
  }

  return null;
}