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
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`
          relative overflow-hidden group
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive && !isDragReject ? 'border-accent-primary bg-secondary' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${!isDragActive && isHovering ? 'border-accent-primary bg-secondary' : ''}
          ${!isDragActive && !isHovering ? 'border-primary hover:border-accent-primary hover:bg-secondary' : ''}
          ${selectedFile ? 'border-accent-secondary bg-secondary' : ''}
        `}
        style={{
          backgroundImage: 'none'
        }}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="accent-secondary">
              <div className="flex justify-center items-center space-x-3 mb-4">
                <div className="text-4xl animate-bounce">{getFileTypeIcon(selectedFile.type)}</div>
                <div className="bg-secondary rounded-full p-2">
                  <svg className="w-8 h-8 accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <p className="text-xl font-bold text-primary">{selectedFile.name}</p>
            <p className="text-lg text-secondary bg-tertiary rounded-lg px-4 py-2 inline-block">{formatFileSize(selectedFile.size)}</p>
            <div className="bg-secondary rounded-xl p-4 mt-4 border border-primary">
              <p className="text-sm font-medium text-primary">✓ Perfect! Your artwork is ready for optimization</p>
              <p className="text-xs text-tertiary mt-1">Choose a preset below to continue</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-tertiary group-hover:accent-primary transition-colors">
              <div className="bg-secondary group-hover:bg-tertiary rounded-xl p-6 mb-4 transition-colors">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
            {isDragActive ? (
              <div className="space-y-4">
                {isDragReject ? (
                  <>
                    <div className="text-red-500 text-5xl animate-bounce">❌</div>
                    <p className="text-xl font-bold text-red-600">
                      File type not supported
                    </p>
                    <div className="bg-red-100 rounded-xl p-4">
                      <p className="text-sm text-red-600">
                        Please use <span className="font-semibold">JPEG, PNG, WebP, TIFF, or BMP</span> files
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-purple-500 text-5xl animate-bounce">🎨</div>
                    <p className="text-xl font-bold accent-primary">
                      Drop your artwork here...
                    </p>
                    <div className="bg-secondary rounded-xl p-4">
                      <p className="text-sm accent-primary">
                        Release to start the optimization magic!
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-primary group-hover:accent-primary transition-colors">
                  Upload Your Artwork
                </h3>
                <p className="text-lg text-secondary">
                  Drag & drop your image here or <span className="accent-primary font-semibold">click to browse</span>
                </p>
                <div className="bg-secondary rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-sm text-secondary">
                    Supports <span className="font-semibold">JPEG, PNG, WebP, TIFF, BMP</span> up to <span className="font-semibold">10MB</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-red-800 mb-1">Upload Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}