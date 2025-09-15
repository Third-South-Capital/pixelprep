import type { ProcessorsResponse, PresetName, PresetRecommendation, ImageAnalysis } from '../types';
import { getImageDescription } from '../utils/imageAnalysis';

interface PresetSelectorProps {
  processors: ProcessorsResponse;
  selectedPreset: PresetName | null;
  onPresetSelect: (preset: PresetName) => void;
  recommendation?: PresetRecommendation;
  imageAnalysis?: ImageAnalysis;
}

export function PresetSelector({ processors, selectedPreset, onPresetSelect, recommendation, imageAnalysis }: PresetSelectorProps) {

  const basePresets: { key: PresetName; icon: string }[] = [
    { key: 'instagram_square', icon: '📸' },
    { key: 'jury_submission', icon: '🏆' },
    { key: 'web_display', icon: '🌐' },
    { key: 'email_newsletter', icon: '✉️' },
    { key: 'quick_compress', icon: '⚡' },
  ];

  // Add custom preset if both custom presets and custom dimensions are enabled
  const presets: { key: PresetName; icon: string }[] = [...basePresets];
  const customEnabled = processors.custom_presets_enabled && processors.custom_dimensions_enabled;
  if (customEnabled) {
    presets.push({ key: 'custom', icon: '⚙️' });
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-primary mb-2">
          Choose Your Optimization Style
        </h3>
        <p className="text-secondary">Each preset is crafted for specific use cases to ensure your artwork looks perfect</p>
      </div>

      {/* Smart Recommendation Banner */}
      {recommendation && imageAnalysis && recommendation.confidence >= 70 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mx-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-lg font-bold text-blue-900">Smart Recommendation</h4>
                <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  recommendation.confidence >= 90
                    ? 'bg-green-100 text-green-800'
                    : recommendation.confidence >= 80
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {recommendation.confidence}% match
                </div>
              </div>
              <p className="text-blue-800 mb-2">
                For your <span className="font-medium">{getImageDescription(imageAnalysis)}</span>,
                we recommend <span className="font-bold">{processors.processors[recommendation.preset]?.name}</span>
              </p>
              <p className="text-blue-700 text-sm mb-3">{recommendation.reason}</p>
              <div className="flex flex-wrap gap-2">
                {recommendation.matchFactors.map((factor, index) => (
                  <span key={index} className="bg-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">
                    ✓ {factor}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 text-blue-400">
              <div className="text-xs text-blue-600 font-medium">
                {recommendation.confidence >= 90 ? '🎯 Perfect' : recommendation.confidence >= 80 ? '👍 Great' : '✨ Good'} match
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {presets.map(({ key, icon }) => {
          const config = processors.processors[key];
          if (!config) return null;

          const isSelected = selectedPreset === key;
          const isRecommended = recommendation?.preset === key;

          return (
            <button
              key={key}
              onClick={() => onPresetSelect(key)}
              className={`
                group p-3 lg:p-4 rounded-lg border-2 text-left transition-all duration-300 hover:shadow-lg h-full min-h-[180px] lg:min-h-[200px] flex flex-col relative
                ${isSelected
                  ? (isRecommended
                      ? 'border-blue-400 bg-blue-50 shadow-xl ring-2 ring-blue-200'
                      : 'border-accent-primary bg-secondary shadow-xl')
                  : (isRecommended
                      ? 'border-blue-300 bg-blue-25 hover:border-blue-400 hover:bg-blue-50 shadow-md'
                      : 'border-primary bg-primary hover:border-accent-primary hover:bg-secondary')
                }
                ${!selectedPreset && isRecommended ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
              `}
            >
              {/* Recommendation Badge with Animation */}
              {isRecommended && recommendation && recommendation.confidence >= 70 && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="relative">
                    <div className={`text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 ${
                      recommendation.confidence >= 90
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : recommendation.confidence >= 80
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                          : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    }`}>
                      <svg className={`w-3 h-3 ${recommendation.confidence >= 90 ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span>{
                        recommendation.confidence >= 90 ? 'PERFECT' :
                        recommendation.confidence >= 80 ? 'BEST MATCH' : 'GOOD MATCH'
                      }</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quality Badge for high-confidence recommendations */}
              {isRecommended && recommendation && recommendation.confidence >= 85 && (
                <div className="absolute -top-1 -left-1 z-10">
                  <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                    <span>★ {recommendation.confidence}%</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col space-y-2 h-full">
                <div className="flex items-center space-x-3">
                  <div className={`text-lg p-1.5 rounded-lg transition-all ${
                    isSelected ? 'bg-primary shadow-sm' : 'bg-secondary group-hover:bg-primary group-hover:shadow-sm'
                  }`}>{icon}</div>
                  <div className="flex-1">
                    <h4 className="text-sm lg:text-base font-bold text-primary mb-0.5 leading-tight">{config.name}</h4>
                  </div>
                </div>
                <p className="text-xs text-secondary leading-snug flex-shrink-0">{config.description}</p>

                <div className="bg-tertiary rounded-lg p-2 space-y-1 text-xs flex-grow">
                  {config.dimensions && (
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Dimensions:</span>
                      <span className="font-mono text-primary bg-primary px-2 py-1 rounded text-xs">{config.dimensions}</span>
                    </div>
                  )}
                  {config.max_dimension && (
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Max size:</span>
                      <span className="font-mono text-primary bg-primary px-2 py-1 rounded text-xs">{config.max_dimension}</span>
                    </div>
                  )}
                  {config.max_file_size && (
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Target size:</span>
                      <span className="font-mono text-primary bg-primary px-2 py-1 rounded text-xs">{config.max_file_size}</span>
                    </div>
                  )}
                  {config.file_size_range && (
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">File size:</span>
                      <span className="font-mono text-primary bg-primary px-2 py-1 rounded text-xs">{config.file_size_range}</span>
                    </div>
                  )}
                  {config.size_reduction && (
                    <div className="flex justify-between items-center">
                      <span className="text-secondary">Reduction:</span>
                      <span className="font-mono text-primary bg-primary px-2 py-1 rounded text-xs">{config.size_reduction}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Format:</span>
                    <span className="font-mono text-primary bg-primary px-2 py-1 rounded text-xs">
                      {config.primary_format || config.format || 'Auto'}
                    </span>
                  </div>
                </div>

                {config.use_case && (
                  <div className="bg-secondary rounded-lg p-2 mt-auto border border-primary">
                    <p className="text-xs text-primary font-medium">
                      ✨ Perfect for: {config.use_case}
                    </p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedPreset && (
        <div className="text-center bg-secondary border border-primary rounded-xl p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-tertiary rounded-full p-1">
              <svg className="w-4 h-4 accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-primary font-semibold">
              {processors.processors[selectedPreset].name} preset selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}