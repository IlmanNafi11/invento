import type { FileItem } from '@/types';

export const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Document1.pdf',
    category: 'PDF',
    size: 2048000,
    lastUpdated: new Date('2024-10-01'),
  },
  {
    id: '2',
    name: 'Presentation.ppt',
    category: 'PPT',
    size: 5120000,
    lastUpdated: new Date('2024-09-28'),
  },
  {
    id: '3',
    name: 'Report.docx',
    category: 'DOCX',
    size: 1024000,
    lastUpdated: new Date('2024-10-05'),
  },
  {
    id: '4',
    name: 'Manual.pdf',
    category: 'PDF',
    size: 3072000,
    lastUpdated: new Date('2024-09-30'),
  },
  {
    id: '5',
    name: 'Slides.ppt',
    category: 'PPT',
    size: 4096000,
    lastUpdated: new Date('2024-10-03'),
  },
];