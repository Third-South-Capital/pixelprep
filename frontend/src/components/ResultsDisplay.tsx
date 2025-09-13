import { useState, useEffect } from 'react';
import type { OptimizationResult } from '../types';

interface ResultsDisplayProps {
  result: OptimizationResult;
  originalFile: File;
  originalImageUrl?: string;
  optimizedImageUrl?: string;
  onReset: () => void;
}

interface CounterAnimationProps {
  from: number;
  to: number;
  duration?: number;
}

function AnimatedCounter({ from, to, duration = 2000 }: CounterAnimationProps) {
  const [count, setCount] = useState(from);
  
  useEffect(() => {
    const startTime = Date.now();
    const difference = to - from;
    
    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newCount = Math.round(from + difference * easeOutQuart);
      
      setCount(newCount);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };
    
    requestAnimationFrame(updateCount);
  }, [from, to, duration]);
  
  return <span>{count}%</span>;
}

export function ResultsDisplay({ result, originalFile, originalImageUrl, optimizedImageUrl, onReset }: ResultsDisplayProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateSavings = () => {
    if (originalFile.size <= result.metadata.file_size_bytes) return null;
    const savings = originalFile.size - result.metadata.file_size_bytes;
    const percentage = Math.round((savings / originalFile.size) * 100);
    return { bytes: savings, percentage };
  };

  const savings = calculateSavings();

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Optimization Complete!</h2>
        <p className="text-gray-600">Your optimized image has been downloaded automatically.</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Processing Summary
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original File */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
              Original File
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-mono text-right break-all">{originalFile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Size:</span>
                <span className="font-mono">{formatFileSize(originalFile.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-mono">{originalFile.type}</span>
              </div>
            </div>
          </div>

          {/* Optimized Result */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
              Optimized Result
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Preset:</span>
                <span className="font-medium">{result.processor_config.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ZIP Size:</span>
                <span className="font-mono">{formatFileSize(result.metadata.file_size_bytes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-mono">{result.metadata.format}</span>
              </div>
              {result.metadata.dimensions !== 'Optimized' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-mono">{result.metadata.dimensions}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {savings && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-800">
                {formatFileSize(savings.bytes)} saved (<AnimatedCounter from={0} to={savings.percentage} /> reduction)
              </p>
              <p className="text-sm text-green-600 mt-1">
                Faster uploads and better user experience!
              </p>
            </div>
          </div>
        )}
        
        {/* Before/After Image Preview */}
        {(originalImageUrl || optimizedImageUrl) && (
          <div className="mt-6 bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Before & After Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {originalImageUrl && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700 text-center">Original</h4>
                  <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <img
                      src={originalImageUrl}
                      alt="Original image"
                      className="w-full h-auto max-h-72 object-contain mx-auto"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    {formatFileSize(originalFile.size)}
                  </p>
                </div>
              )}
              
              {optimizedImageUrl && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700 text-center">Optimized</h4>
                  <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <img
                      src={optimizedImageUrl}
                      alt="Optimized image"
                      className="w-full h-auto max-h-72 object-contain mx-auto"
                      style={{ maxWidth: '300px' }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    {formatFileSize(result.metadata.file_size_bytes)}
                  </p>
                </div>
              )}
            </div>
            
            {!optimizedImageUrl && (
              <div className="text-center text-gray-500 mt-4">
                <p className="text-sm">
                  💡 Uncheck "Include metadata" to see optimized image preview
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preset Details */}
      <div className="bg-indigo-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-indigo-900 mb-2">
          {result.processor_config.name}
        </h3>
        <p className="text-indigo-700 mb-3">{result.processor_config.description}</p>
        
        {result.processor_config.use_case && (
          <p className="text-sm text-indigo-600">
            <strong>Best for:</strong> {result.processor_config.use_case}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onReset}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Optimize Another Image
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}