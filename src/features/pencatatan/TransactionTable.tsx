import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transaction } from "@/data/mock/transactions";

interface TransactionTableProps {
  transactions: Transaction[];
  onSort: (field: keyof Transaction) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function TransactionTable({
  transactions,
  onSort,
  formatCurrency,
  formatDate,
}: TransactionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort("tanggal")}
            >
              <div className="flex items-center gap-2">
                Tanggal
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSort("jumlah")}
            >
              <div className="flex items-center gap-2">
                Jumlah
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Kantong</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Tidak ada data yang ditemukan
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.tanggal)}</TableCell>
                <TableCell>
                  <Badge
                    variant={transaction.jenis === 'pemasukan' ? 'success' : 'destructive'}
                  >
                    {transaction.jenis}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(transaction.jumlah)}</TableCell>
                <TableCell>{transaction.kantong}</TableCell>
                <TableCell>{transaction.catatan}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ubah</DropdownMenuItem>
                      <DropdownMenuItem>Transfer</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Hapus</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}