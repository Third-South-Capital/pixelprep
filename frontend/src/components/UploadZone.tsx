import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  error: string | null;
}

export function UploadZone({ onFileSelect, selectedFile, error }: UploadZoneProps) {
  const [isHovering, setIsHovering] = useState(false);

  const getFileTypeIcon = (type: string) => {
    if (type.includes('jpeg') || type.includes('jpg')) {
      return '🖼️';
    } else if (type.includes('png')) {
      return '🖼️';
    } else if (type.includes('webp')) {
      return '🌐';
    } else if (type.includes('tiff')) {
      return '📷';
    } else if (type.includes('bmp')) {
      return '🎨';
    }
    return '📁';
  };
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsHovering(true),
    onDragLeave: () => setIsHovering(false),
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.tiff', '.bmp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
          transition-all duration-300 ease-in-out transform
          ${isDragActive && !isDragReject ? 'border-indigo-500 bg-indigo-50 scale-105' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50 scale-105' : ''}
          ${!isDragActive && isHovering ? 'border-indigo-400 bg-indigo-25 scale-102' : ''}
          ${!isDragActive && !isHovering ? 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 hover:scale-102' : ''}
          ${selectedFile ? 'border-green-500 bg-green-50' : ''}
          
          ${isDragActive || isHovering ? 'shadow-lg' : 'shadow-sm'}
        `}
        style={{
          backgroundImage: isDragActive && !isDragReject ? 
            'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)' : 
            'none'
        }}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="space-y-2">
            <div className="text-green-600 animate-pulse">
              <div className="flex justify-center items-center space-x-2 mb-2">
                <span className="text-2xl">{getFileTypeIcon(selectedFile.type)}</span>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
            <p className="text-xs text-green-600">File selected! Choose a preset below to continue.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {isDragActive ? (
              <div className="space-y-2">
                {isDragReject ? (
                  <>
                    <div className="text-red-500 text-3xl animate-bounce">❌</div>
                    <p className="text-lg font-medium text-red-600">
                      File type not supported
                    </p>
                    <p className="text-sm text-red-500">
                      Please use JPEG, PNG, WebP, TIFF, or BMP files
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-indigo-500 text-3xl animate-bounce">🖼️</div>
                    <p className="text-lg font-medium text-indigo-600">
                      Drop your image here...
                    </p>
                    <p className="text-sm text-indigo-500">
                      Release to upload and optimize!
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drag & drop your image here
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports JPEG, PNG, WebP, TIFF, BMP up to 10MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}