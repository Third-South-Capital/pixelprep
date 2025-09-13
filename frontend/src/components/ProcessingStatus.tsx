import { useState, useEffect } from 'react';

interface ProcessingStatusProps {
  preset?: string;
  fileName?: string;
}

export function ProcessingStatus({ preset, fileName }: ProcessingStatusProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');

  const phases = [
    {
      message: 'Analyzing image structure...',
      icon: '🔍',
      color: 'purple',
      duration: 1000
    },
    {
      message: 'Optimizing dimensions and quality...',
      icon: '⚡',
      color: 'teal',
      duration: 1500
    },
    {
      message: 'Applying compression algorithms...',
      icon: '🎨',
      color: 'blue',
      duration: 1000
    },
    {
      message: 'Finalizing your perfect image...',
      icon: '✨',
      color: 'indigo',
      duration: 800
    }
  ];

  useEffect(() => {
    let phaseTimeout: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;

    const startPhase = (phaseIndex: number) => {
      if (phaseIndex >= phases.length) return;

      const phase = phases[phaseIndex];
      setCurrentPhase(phaseIndex);
      setCurrentMessage(phase.message);

      // Animate progress for this phase
      let currentProgress = phaseIndex * (100 / phases.length);
      const targetProgress = (phaseIndex + 1) * (100 / phases.length);
      const progressStep = (targetProgress - currentProgress) / (phase.duration / 50);

      progressInterval = setInterval(() => {
        currentProgress += progressStep;
        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 50);

      // Move to next phase
      phaseTimeout = setTimeout(() => {
        startPhase(phaseIndex + 1);
      }, phase.duration);
    };

    startPhase(0);

    return () => {
      clearTimeout(phaseTimeout);
      clearInterval(progressInterval);
    };
  }, []);

  const colorClasses = {
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      dot: 'bg-purple-400',
      gradient: 'from-purple-500 to-purple-600'
    },
    teal: {
      bg: 'bg-teal-50',
      text: 'text-teal-700',
      dot: 'bg-teal-400',
      gradient: 'from-teal-500 to-teal-600'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      dot: 'bg-blue-400',
      gradient: 'from-blue-500 to-blue-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      dot: 'bg-indigo-400',
      gradient: 'from-indigo-500 to-indigo-600'
    }
  };

  const currentColors = colorClasses[phases[currentPhase]?.color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <div className="text-center py-12 space-y-8">
      {/* Main Status */}
      <div className="space-y-6">
        <div className="relative inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-purple-100 to-teal-100 rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-teal-400 rounded-3xl animate-pulse opacity-75"></div>
          <div className="relative text-4xl animate-bounce">
            {phases[currentPhase]?.icon || '⚡'}
          </div>

          {/* Progress Ring */}
          <div className="absolute inset-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                className="transition-all duration-300 ease-out"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
            Creating Your Masterpiece
          </h3>

          {fileName && (
            <p className="text-lg text-gray-600">
              Optimizing <span className="font-semibold">{fileName}</span>
            </p>
          )}

          {preset && (
            <p className="text-sm text-gray-500">
              Using {preset.replace(/_/g, ' ')} preset
            </p>
          )}
        </div>
      </div>

      {/* Current Phase Indicator */}
      <div className="max-w-md mx-auto">
        <div className={`
          flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500
          ${currentColors.bg} border-${phases[currentPhase]?.color}-200
        `}>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 ${currentColors.dot} rounded-full animate-pulse`}></div>
            <span className={`font-medium ${currentColors.text}`}>
              {currentMessage}
            </span>
          </div>
          <div className="text-xl">
            {phases[currentPhase]?.icon}
          </div>
        </div>
      </div>

      {/* Progress Steps Timeline */}
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center">
          {phases.map((phase, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <div className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300
                ${index <= currentPhase
                  ? 'bg-gradient-to-r from-purple-500 to-teal-500 border-transparent text-white shadow-lg'
                  : 'bg-gray-100 border-gray-300 text-gray-400'
                }
              `}>
                {index < currentPhase ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : index === currentPhase ? (
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                ) : (
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                )}
              </div>

              <div className="text-xs text-center max-w-16">
                <span className={`
                  ${index <= currentPhase ? 'text-gray-700 font-medium' : 'text-gray-400'}
                `}>
                  {phase.message.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Connecting Line */}
        <div className="relative mt-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 transform -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-teal-500 transform -translate-y-1/2 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-sm mx-auto space-y-2">
        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-teal-500 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>{Math.round(progress)}% complete</span>
          <span>~{Math.max(1, 4 - currentPhase)} seconds remaining</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500 italic">
          ✨ Crafting your perfect image with professional-grade algorithms
        </p>
        <p className="text-xs text-gray-400">
          We're maintaining maximum quality while optimizing file size
        </p>
      </div>
    </div>
  );
}