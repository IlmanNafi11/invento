import { Input } from "@/components/ui/input";
import { FilterDialog, type FilterField, type FilterValues } from "@/components/ui/filter-dialog";

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterFields: FilterField[];
  filterValues: FilterValues;
  onFilterValuesChange: (values: FilterValues) => void;
}

export function TransactionFilters({
  searchTerm,
  onSearchChange,
  filterFields,
  filterValues,
  onFilterValuesChange,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-end">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Cari catatan atau kantong..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-[250px]"
        />
      </div>

      <FilterDialog
        title="Filter Transaksi"
        description="Atur filter untuk mencari transaksi yang diinginkan."
        fields={filterFields}
        values={filterValues}
        onValuesChange={onFilterValuesChange}
      />
    </div>
  );
}