export interface FileItem {
  id: string;
  name: string;
  category: string;
  size: number;
  lastUpdated: string;
}

export type FileType = 'pdf' | 'docx' | 'ppt';

export interface ProjectItem {
  id: string;
  name: string;
  category: ProjectCategory;
  size: number;
  lastUpdated: string;
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
  lastUpdated: string;
}

export interface UserItem {
  id: string;
  email: string;
  role: RoleItem;
  files: FileItem[];
  createdAt: string;
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

export interface ApiPermission {
  resource: string;
  actions: string[];
}

export interface Role {
  id: number;
  nama_role: string;
  permissions: ApiPermission[];
  jumlah_permission: number;
  created_at: string;
  updated_at: string;
}

export interface RoleListItem {
  id: number;
  nama_role: string;
  jumlah_permission: number;
  tanggal_diperbarui: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface RoleListResponse extends BaseResponse {
  data: {
    items: RoleListItem[];
    pagination: Pagination;
  };
}

export interface RoleDetailResponse extends BaseResponse {
  data: Role;
}

export interface RoleCreateRequest {
  nama_role: string;
  permissions: Record<string, string[]>;
}

export interface RoleCreateResponse extends BaseResponse {
  data: Role;
}

export interface RoleUpdateRequest {
  nama_role: string;
  permissions: Record<string, string[]>;
}

export interface RoleUpdateResponse extends BaseResponse {
  data: Role;
}

export interface PermissionsResponse extends BaseResponse {
  data: {
    items: ResourcePermissions[];
  };
}

export interface ResourcePermissions {
  name: string;
  permissions: PermissionItem[];
}

export interface PermissionItem {
  action: string;
  label: string;
}

export interface UserListItem {
  id: number;
  email: string;
  role: string;
  dibuat_pada: string;
}

export interface UserFile {
  id: number;
  nama_file: string;
  kategori: 'modul' | 'project';
  download_url: string;
}

export interface UserListResponse extends BaseResponse {
  data: {
    items: UserListItem[];
    pagination: Pagination;
  };
}

export interface UserFilesResponse extends BaseResponse {
  data: {
    items: UserFile[];
    pagination: Pagination;
  };
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface SuccessResponse extends BaseResponse {
  data: null;
}