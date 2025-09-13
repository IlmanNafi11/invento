import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionTable } from "@/features/pencatatan/TransactionTable";
import { TransactionFilters } from "@/features/pencatatan/TransactionFilters";
import { TransactionPagination } from "@/features/pencatatan/TransactionPagination";
import { mockTransactions, kantongOptions, type Transaction } from "@/data/mock/transactions";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { DateRange } from "react-day-picker";
import type { FilterField, FilterValues, FilterOption } from "@/components/ui/filter-dialog";

export default function Pencatatan() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Transaction>("tanggal");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter configuration
  const filterFields: FilterField[] = [
    {
      id: 'dateRange',
      label: 'Rentang Tanggal',
      type: 'dateRange',
      placeholder: 'Pilih rentang tanggal'
    },
    {
      id: 'type',
      label: 'Jenis Transaksi',
      type: 'select',
      options: [
        { value: 'all', label: 'Semua' },
        { value: 'pemasukan', label: 'Pemasukan' },
        { value: 'pengeluaran', label: 'Pengeluaran' }
      ] as FilterOption[],
      defaultValue: 'all',
      placeholder: 'Pilih jenis'
    },
    {
      id: 'kantong',
      label: 'Kantong',
      type: 'combobox',
      options: kantongOptions,
      defaultValue: '',
      placeholder: 'Pilih kantong...'
    }
  ];

  const [filterValues, setFilterValues] = useState<FilterValues>({
    dateRange: undefined,
    type: 'all',
    kantong: ''
  });

  // Extract filter values for easier access
  const dateRange = filterValues.dateRange as DateRange | undefined;
  const typeFilter = filterValues.type as string;
  const kantongFilter = filterValues.kantong as string;

  // Filter and search logic
  const filteredTransactions = useMemo(() => {
    const filtered = mockTransactions.filter((transaction) => {
      // Search filter
      const matchesSearch = searchTerm === "" ||
        transaction.catatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.kantong.toLowerCase().includes(searchTerm.toLowerCase());

      // Date range filter
      const transactionDate = new Date(transaction.tanggal);
      const matchesDateRange = !dateRange?.from || !dateRange?.to ||
        (transactionDate >= dateRange.from && transactionDate <= dateRange.to);

      // Type filter
      const matchesType = typeFilter === "all" || transaction.jenis === typeFilter;

      // Kantong filter
      const matchesKantong = kantongFilter === "" || transaction.kantong === kantongFilter;

      return matchesSearch && matchesDateRange && matchesType && matchesKantong;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortField];
      let bValue: string | number | Date = b[sortField];

      if (sortField === "tanggal") {
        aValue = new Date(aValue as string);
        bValue = new Date(bValue as string);
      } else if (sortField === "jumlah") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [searchTerm, dateRange, typeFilter, kantongFilter, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };


  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pencatatan Keuangan</h1>
          <p className="text-muted-foreground">
            Catat pemasukan, dan pengeluaran keuangan anda dalam satu tempat
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      </div>

      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterFields={filterFields}
        filterValues={filterValues}
        onFilterValuesChange={setFilterValues}
      />

      <TransactionTable
        transactions={paginatedTransactions}
        onSort={handleSort}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      <TransactionPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalResults={filteredTransactions.length}
        displayedResults={paginatedTransactions.length}
      />
    </div>
  );
}