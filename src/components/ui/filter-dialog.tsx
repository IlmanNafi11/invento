"use client";

import { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Filter field types
export type FilterFieldType = 'dateRange' | 'select' | 'combobox' | 'input';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  id: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: string[] | FilterOption[]; // For select and combobox
  defaultValue?: string | DateRange | undefined;
}

export interface FilterValues {
  [key: string]: string | DateRange | undefined;
}

interface FilterDialogProps {
  title?: string;
  description?: string;
  fields: FilterField[];
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;
  triggerClassName?: string;
}

export function FilterDialog({
  title = "Filter",
  description = "Atur filter untuk mencari data yang diinginkan.",
  fields,
  values,
  onValuesChange,
  triggerClassName,
}: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [tempValues, setTempValues] = useState<FilterValues>(values);

  // Update temp values when values prop changes
  useEffect(() => {
    setTempValues(values);
  }, [values]);

  const handleApplyFilters = () => {
    onValuesChange(tempValues);
    setOpen(false);
  };

  const handleResetFilters = () => {
    const resetValues: FilterValues = {};
    fields.forEach(field => {
      resetValues[field.id] = field.defaultValue || getDefaultValueForType(field.type);
    });
    setTempValues(resetValues);
  };

  const getDefaultValueForType = (type: FilterFieldType): string | DateRange | undefined => {
    switch (type) {
      case 'dateRange':
        return undefined;
      case 'select':
      case 'combobox':
      case 'input':
        return '';
      default:
        return '';
    }
  };

  const handleFieldChange = (fieldId: string, value: string | DateRange | undefined) => {
    setTempValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const hasActiveFilters = () => {
    return fields.some(field => {
      const value = values[field.id];
      const defaultValue = field.defaultValue || getDefaultValueForType(field.type);

      if (field.type === 'dateRange') {
        const dateRangeValue = value as DateRange | undefined;
        return dateRangeValue && (dateRangeValue.from || dateRangeValue.to);
      }

      return value !== defaultValue && value !== '';
    });
  };

  const renderField = (field: FilterField) => {
    const value = tempValues[field.id];

    switch (field.type) {
      case 'dateRange':
        return (
          <DateRangePicker
            date={value as DateRange | undefined}
            onDateChange={(date) => handleFieldChange(field.id, date)}
            className="w-full"
          />
        );

      case 'select': {
        const selectOptions = field.options || [];
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={field.placeholder || 'Pilih opsi'} />
            </SelectTrigger>
            <SelectContent>
              {selectOptions.map((option, index) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                return (
                  <SelectItem key={optionValue || index} value={optionValue}>
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      }

      case 'combobox': {
        const comboboxOptions = field.options || [];
        const stringOptions = comboboxOptions.map(option =>
          typeof option === 'string' ? option : option.value
        );
        return (
          <Combobox
            options={stringOptions}
            value={(value as string) || ''}
            onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
            placeholder={field.placeholder || 'Pilih opsi...'}
            className="w-full"
          />
        );
      }

      case 'input':
        return (
          <Input
            value={(value as string) || ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`gap-2 ${triggerClassName || ''}`}>
          <Filter className="h-4 w-4" />
          Filter
          {hasActiveFilters() && (
            <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Date Range - Full Width */}
          {fields
            .filter(field => field.type === 'dateRange')
            .map((field) => (
              <div key={field.id} className="grid gap-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                {renderField(field)}
              </div>
            ))}

          {/* Jenis Transaksi and Kantong - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields
              .filter(field => field.type === 'select' || field.type === 'combobox')
              .map((field) => (
                <div key={field.id} className="grid gap-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  {renderField(field)}
                </div>
              ))}
          </div>

          {/* Other input fields - Full Width */}
          {fields
            .filter(field => field.type === 'input')
            .map((field) => (
              <div key={field.id} className="grid gap-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                {renderField(field)}
              </div>
            ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleResetFilters}>
            Reset
          </Button>
          <Button onClick={handleApplyFilters}>
            Terapkan Filter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}