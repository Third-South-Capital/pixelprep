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
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Optimization Style
        </h3>
        <p className="text-gray-600">Each preset is crafted for specific use cases to ensure your artwork looks perfect</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {presets.map(({ key, icon }) => {
          const config = processors.processors[key];
          if (!config) return null;

          const isSelected = selectedPreset === key;
          
          return (
            <button
              key={key}
              onClick={() => onPresetSelect(key)}
              className={`
                group p-6 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-xl transform hover:scale-105
                ${isSelected 
                  ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-teal-50 shadow-xl scale-105' 
                  : 'border-gray-200 bg-white hover:border-purple-200 hover:bg-gradient-to-br hover:from-purple-25 hover:to-teal-25'
                }
              `}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`text-3xl p-2 rounded-xl transition-all ${
                    isSelected ? 'bg-white shadow-md' : 'bg-gray-100 group-hover:bg-white group-hover:shadow-md'
                  }`}>{icon}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{config.name}</h4>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{config.description}</p>
                  
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs">
                  {config.dimensions && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded">{config.dimensions}</span>
                    </div>
                  )}
                  {config.max_dimension && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Max size:</span>
                      <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded">{config.max_dimension}</span>
                    </div>
                  )}
                  {config.max_file_size && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Target size:</span>
                      <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded">{config.max_file_size}</span>
                    </div>
                  )}
                  {config.file_size_range && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">File size:</span>
                      <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded">{config.file_size_range}</span>
                    </div>
                  )}
                  {config.size_reduction && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Reduction:</span>
                      <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded">{config.size_reduction}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-mono text-gray-800 bg-white px-2 py-1 rounded">
                      {config.primary_format || config.format || 'Auto'}
                    </span>
                  </div>
                </div>

                {config.use_case && (
                  <div className="bg-gradient-to-r from-purple-100 to-teal-100 rounded-xl p-3">
                    <p className="text-sm text-purple-800 font-medium">
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
        <div className="text-center bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-emerald-100 rounded-full p-1">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-800 font-semibold">
              {processors.processors[selectedPreset].name} preset selected
            </p>
          </div>
        </div>
      )}
    </div>
  );
}