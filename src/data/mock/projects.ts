import type { ProjectItem } from '@/types';

export const mockProjects: ProjectItem[] = [
  {
    id: '1',
    name: 'E-commerce Website',
    category: 'website',
    size: 2048000,
    lastUpdated: new Date('2024-10-01'),
    semester: 'Semester 1',
  },
  {
    id: '2',
    name: 'Mobile App Prototype',
    category: 'mobile',
    size: 5120000,
    lastUpdated: new Date('2024-09-28'),
    semester: 'Semester 2',
  },
  {
    id: '3',
    name: 'IoT Sensor Network',
    category: 'iot',
    size: 1024000,
    lastUpdated: new Date('2024-10-05'),
    semester: 'Semester 3',
  },
  {
    id: '4',
    name: 'ML Image Classifier',
    category: 'machine learning',
    size: 3072000,
    lastUpdated: new Date('2024-09-30'),
    semester: 'Semester 4',
  },
  {
    id: '5',
    name: 'Deep Learning Chatbot',
    category: 'deep learning',
    size: 4096000,
    lastUpdated: new Date('2024-10-03'),
    semester: 'Semester 5',
  },
];