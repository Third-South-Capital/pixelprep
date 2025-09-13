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
    // Ensure we have valid file sizes
    const originalSize = originalFile.size;
    const optimizedSize = result.metadata.file_size_bytes;
    
    if (originalSize <= 0 || optimizedSize <= 0) return null;
    
    // Handle case where optimized file is larger (shouldn't happen but just in case)
    if (optimizedSize >= originalSize) {
      return {
        bytes: optimizedSize - originalSize,
        percentage: 0,
        isIncrease: true
      };
    }
    
    const savings = originalSize - optimizedSize;
    const percentage = Math.round((savings / originalSize) * 100);
    return { bytes: savings, percentage, isIncrease: false };
  };

  const savings = calculateSavings();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-100 p-10">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl mb-6 shadow-lg animate-pulse">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
          Optimization Complete!
        </h2>
        <p className="text-xl text-gray-700">Your artwork has been professionally optimized and downloaded automatically</p>
        <div className="mt-4 inline-block bg-emerald-100 rounded-full px-4 py-2">
          <p className="text-sm font-medium text-emerald-800">✨ Ready to wow your audience</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Optimization Results
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original File */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-4 h-4 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
              Original Artwork
            </h4>
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Filename:</span>
                  <span className="font-mono text-sm text-right break-all max-w-xs">{originalFile.name}</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">File size:</span>
                  <span className="font-mono text-lg font-bold text-blue-600">{formatFileSize(originalFile.size)}</span>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Format:</span>
                  <span className="font-mono text-gray-800">{originalFile.type.split('/')[1]?.toUpperCase() || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Optimized Result */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-emerald-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-4 h-4 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
              Optimized Result
            </h4>
            <div className="space-y-3">
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Preset used:</span>
                  <span className="font-bold text-emerald-600">{result.processor_config.name}</span>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">{result.metadata.format === 'ZIP' ? 'Optimized size:' : 'File size:'}:</span>
                  <span className="font-mono text-lg font-bold text-emerald-600">{formatFileSize(result.metadata.file_size_bytes)}</span>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Format:</span>
                  <span className="font-mono text-gray-800">{result.metadata.format}</span>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Dimensions:</span>
                  <span className="font-mono text-gray-800">{result.metadata.dimensions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {savings && (
          <div className={`mt-6 border rounded-lg p-4 ${
            savings.isIncrease 
              ? 'bg-yellow-50 border-yellow-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="text-center">
              {savings.isIncrease ? (
                <p className="text-lg font-semibold text-yellow-800">
                  File increased by {formatFileSize(savings.bytes)} (metadata included)
                </p>
              ) : (
                <p className="text-lg font-semibold text-green-800">
                  {formatFileSize(savings.bytes)} saved (<AnimatedCounter from={0} to={savings.percentage} />% reduction)
                </p>
              )}
              <p className={`text-sm mt-1 ${
                savings.isIncrease ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {savings.isIncrease 
                  ? 'ZIP includes metadata and optimized image'
                  : 'Faster uploads and better user experience!'
                }
              </p>
            </div>
          </div>
        )}
        
        {/* Before/After Image Preview */}
        {(originalImageUrl || optimizedImageUrl) && (
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Before & After Comparison
              </h3>
              <p className="text-gray-600">See the transformation of your artwork</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {originalImageUrl && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-blue-600 mb-2 flex items-center justify-center">
                      <span className="bg-blue-100 rounded-full p-1 mr-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </span>
                      Original
                    </h4>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border-2 border-blue-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <img
                      src={originalImageUrl}
                      alt="Original artwork"
                      className="w-full h-auto max-h-80 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-center bg-blue-100 rounded-xl p-3">
                    <p className="text-sm font-bold text-blue-800">
                      {formatFileSize(originalFile.size)}
                    </p>
                  </div>
                </div>
              )}
              
              {optimizedImageUrl && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-emerald-600 mb-2 flex items-center justify-center">
                      <span className="bg-emerald-100 rounded-full p-1 mr-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </span>
                      Optimized
                    </h4>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <img
                      src={optimizedImageUrl}
                      alt="Optimized artwork"
                      className="w-full h-auto max-h-80 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-center bg-emerald-100 rounded-xl p-3">
                    <p className="text-sm font-bold text-emerald-800">
                      {formatFileSize(result.metadata.file_size_bytes)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {!optimizedImageUrl && originalImageUrl && (
              <div className="text-center mt-8 bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                <div className="inline-flex items-center space-x-2 text-yellow-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="font-medium">Pro tip!</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Uncheck "Include metadata" to see a side-by-side comparison of your optimized image
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preset Details */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-8 mb-12 shadow-lg">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-indigo-900 mb-3 flex items-center justify-center">
            <span className="bg-indigo-100 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            {result.processor_config.name} Preset
          </h3>
          <p className="text-lg text-indigo-700 mb-4">{result.processor_config.description}</p>
          
          {result.processor_config.use_case && (
            <div className="bg-indigo-100 rounded-xl p-4 inline-block">
              <p className="text-sm font-medium text-indigo-800">
                ✨ <strong>Perfect for:</strong> {result.processor_config.use_case}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <button
          onClick={onReset}
          className="group bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center"
        >
          <svg className="w-5 h-5 mr-2 group-hover:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Optimize Another Artwork
        </button>
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Start Fresh
        </button>
      </div>
    </div>
  );
}