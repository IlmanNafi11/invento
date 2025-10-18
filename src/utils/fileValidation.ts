import { getModulMaxFileSize, getProjectMaxFileSize } from './env';

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateModulFile = (file: File): FileValidationResult => {
  const MAX_FILE_SIZE = getModulMaxFileSize();
  const ALLOWED_TYPES = ['docx', 'xlsx', 'pdf', 'pptx'];

  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
    return {
      valid: false,
      error: `Ukuran file modul tidak boleh lebih dari ${maxSizeMB}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File tidak boleh kosong',
    };
  }

  const fileExt = file.name.toLowerCase().split('.').pop() || '';
  if (!ALLOWED_TYPES.includes(fileExt)) {
    return {
      valid: false,
      error: 'Tipe file tidak didukung. Hanya .docx, .xlsx, .pdf, dan .pptx yang diperbolehkan',
    };
  }

  return { valid: true };
};

export const validateProjectFile = (file: File): FileValidationResult => {
  const MAX_FILE_SIZE = getProjectMaxFileSize();
  const ALLOWED_TYPES = ['zip'];

  if (file.size > MAX_FILE_SIZE) {
    const maxSizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
    return {
      valid: false,
      error: `Ukuran file project tidak boleh lebih dari ${maxSizeMB}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File tidak boleh kosong',
    };
  }

  const fileExt = file.name.toLowerCase().split('.').pop() || '';
  if (!ALLOWED_TYPES.includes(fileExt)) {
    return {
      valid: false,
      error: 'Format file harus ZIP',
    };
  }

  return { valid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
