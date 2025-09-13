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
    <div className="mb-12">
      <div className="flex justify-center">
        <div className="bg-secondary rounded-2xl p-8 shadow-lg border border-primary">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => {
              const state = getStepState(step.key);
              const isLast = index === steps.length - 1;

              return (
                <div key={step.key} className="flex items-center">
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <div className={`
                      relative w-16 h-16 rounded-full border-3 flex items-center justify-center transition-all duration-500 ease-in-out
                      ${state === 'completed'
                        ? 'bg-green-500 border-green-500 text-white shadow-lg'
                        : state === 'active'
                          ? 'bg-primary border-accent-primary text-accent-primary shadow-lg ring-4 ring-accent-primary/20'
                          : state === 'processing'
                            ? 'bg-accent-primary border-accent-primary text-white shadow-lg animate-pulse'
                            : 'bg-tertiary border-border text-tertiary'
                      }
                    `}>
                      {state === 'processing' ? (
                        <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : state === 'completed' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.icon
                      )}

                      {/* Pulse ring for active step */}
                      {state === 'active' && !isProcessing && (
                        <div className="absolute inset-0 rounded-full border-2 border-accent-primary animate-ping opacity-75"></div>
                      )}
                    </div>

                    {/* Step Label */}
                    <div className="mt-3 text-center">
                      <p className={`
                        text-sm font-semibold transition-colors duration-300
                        ${state === 'completed'
                          ? 'text-green-600'
                          : state === 'active' || state === 'processing'
                            ? 'text-accent-primary'
                            : 'text-tertiary'
                        }
                      `}>
                        {step.label}
                      </p>

                      {/* Processing text */}
                      {state === 'processing' && (
                        <p className="text-xs text-accent-primary mt-1 animate-pulse">
                          Working...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {!isLast && (
                    <div className={`
                      flex-1 h-1 mx-8 rounded-full transition-all duration-500 ease-in-out
                      ${state === 'completed'
                        ? 'bg-green-500'
                        : 'bg-border'
                      }
                    `}>
                      {/* Animated progress for processing */}
                      {state === 'processing' && (
                        <div className="h-full bg-accent-primary rounded-full animate-pulse"></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Helpful tip based on current step */}
          <div className="mt-6 text-center">
            <div className={`
              inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
              ${currentStep === 'upload'
                ? 'bg-blue-100 text-blue-800'
                : currentStep === 'preset'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }
            `}>
              <div className={`
                w-2 h-2 rounded-full
                ${currentStep === 'upload'
                  ? 'bg-blue-500'
                  : currentStep === 'preset'
                    ? 'bg-purple-500'
                    : 'bg-green-500'
                }
              `}></div>
              <span>
                {currentStep === 'upload' && 'Drag & drop or click to select your artwork'}
                {currentStep === 'preset' && 'Choose the perfect optimization for your needs'}
                {currentStep === 'download' && 'Your optimized image is ready to download!'}
                {isProcessing && 'Creating your perfect image...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}