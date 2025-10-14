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

export type ProjectCategory = 'website' | 'mobile' | 'iot' | 'machine_learning' | 'deep_learning';

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

export interface UserPermissionsResponse extends BaseResponse {
  data: ApiPermission[];
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

export interface Project {
  id: number;
  nama_project: string;
  kategori: ProjectCategory;
  semester: number;
  ukuran: string;
  path_file: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectListItem {
  id: number;
  nama_project: string;
  kategori: ProjectCategory;
  semester: number;
  ukuran: string;
  terakhir_diperbarui: string;
}

export interface ProjectListResponse extends BaseResponse {
  data: {
    items: ProjectListItem[];
    pagination: Pagination;
  };
}

export interface ProjectCreateResponse extends BaseResponse {
  data: {
    items: Project[];
  };
}

export interface ProjectCreateRequest {
  files: File[];
  nama_project: string[];
  kategori: string[];
  semester: number[];
}

export interface ProjectUpdateMetadataRequest {
  nama_project: string;
  kategori: string;
  semester: number;
}

export interface ProjectUpdateMetadataResponse extends BaseResponse {
  data: null;
}

export interface UploadProgress {
  uploadId: string;
  fileName: string;
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
}

export interface UploadResponse extends BaseResponse {
  data: {
    upload_id: string;
    upload_url: string;
    offset: number;
    length: number;
  };
}

export interface UploadInfo {
  upload_id: string;
  nama_project: string;
  kategori: ProjectCategory;
  semester: number;
  status: 'uploading' | 'completed' | 'cancelled' | 'failed';
  progress: number;
  offset: number;
  length: number;
  created_at: string;
  updated_at: string;
}

export interface UploadInfoResponse extends BaseResponse {
  data: UploadInfo;
}

export interface UploadSlot {
  available: boolean;
  message: string;
  queue_length: number;
  active_upload: boolean;
  max_concurrent: number;
}

export interface UploadSlotResponse extends BaseResponse {
  data: UploadSlot;
}

export interface Modul {
  id: number;
  nama_file: string;
  tipe: string;
  ukuran: string;
  path_file: string;
  created_at: string;
  updated_at: string;
}

export interface ModulListItem {
  id: number;
  nama_file: string;
  tipe: string;
  ukuran: string;
  semester: number;
  path_file: string;
  terakhir_diperbarui: string;
}

export interface ModulListResponse extends BaseResponse {
  data: {
    items: ModulListItem[];
    pagination: Pagination;
  };
}

export interface ModulCreateResponse extends BaseResponse {
  data: {
    items: Modul[];
  };
}

export interface ModulUpdateResponse extends BaseResponse {
  data: Modul;
}

export interface ModulCreateRequest {
  files: File[];
  nama_file: string[];
}

export interface ModulUpdateRequest {
  nama_file?: string;
  file?: File;
}

export interface Profile {
  name: string;
  email: string;
  jenis_kelamin?: string | null;
  foto_profil?: string | null;
  role: string;
  created_at: string;
  jumlah_project: number;
  jumlah_modul: number;
}

export interface ProfileResponse extends BaseResponse {
  data: Profile;
}

export interface UpdateProfileRequest {
  name: string;
  jenis_kelamin?: string;
  foto_profil?: File;
}