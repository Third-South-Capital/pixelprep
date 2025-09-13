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
        <h3 className="text-2xl font-bold text-primary mb-2">
          Choose Your Optimization Style
        </h3>
        <p className="text-secondary">Each preset is crafted for specific use cases to ensure your artwork looks perfect</p>
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
                group p-6 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-xl h-full min-h-[280px] flex flex-col
                ${isSelected
                  ? 'border-accent-primary bg-secondary shadow-xl'
                  : 'border-primary bg-primary hover:border-accent-primary hover:bg-secondary'
                }
              `}
            >
              <div className="flex flex-col space-y-4 h-full">
                <div className="flex items-center space-x-3">
                  <div className={`text-2xl p-2 rounded-xl transition-all ${
                    isSelected ? 'bg-primary shadow-md' : 'bg-secondary group-hover:bg-primary group-hover:shadow-md'
                  }`}>{icon}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-primary mb-1 leading-tight">{config.name}</h4>
                  </div>
                </div>
                <p className="text-sm text-secondary leading-relaxed flex-shrink-0">{config.description}</p>

                <div className="bg-tertiary rounded-xl p-3 space-y-2 text-xs flex-grow">
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
                  <div className="bg-secondary rounded-xl p-3 mt-auto border border-primary">
                    <p className="text-sm text-primary font-medium">
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