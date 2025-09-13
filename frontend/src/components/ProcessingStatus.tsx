export function ProcessingStatus() {
  return (
    <div className="text-center py-12">
      <div className="mb-8">
        <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-100 to-teal-100 rounded-2xl mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-teal-400 rounded-2xl animate-pulse opacity-75"></div>
          <svg className="relative w-12 h-12 text-purple-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Creating Your Masterpiece
        </h3>
        <p className="text-lg text-gray-600">
          Our AI is carefully optimizing your artwork...
        </p>
      </div>
      
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between bg-purple-50 rounded-lg p-3">
            <span className="text-sm font-medium text-purple-700">Analyzing image quality</span>
            <div className="w-4 h-4 bg-purple-400 rounded-full animate-bounce"></div>
          </div>
          <div className="flex items-center justify-between bg-teal-50 rounded-lg p-3">
            <span className="text-sm font-medium text-teal-700">Applying optimization</span>
            <div className="w-4 h-4 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          </div>
          <div className="flex items-center justify-between bg-indigo-50 rounded-lg p-3">
            <span className="text-sm font-medium text-indigo-700">Preparing download</span>
            <div className="w-4 h-4 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="max-w-xs mx-auto">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-purple-500 to-teal-500 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 italic">
          ✨ This usually takes just a few seconds
        </p>
      </div>
    </div>
  );
}