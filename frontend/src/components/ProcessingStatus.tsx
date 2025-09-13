export function ProcessingStatus() {
  return (
    <div className="text-center py-8">
      <div className="inline-flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="text-lg font-medium text-gray-700">Processing your image...</span>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-sm text-gray-500">
          Optimizing, resizing, and preparing your download...
        </p>
      </div>
    </div>
  );
}