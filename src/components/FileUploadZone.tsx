import React, { useCallback } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label: string;
  description: string;
  selectedFile?: File | null;
  multiple?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  accept = '.py,.pth,.pt,.ckpt,.zip,.csv,.json,.yaml',
  label,
  description,
  selectedFile,
  multiple = false,
}) => {
  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragActive(true);
      } else if (e.type === 'dragleave') {
        setIsDragActive(false);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-white">{label}</label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-6 text-center cursor-pointer ${
          isDragActive
            ? 'border-blue-400 bg-blue-50/10'
            : 'border-gray-400 bg-gray-50/5 hover:border-blue-400'
        }`}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          id={`file-input-${label}`}
        />
        <label
          htmlFor={`file-input-${label}`}
          className="flex flex-col items-center justify-center cursor-pointer py-4"
        >
          {selectedFile ? (
            <>
              <File className="h-12 w-12 text-green-400 mb-2" />
              <p className="font-semibold text-green-300">{selectedFile.name}</p>
              <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-2" />
              <p className="font-semibold text-white">Drag and drop file here</p>
              <p className="text-sm text-gray-400">or click to browse</p>
            </>
          )}
        </label>
      </div>
      <p className="text-xs text-gray-400">{description}</p>

      {selectedFile && (
        <button
          onClick={() => onFileSelect(null as any)}
          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
        >
          <X className="h-3 w-3" />
          Remove file
        </button>
      )}
    </div>
  );
};

interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  hint?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  readOnly = false,
  hint = '',
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-white">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className="w-full px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:border-blue-400 focus:bg-white/15 transition disabled:opacity-50"
        disabled={readOnly}
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
};

interface ToggleAttackProps {
  name: string;
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  paramsKey?: string;
}

export const ToggleAttack: React.FC<ToggleAttackProps> = ({
  name,
  label,
  enabled,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-400/30 bg-white/5 hover:bg-white/10 transition">
      <label className="text-sm font-medium text-white cursor-pointer">{label}</label>
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded border-gray-400/50 bg-white/20 text-blue-500 cursor-pointer"
      />
    </div>
  );
};

interface ValidationErrorProps {
  message: string;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ message }) => {
  return (
    <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/50 flex items-start gap-3 text-red-300">
      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm">{message}</p>
    </div>
  );
};
