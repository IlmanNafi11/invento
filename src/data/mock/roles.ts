import type { RoleItem } from '@/types';

export const mockRoles: RoleItem[] = [
  {
    id: '1',
    name: 'Admin',
    permissions: {
      project: {
        upload: true,
        update: true,
        view: true,
        delete: true,
      },
      modul: {
        upload: true,
        update: true,
        view: true,
        delete: true,
      },
      user: {
        upload: true,
        update: true,
        view: true,
        delete: true,
      },
    },
    lastUpdated: new Date('2024-10-01'),
  },
  {
    id: '2',
    name: 'Manager',
    permissions: {
      project: {
        upload: true,
        update: true,
        view: true,
        delete: false,
      },
      modul: {
        upload: true,
        update: true,
        view: true,
        delete: false,
      },
      user: {
        upload: true,
        update: true,
        view: true,
        delete: false,
      },
    },
    lastUpdated: new Date('2024-09-28'),
  },
  {
    id: '3',
    name: 'User',
    permissions: {
      project: {
        upload: false,
        update: false,
        view: true,
        delete: false,
      },
      modul: {
        upload: false,
        update: false,
        view: true,
        delete: false,
      },
      user: {
        upload: false,
        update: false,
        view: true,
        delete: false,
      },
    },
    lastUpdated: new Date('2024-10-05'),
  },
  {
    id: '4',
    name: 'Viewer',
    permissions: {
      project: {
        upload: false,
        update: false,
        view: true,
        delete: false,
      },
      modul: {
        upload: false,
        update: false,
        view: true,
        delete: false,
      },
      user: {
        upload: false,
        update: false,
        view: true,
        delete: false,
      },
    },
    lastUpdated: new Date('2024-09-30'),
  },
];