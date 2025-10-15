import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ModulTableFooterProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  displayedItems: number;
  onPageChange: (page: number) => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
}

export function ModulTableFooter({
  currentPage,
  totalPages,
  totalItems,
  displayedItems,
  onPageChange,
  canPreviousPage,
  canNextPage,
}: ModulTableFooterProps) {
  const handlePreviousPage = () => {
    if (canPreviousPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (canNextPage) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Menampilkan {displayedItems} dari {totalItems} data
      </div>
      <div className="space-x-2">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePreviousPage}
                className={canPreviousPage ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => onPageChange(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={handleNextPage}
                className={canNextPage ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
