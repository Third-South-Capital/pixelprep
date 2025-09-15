interface ProgressIndicatorProps {
  currentStep: 'upload' | 'preset' | 'download';
  isProcessing?: boolean;
}

export function ProgressIndicator({ currentStep, isProcessing = false }: ProgressIndicatorProps) {
  const steps = [
    {
      key: 'upload',
      label: 'Upload Image',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      )
    },
    {
      key: 'preset',
      label: 'Select Preset',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      key: 'download',
      label: 'Download Result',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  ];

  const getStepState = (stepKey: string) => {
    const stepOrder = ['upload', 'preset', 'download'];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return isProcessing ? 'processing' : 'active';
    return 'pending';
  };

  return (
    <div className="mb-8">
      <div className="flex justify-center">
        <div className="bg-secondary/60 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-primary/30">
          <div className="flex items-center justify-center max-w-lg mx-auto space-x-3">
            {steps.map((step, index) => {
              const state = getStepState(step.key);
              const isLast = index === steps.length - 1;

              return (
                <div key={step.key} className="flex items-center">
                  {/* Step Circle and Label - Horizontal layout */}
                  <div className="flex items-center">
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out
                      ${state === 'completed'
                        ? 'bg-green-500 text-white'
                        : state === 'active'
                          ? 'bg-accent-primary text-white'
                          : state === 'processing'
                            ? 'bg-accent-primary text-white animate-pulse'
                            : 'bg-border text-tertiary'
                      }
                    `}>
                      {state === 'processing' ? (
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : state === 'completed' ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                      )}
                    </div>

                    {/* Step Label - Now positioned to the right and more compact */}
                    <div className="ml-2">
                      <p className={`
                        text-xs font-medium transition-colors duration-300 whitespace-nowrap
                        ${state === 'completed'
                          ? 'text-green-600'
                          : state === 'active' || state === 'processing'
                            ? 'text-accent-primary'
                            : 'text-tertiary'
                        }
                      `}>
                        {step.label}
                      </p>
                    </div>
                  </div>

                  {/* Connector Line - Smaller and more subtle */}
                  {!isLast && (
                    <div className={`
                      w-6 h-px mx-2 transition-all duration-300 ease-in-out
                      ${state === 'completed'
                        ? 'bg-green-500'
                        : 'bg-border'
                      }
                    `}>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Simplified status text */}
          <div className="mt-3 text-center">
            <p className="text-xs text-tertiary">
              {currentStep === 'upload' && !isProcessing && 'Step 1 of 3'}
              {currentStep === 'preset' && !isProcessing && 'Step 2 of 3'}
              {currentStep === 'download' && 'Complete'}
              {isProcessing && 'Processing...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}