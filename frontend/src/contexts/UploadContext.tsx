import { createContext, useContext, useState, type ReactNode } from 'react';
import type { UploadState, PresetName, CustomOptimization } from '../types';

interface UploadContextType {
  uploadState: UploadState;
  updateUploadState: (updates: Partial<UploadState>) => void;
  resetUpload: () => void;
  setFile: (file: File | null) => void;
  setPreset: (preset: PresetName | null) => void;
  setCustomOptimization: (customOptimization: CustomOptimization) => void;
  setMetadata: (includeMetadata: boolean) => void;
  setUploading: (isUploading: boolean) => void;
  setResult: (result: UploadState['result']) => void;
  setError: (error: string | null) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const initialUploadState: UploadState = {
  file: null,
  preset: null,
  optimizationMode: 'presets',
  customOptimization: {
    maxSizeMb: 5.0,
    format: 'JPEG',
    quality: 85
  },
  isUploading: false,
  result: null,
  error: null,
  includeMetadata: false,
};

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadState, setUploadState] = useState<UploadState>(initialUploadState);

  const updateUploadState = (updates: Partial<UploadState>) => {
    setUploadState(prev => ({ ...prev, ...updates }));
  };

  const resetUpload = () => {
    // Clean up URLs to prevent memory leaks
    if (uploadState.originalImageUrl) URL.revokeObjectURL(uploadState.originalImageUrl);
    if (uploadState.optimizedImageUrl) URL.revokeObjectURL(uploadState.optimizedImageUrl);

    setUploadState({
      ...initialUploadState,
      includeMetadata: uploadState.includeMetadata, // Preserve metadata setting
    });
  };

  const setFile = (file: File | null) => {
    updateUploadState({
      file,
      error: null,
      result: null,
      preset: null // Clear previous preset selection
    });
  };

  const setPreset = (preset: PresetName | null) => {
    updateUploadState({
      preset,
      error: null,
      optimizationMode: preset === 'custom' ? 'custom' : 'presets'
    });
  };

  const setCustomOptimization = (customOptimization: CustomOptimization) => {
    updateUploadState({ customOptimization });
  };

  const setMetadata = (includeMetadata: boolean) => {
    updateUploadState({ includeMetadata });
  };

  const setUploading = (isUploading: boolean) => {
    updateUploadState({ isUploading, error: null });
  };

  const setResult = (result: UploadState['result']) => {
    updateUploadState({ result, isUploading: false });
  };

  const setError = (error: string | null) => {
    updateUploadState({ error, isUploading: false });
  };

  return (
    <UploadContext.Provider value={{
      uploadState,
      updateUploadState,
      resetUpload,
      setFile,
      setPreset,
      setCustomOptimization,
      setMetadata,
      setUploading,
      setResult,
      setError
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}