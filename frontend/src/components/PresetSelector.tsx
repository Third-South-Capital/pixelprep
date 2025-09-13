import type { ProcessorsResponse, PresetName } from '../types';

interface PresetSelectorProps {
  processors: ProcessorsResponse;
  selectedPreset: PresetName | null;
  onPresetSelect: (preset: PresetName) => void;
}

export function PresetSelector({ processors, selectedPreset, onPresetSelect }: PresetSelectorProps) {
  const presets: { key: PresetName; icon: string }[] = [
    { key: 'instagram_square', icon: '📸' },
    { key: 'jury_submission', icon: '🏆' },
    { key: 'web_display', icon: '🌐' },
    { key: 'email_newsletter', icon: '✉️' },
    { key: 'quick_compress', icon: '⚡' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 text-center">
        Choose an optimization preset
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map(({ key, icon }) => {
          const config = processors.processors[key];
          if (!config) return null;

          const isSelected = selectedPreset === key;
          
          return (
            <button
              key={key}
              onClick={() => onPresetSelect(key)}
              className={`
                p-4 rounded-xl border-2 text-left transition-all hover:shadow-md
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-indigo-300'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1">{config.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                  
                  <div className="space-y-1 text-xs text-gray-500">
                    {config.dimensions && (
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="font-mono">{config.dimensions}</span>
                      </div>
                    )}
                    {config.max_dimension && (
                      <div className="flex justify-between">
                        <span>Max:</span>
                        <span className="font-mono">{config.max_dimension}</span>
                      </div>
                    )}
                    {config.max_file_size && (
                      <div className="flex justify-between">
                        <span>File size:</span>
                        <span className="font-mono">{config.max_file_size}</span>
                      </div>
                    )}
                    {config.file_size_range && (
                      <div className="flex justify-between">
                        <span>File size:</span>
                        <span className="font-mono">{config.file_size_range}</span>
                      </div>
                    )}
                    {config.size_reduction && (
                      <div className="flex justify-between">
                        <span>Reduction:</span>
                        <span className="font-mono">{config.size_reduction}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Format:</span>
                      <span className="font-mono">
                        {config.primary_format || config.format || 'Auto'}
                      </span>
                    </div>
                  </div>

                  {config.use_case && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-indigo-600 font-medium">
                        {config.use_case}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedPreset && (
        <div className="text-center">
          <p className="text-sm text-green-600 font-medium">
            ✓ {processors.processors[selectedPreset].name} selected
          </p>
        </div>
      )}
    </div>
  );
}