export const getEnvVariable = (key: string): string => {
  const value = import.meta.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const getEnvNumber = (key: string): number => {
  const value = getEnvVariable(key);
  const numValue = Number(value);
  if (isNaN(numValue)) {
    throw new Error(`Environment variable ${key} is not a valid number`);
  }
  return numValue;
};

export const getModulMaxFileSize = (): number => {
  return getEnvNumber('VITE_MODUL_MAX_FILE_SIZE');
};

export const getProjectMaxFileSize = (): number => {
  return getEnvNumber('VITE_PROJECT_MAX_FILE_SIZE');
};
