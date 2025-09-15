import { useState } from 'react';
import type { ProcessorsResponse } from '../types';

interface DebugPanelProps {
  processors: ProcessorsResponse | null;
  apiCallStatus: 'loading' | 'success' | 'error';
  apiError?: string;
  showDebug?: boolean;
}

export function DebugPanel({ processors, apiCallStatus, apiError, showDebug = true }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!showDebug) {
    return null;
  }

  // Check if custom preset appears in the final presets array
  const basePresets = [
    'instagram_square', 'jury_submission', 'web_display', 'email_newsletter', 'quick_compress'
  ];

  const allProcessorKeys = processors?.processors ? Object.keys(processors.processors) : [];
  const hasCustomInProcessors = allProcessorKeys.includes('custom');

  // Simulate the PresetSelector logic
  const wouldAddCustomPreset = Boolean(processors?.custom_presets_enabled);
  const finalPresets = [...basePresets];
  if (wouldAddCustomPreset) {
    finalPresets.push('custom');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          px-4 py-2 rounded-lg font-mono text-sm font-bold shadow-lg transition-all duration-300
          ${apiCallStatus === 'error'
            ? 'bg-red-500 text-white animate-pulse'
            : apiCallStatus === 'loading'
            ? 'bg-yellow-500 text-black animate-spin'
            : processors?.custom_presets_enabled
            ? 'bg-green-500 text-white'
            : 'bg-orange-500 text-white'
          }
        `}
      >
        {isExpanded ? '🐛 Hide Debug' : '🐛 Debug Panel'}
        {apiCallStatus === 'error' && ' ❌'}
        {apiCallStatus === 'loading' && ' ⏳'}
        {apiCallStatus === 'success' && (processors?.custom_presets_enabled ? ' ✅' : ' ⚠️')}
      </button>

      {/* Debug Panel */}
      {isExpanded && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 overflow-y-auto bg-gray-900 text-green-400 text-xs font-mono p-4 rounded-lg shadow-2xl border border-green-500">
          <div className="space-y-3">
            {/* Header */}
            <div className="border-b border-green-500 pb-2">
              <h3 className="text-green-300 font-bold">PixelPrep Debug Panel</h3>
              <div className="text-gray-400">{new Date().toLocaleTimeString()}</div>
            </div>

            {/* API Call Status */}
            <div>
              <div className="text-green-300 font-bold">1️⃣ API Call Status:</div>
              <div className={`ml-4 ${
                apiCallStatus === 'error' ? 'text-red-400' :
                apiCallStatus === 'loading' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                Status: {apiCallStatus.toUpperCase()}
                {apiError && (
                  <div className="text-red-400 mt-1">Error: {apiError}</div>
                )}
              </div>
            </div>

            {/* Backend Response */}
            <div>
              <div className="text-green-300 font-bold">2️⃣ Backend Response:</div>
              {processors ? (
                <div className="ml-4 space-y-1">
                  <div>✅ Processors object: LOADED</div>
                  <div className={`${processors.custom_presets_enabled ? 'text-green-400' : 'text-red-400'}`}>
                    🎯 custom_presets_enabled: {String(processors.custom_presets_enabled)}
                  </div>
                  <div>📝 Total processors: {Object.keys(processors.processors).length}</div>
                  <div>🔧 Processor keys: {Object.keys(processors.processors).join(', ')}</div>
                  <div className={`${hasCustomInProcessors ? 'text-green-400' : 'text-orange-400'}`}>
                    ⚙️ Has 'custom' processor: {String(hasCustomInProcessors)}
                  </div>
                </div>
              ) : (
                <div className="ml-4 text-red-400">❌ Processors: NULL/UNDEFINED</div>
              )}
            </div>

            {/* PresetSelector Logic Simulation */}
            <div>
              <div className="text-green-300 font-bold">3️⃣ PresetSelector Logic:</div>
              <div className="ml-4 space-y-1">
                <div>📋 Base presets: {basePresets.length}</div>
                <div className={`${wouldAddCustomPreset ? 'text-green-400' : 'text-red-400'}`}>
                  🎯 Would add custom: {String(wouldAddCustomPreset)}
                </div>
                <div className={`${finalPresets.includes('custom') ? 'text-green-400' : 'text-orange-400'}`}>
                  ⚙️ Final presets: {finalPresets.join(', ')}
                </div>
                <div className={`${finalPresets.includes('custom') ? 'text-green-400' : 'text-red-400'}`}>
                  🎨 Custom UI should show: {String(finalPresets.includes('custom'))}
                </div>
              </div>
            </div>

            {/* JavaScript Errors */}
            <div>
              <div className="text-green-300 font-bold">4️⃣ JavaScript Errors:</div>
              <div className="ml-4 text-gray-400">
                Check browser console for any errors
              </div>
            </div>

            {/* Environment Info */}
            <div>
              <div className="text-green-300 font-bold">5️⃣ Environment:</div>
              <div className="ml-4 space-y-1">
                <div>🌐 Mode: {import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT'}</div>
                <div>🔗 API URL: {import.meta.env.PROD ? 'https://pixelprep.onrender.com' : 'http://localhost:8000'}</div>
                <div>📦 Build time: {new Date().toISOString()}</div>
              </div>
            </div>

            {/* Raw Data (Collapsible) */}
            <details className="border-t border-green-500 pt-2">
              <summary className="text-green-300 font-bold cursor-pointer">🔍 Raw API Response</summary>
              <pre className="mt-2 text-xs text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {processors ? JSON.stringify(processors, null, 2) : 'No data'}
              </pre>
            </details>

            {/* Quick Actions */}
            <div className="border-t border-green-500 pt-2">
              <div className="text-green-300 font-bold">⚡ Quick Actions:</div>
              <div className="ml-4 space-y-1 text-xs">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-2 py-1 rounded mr-2"
                >
                  🔄 Reload Page
                </button>
                <button
                  onClick={() => {
                    const apiUrl = import.meta.env.PROD ? 'https://pixelprep.onrender.com' : 'http://localhost:8000';
                    fetch(`${apiUrl}/optimize/processors`)
                      .then(r => r.json())
                      .then(data => {
                        console.log('🔍 Direct API test:', data);
                        alert('Check console for direct API response');
                      })
                      .catch(e => {
                        console.error('🚨 Direct API test failed:', e);
                        alert('Direct API test failed - check console');
                      });
                  }}
                  className="bg-purple-600 text-white px-2 py-1 rounded"
                >
                  🧪 Test API Direct
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}