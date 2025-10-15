import { useState, useMemo } from 'react';
import { Search, Download } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDebounce } from '@/hooks/useDebounce';
import type { UserFile } from '@/types';

interface UserFileTableProps {
  files: UserFile[];
  canDownload: boolean;
  onDownload: (file: UserFile) => void;
  onBulkDownload: (files: UserFile[]) => void;
}

export function UserFileTable({ files, canDownload, onDownload, onBulkDownload }: UserFileTableProps) {
  const [fileSearch, setFileSearch] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const debouncedFileSearch = useDebounce(fileSearch, 500);

  const getFileKey = (file: UserFile) => `${file.kategori.toLowerCase()}:${file.id}`;

  const filteredFiles = useMemo(() => {
    if (!debouncedFileSearch) return files;
    return files.filter(file =>
      file.nama_file.toLowerCase().includes(debouncedFileSearch.toLowerCase()) ||
      file.kategori.toLowerCase().includes(debouncedFileSearch.toLowerCase())
    );
  }, [files, debouncedFileSearch]);

  const fileLookup = useMemo(() => {
    const map = new Map<string, UserFile>();
    files.forEach((file) => {
      map.set(getFileKey(file), file);
    });
    return map;
  }, [files]);

  const handleFileSelect = (file: UserFile, checked: boolean) => {
    const key = getFileKey(file);
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedFiles(new Set(filteredFiles.map((file) => getFileKey(file))));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleBulkDownload = () => {
    const filesToDownload = Array.from(selectedFiles)
      .map((key) => fileLookup.get(key))
      .filter((file): file is UserFile => Boolean(file));
    
    if (filesToDownload.length > 0) {
      onBulkDownload(filesToDownload);
      setSelectedFiles(new Set());
    }
  };

  const selectedFileCount = selectedFiles.size;
  const isAllSelected = filteredFiles.length > 0 && filteredFiles.every((file) => selectedFiles.has(getFileKey(file)));
  const headerCheckboxState: boolean | 'indeterminate' = isAllSelected ? true : selectedFileCount > 0 ? 'indeterminate' : false;

  const fileColumns: ColumnDef<UserFile>[] = [
    ...(canDownload ? [{
      id: 'select',
      header: () => (
        <Checkbox
          checked={headerCheckboxState}
          onCheckedChange={handleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedFiles.has(getFileKey(row.original))}
          onCheckedChange={(checked) => handleFileSelect(row.original, checked === true)}
        />
      ),
    } as ColumnDef<UserFile>] : []),
    {
      accessorKey: 'nama_file',
      header: 'Nama File',
    },
    {
      accessorKey: 'kategori',
      header: 'Kategori',
    },
    ...(canDownload ? [{
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(row.original)}
        >
          <Download className="h-4 w-4" />
        </Button>
      ),
    } as ColumnDef<UserFile>] : []),
  ];

  const fileTable = useReactTable({
    data: filteredFiles,
    columns: fileColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={fileColumns.length} className="text-left py-2">
                <div className="flex items-center justify-between">
                  {selectedFileCount > 0 && canDownload && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Download semua">
                          <Download className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleBulkDownload}>
                          Download semua
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <div className="relative max-w-sm ml-auto">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari file..."
                      value={fileSearch}
                      onChange={(e) => setFileSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </TableHead>
            </TableRow>
            {fileTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {fileTable.getRowModel().rows?.length ? (
              fileTable.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={fileColumns.length} className="h-24 text-center">
                  Tidak ada file.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => fileTable.previousPage()}
                  className={fileTable.getCanPreviousPage() ? '' : 'pointer-events-none opacity-50'}
                />
              </PaginationItem>
              {Array.from({ length: fileTable.getPageCount() }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => fileTable.setPageIndex(page - 1)}
                    isActive={fileTable.getState().pagination.pageIndex === page - 1}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => fileTable.nextPage()}
                  className={fileTable.getCanNextPage() ? '' : 'pointer-events-none opacity-50'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
