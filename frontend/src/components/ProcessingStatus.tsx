interface ProcessingStatusProps {
  preset?: string;
  fileName?: string;
}

export function ProcessingStatus({ preset, fileName }: ProcessingStatusProps) {

  return (
    <div className="text-center py-12 space-y-8">
      {/* Simple spinner and message */}
      <div className="space-y-6">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-100 to-teal-100 rounded-full">
          <div className="text-3xl animate-spin">⚡</div>
        </div>

        <div className="space-y-3">
          <h3 className="text-3xl font-bold text-gray-800">
            Optimizing Your Image
          </h3>

          {fileName && (
            <p className="text-lg text-gray-600">
              Processing <span className="font-semibold">{fileName}</span>
            </p>
          )}

          {preset && (
            <p className="text-sm text-gray-500">
              Using {preset.replace(/_/g, ' ')} preset
            </p>
          )}
        </div>
      </div>

      {/* Simple progress indicator */}
      <div className="max-w-md mx-auto">
        <div className="bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-purple-500 to-teal-500 h-2 rounded-full animate-pulse w-3/4"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Processing your image...</p>
      </div>

      <p className="text-sm text-gray-500 italic">
        Creating your optimized image with professional algorithms
      </p>
    </div>
  );
}