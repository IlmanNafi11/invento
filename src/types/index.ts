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

export interface UserItem {
  id: string;
  email: string;
  role: RoleItem;
  files: FileItem[];
  createdAt: Date;
}

// Auth related types
export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface BaseResponse {
  success: boolean;
  message: string;
  code: number;
  timestamp: string;
}

export interface AuthSuccessResponse extends BaseResponse {
  data: AuthResponse;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse extends BaseResponse {
  errors: ValidationError[];
}

export interface ErrorResponse extends BaseResponse {
  errors?: Record<string, unknown>;
}