export interface FileItem {
  id: string;
  name: string;
  category: string;
  size: number;
  lastUpdated: Date;
}

export type FileType = 'pdf' | 'docx' | 'ppt';

export interface ProjectItem {
  id: string;
  name: string;
  category: ProjectCategory;
  size: number;
  lastUpdated: Date;
  semester: string;
}

export type ProjectCategory = 'website' | 'mobile' | 'iot' | 'machine learning' | 'deep learning';

export interface Permission {
  upload: boolean;
  update: boolean;
  view: boolean;
  delete: boolean;
}

export interface RoleItem {
  id: string;
  name: string;
  permissions: {
    project: Permission;
    modul: Permission;
    user: Permission;
  };
  lastUpdated: Date;
}