import type { UserItem } from '@/types';
import { mockRoles } from './roles';
import { mockFiles } from './files';

export const mockUsers: UserItem[] = [
  {
    id: '1',
    email: 'admin@invento.com',
    role: mockRoles[0], // Admin
    files: [mockFiles[0], mockFiles[1], mockFiles[2], mockFiles[3], mockFiles[4], mockFiles[5], mockFiles[6], mockFiles[7], mockFiles[8], mockFiles[9]],
    createdAt: new Date('2024-09-01'),
  },
  {
    id: '2',
    email: 'manager@invento.com',
    role: mockRoles[1], // Manager
    files: [mockFiles[2]],
    createdAt: new Date('2024-09-15'),
  },
  {
    id: '3',
    email: 'user1@invento.com',
    role: mockRoles[2], // User
    files: [mockFiles[3], mockFiles[4]],
    createdAt: new Date('2024-10-01'),
  },
  {
    id: '4',
    email: 'user2@invento.com',
    role: mockRoles[3], // Viewer
    files: [],
    createdAt: new Date('2024-10-05'),
  },
  {
    id: '5',
    email: 'viewer@invento.com',
    role: mockRoles[3], // Viewer
    files: [mockFiles[0]],
    createdAt: new Date('2024-09-20'),
  },
  {
    id: '6',
    email: 'admin2@invento.com',
    role: mockRoles[0], // Admin
    files: [mockFiles[1], mockFiles[2]],
    createdAt: new Date('2024-08-15'),
  },
  {
    id: '7',
    email: 'manager2@invento.com',
    role: mockRoles[1], // Manager
    files: [mockFiles[3]],
    createdAt: new Date('2024-09-10'),
  },
  {
    id: '8',
    email: 'user3@invento.com',
    role: mockRoles[2], // User
    files: [mockFiles[4], mockFiles[0]],
    createdAt: new Date('2024-09-25'),
  },
  {
    id: '9',
    email: 'viewer2@invento.com',
    role: mockRoles[3], // Viewer
    files: [mockFiles[1]],
    createdAt: new Date('2024-10-02'),
  },
  {
    id: '10',
    email: 'user4@invento.com',
    role: mockRoles[2], // User
    files: [mockFiles[2], mockFiles[3]],
    createdAt: new Date('2024-09-30'),
  },
];