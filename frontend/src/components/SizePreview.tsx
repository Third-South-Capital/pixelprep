import { estimateFileSize, formatBytes, getSavingsDescription } from '../utils/sizeEstimation';
import type { PresetName } from '../types';

interface SizePreviewProps {
  originalFile: File;
  preset: PresetName;
  dimensions?: { width: number; height: number };
  className?: string;
}

export function SizePreview({ originalFile, preset, dimensions, className = '' }: SizePreviewProps) {
  const estimation = estimateFileSize(
    originalFile.size,
    preset,
    originalFile.type,
    dimensions
  );

  const confidenceColor = {
    high: 'text-green-700 bg-green-50 border-green-200',
    medium: 'text-blue-700 bg-blue-50 border-blue-200',
    low: 'text-yellow-700 bg-yellow-50 border-yellow-200'
  };

  const confidenceIcon = {
    high: '🎯',
    medium: '📊',
    low: '🔍'
  };

  return (
    <div className={`bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 shadow-lg ${className}`}>
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-lg font-bold text-indigo-900">Size Preview</h4>
            <div className={`
              inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold border
              ${confidenceColor[estimation.confidence]}
            `}>
              <span>{confidenceIcon[estimation.confidence]}</span>
              <span>{estimation.confidence} confidence</span>
            </div>
          </div>

          {/* File Size Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current size:</span>
              <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">
                {formatBytes(originalFile.size)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Estimated size:</span>
              <span className="font-mono text-indigo-800 bg-indigo-100 px-2 py-1 rounded font-semibold">
                {formatBytes(estimation.estimatedBytes)}
              </span>
            </div>

            {/* Savings Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Space saved:</span>
                <span className="font-semibold text-green-700">
                  {formatBytes(estimation.estimatedSavings)}
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(estimation.savingsPercentage, 100)}%` }}
                ></div>
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-green-700">
                  {getSavingsDescription(estimation)}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Note */}
          {estimation.note && (
            <div className="mt-4 bg-white/60 rounded-lg p-3 border border-indigo-100">
              <p className="text-xs text-indigo-700">
                💡 {estimation.note}
              </p>
            </div>
          )}

          {/* Confidence Explanation */}
          {estimation.confidence !== 'high' && (
            <div className="mt-3 text-xs text-gray-500">
              {estimation.confidence === 'medium'
                ? 'Estimate based on file type and preset characteristics'
                : 'Rough estimate - actual results may vary significantly'
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}