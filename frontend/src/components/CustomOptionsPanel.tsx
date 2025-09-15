import { useState } from 'react';
import type { CustomOptimization, ProcessorsResponse } from '../types';
import { SimpleTooltip } from './SimpleTooltip';

interface CustomOptionsPanelProps {
  customOptimization: CustomOptimization & { quality?: number };
  onUpdate: (optimization: CustomOptimization & { quality?: number }) => void;
  processors?: ProcessorsResponse;
}

export function CustomOptionsPanel({ customOptimization, onUpdate, processors }: CustomOptionsPanelProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleQualityChange = (quality: number) => {
    const updated = { ...customOptimization, quality };
    onUpdate(updated);
    validateSettings(updated);
  };

  const handleFormatChange = (format: string) => {
    const updated = { ...customOptimization, format };
    onUpdate(updated);
    validateSettings(updated);
  };

  const handleDimensionChange = (field: 'customWidth' | 'customHeight', value: number | undefined) => {
    const updated = { ...customOptimization, [field]: value };
    onUpdate(updated);
    validateSettings(updated);
  };

  const handleFileSizeChange = (maxSizeMb: number) => {
    const updated = { ...customOptimization, maxSizeMb };
    onUpdate(updated);
    validateSettings(updated);
  };

  const validateSettings = (settings: CustomOptimization & { quality?: number }) => {
    const errors: string[] = [];

    // Check for impossible combinations
    if (settings.quality && settings.quality >= 90 && settings.maxSizeMb < 0.5) {
      errors.push("High quality (90+) with tiny file size (<0.5MB) may not be achievable");
    }

    if (settings.format === 'PNG' && settings.maxSizeMb < 1.0 && settings.customWidth && settings.customHeight) {
      const estimatedSize = (settings.customWidth * settings.customHeight * 3) / (1024 * 1024);
      if (estimatedSize > settings.maxSizeMb) {
        errors.push(`PNG format with ${settings.customWidth}×${settings.customHeight} dimensions cannot achieve ${settings.maxSizeMb}MB file size`);
      }
    }

    if (settings.customWidth && settings.customHeight &&
        settings.customWidth > 3000 && settings.customHeight > 3000 &&
        settings.maxSizeMb < 1.0) {
      errors.push("Large dimensions (>3000px) with small file size (<1MB) may result in poor quality");
    }

    setValidationErrors(errors);
  };

  return (
    <div className="bg-secondary border border-primary rounded-xl p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-primary mb-2">
          Custom Optimization Settings
        </h3>
        <p className="text-secondary text-sm">
          Fine-tune your optimization with precise manual controls
        </p>
      </div>

      {/* Validation Warnings */}
      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.084 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Parameter Conflicts Detected</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quality Control */}
      <div className="space-y-3">
        <SimpleTooltip
          title="Quality Level Control"
          content="Adjust the compression quality. Higher values preserve more detail but create larger files. Lower values create smaller files with some quality loss."
          position="right"
        >
          <label className="text-sm font-medium text-primary cursor-help">
            Quality Level
          </label>
        </SimpleTooltip>
        <div className="space-y-2">
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={customOptimization.quality || 85}
            onChange={(e) => handleQualityChange(parseInt(e.target.value))}
            className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-secondary">
            <span>10 (Smallest)</span>
            <span className="font-medium text-primary text-base">
              {customOptimization.quality || 85}%
            </span>
            <span>100 (Best)</span>
          </div>
        </div>
        <p className="text-xs text-secondary">
          Higher values = better quality but larger file size
        </p>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-primary">
          Output Format
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['JPEG', 'PNG', 'WebP'].map((format) => (
            <button
              key={format}
              onClick={() => handleFormatChange(format)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                customOptimization.format === format
                  ? 'bg-accent-primary text-inverse shadow-sm'
                  : 'bg-tertiary text-primary hover:bg-primary hover:bg-opacity-10'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
        <div className="text-xs text-secondary">
          {customOptimization.format === 'JPEG' && '📸 Best for photos, smaller files'}
          {customOptimization.format === 'PNG' && '🖼️ Lossless, supports transparency'}
          {customOptimization.format === 'WebP' && '🚀 Modern format, excellent compression'}
        </div>
      </div>

      {/* Dimensions - Only show if custom dimensions are enabled */}
      {processors?.custom_dimensions_enabled && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-primary">
            Image Dimensions
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-secondary mb-1">Width (pixels)</label>
              <input
                type="number"
                placeholder="Original width"
                value={customOptimization.customWidth || ''}
                onChange={(e) => handleDimensionChange('customWidth', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm bg-tertiary border border-primary rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                min="50"
                max="5000"
              />
            </div>
            <div>
              <label className="block text-xs text-secondary mb-1">Height (pixels)</label>
              <input
                type="number"
                placeholder="Original height"
                value={customOptimization.customHeight || ''}
                onChange={(e) => handleDimensionChange('customHeight', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-sm bg-tertiary border border-primary rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                min="50"
                max="5000"
              />
            </div>
          </div>
          <p className="text-xs text-secondary">
            Leave blank to keep original dimensions. Aspect ratio will be preserved if only one dimension is specified.
          </p>
        </div>
      )}

      {/* Alternative max dimension dropdown when custom dimensions are disabled */}
      {!processors?.custom_dimensions_enabled && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-primary">
            Maximum Dimension
          </label>
          <select
            value={customOptimization.maxDimension || 'original'}
            onChange={(e) => onUpdate({ ...customOptimization, maxDimension: e.target.value as any })}
            className="w-full px-3 py-2 text-sm bg-tertiary border border-primary rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
          >
            <option value="original">Keep original size</option>
            <option value="800">800px max dimension</option>
            <option value="1200">1200px max dimension</option>
            <option value="1920">1920px max dimension</option>
          </select>
          <p className="text-xs text-secondary">
            Images will be resized to fit within the selected maximum dimension while preserving aspect ratio.
          </p>
        </div>
      )}

      {/* File Size Target */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-primary">
          Maximum File Size
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={customOptimization.maxSizeMb}
            onChange={(e) => handleFileSizeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-tertiary rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-secondary">
            <span>0.1 MB</span>
            <span className="font-medium text-primary text-base">{customOptimization.maxSizeMb} MB</span>
            <span>10 MB</span>
          </div>
        </div>
        <p className="text-xs text-secondary">
          Quality will be automatically reduced if needed to meet this target
        </p>
      </div>

      {/* Settings Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-900 mb-2">⚙️ Current Settings</h5>
        <div className="text-xs text-blue-800 space-y-1">
          <div>Quality: <span className="font-medium">{customOptimization.quality || 85}%</span></div>
          <div>Format: <span className="font-medium">{customOptimization.format}</span></div>
          <div>Max Size: <span className="font-medium">{customOptimization.maxSizeMb} MB</span></div>
          {processors?.custom_dimensions_enabled && (customOptimization.customWidth || customOptimization.customHeight) && (
            <div>Dimensions: <span className="font-medium">
              {customOptimization.customWidth || 'Original'}×{customOptimization.customHeight || 'Original'}px
            </span></div>
          )}
          {processors?.custom_dimensions_enabled && (!customOptimization.customWidth && !customOptimization.customHeight) && (
            <div>Dimensions: <span className="font-medium">Original size preserved</span></div>
          )}
          {!processors?.custom_dimensions_enabled && (
            <div>Max Dimension: <span className="font-medium">{customOptimization.maxDimension || 'Original'}</span></div>
          )}
        </div>
      </div>
    </div>
  );
}