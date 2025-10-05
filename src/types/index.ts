export interface FileItem {
  id: string;
  name: string;
  category: string;
  size: number;
  lastUpdated: Date;
}

export type FileType = 'pdf' | 'docx' | 'ppt';