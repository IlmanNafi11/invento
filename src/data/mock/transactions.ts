export interface Transaction {
  id: number;
  tanggal: string;
  jenis: 'pemasukan' | 'pengeluaran';
  jumlah: number;
  kantong: string;
  catatan: string;
}

export const mockTransactions: Transaction[] = [
  {
    id: 1,
    tanggal: "2024-01-15",
    jenis: "pemasukan",
    jumlah: 5000000,
    kantong: "Kantong Utama",
    catatan: "Gaji bulan Januari"
  },
  {
    id: 2,
    tanggal: "2024-01-16",
    jenis: "pengeluaran",
    jumlah: 150000,
    kantong: "Kantong Belanja",
    catatan: "Belanja bulanan"
  },
  {
    id: 3,
    tanggal: "2024-01-17",
    jenis: "pemasukan",
    jumlah: 2000000,
    kantong: "Kantong Operasional",
    catatan: "Bonus proyek"
  },
  {
    id: 4,
    tanggal: "2024-01-18",
    jenis: "pengeluaran",
    jumlah: 75000,
    kantong: "Kantong Transport",
    catatan: "Bensin motor"
  },
  {
    id: 5,
    tanggal: "2024-01-19",
    jenis: "pemasukan",
    jumlah: 1500000,
    kantong: "Kantong Utama",
    catatan: "Freelance project"
  },
  {
    id: 6,
    tanggal: "2024-01-20",
    jenis: "pengeluaran",
    jumlah: 250000,
    kantong: "Kantong Belanja",
    catatan: "Pembelian elektronik"
  },
  {
    id: 7,
    tanggal: "2024-01-21",
    jenis: "pemasukan",
    jumlah: 3000000,
    kantong: "Kantong Operasional",
    catatan: "Penjualan produk"
  },
  {
    id: 8,
    tanggal: "2024-01-22",
    jenis: "pengeluaran",
    jumlah: 100000,
    kantong: "Kantong Transport",
    catatan: "Service motor"
  },
  {
    id: 9,
    tanggal: "2024-01-23",
    jenis: "pemasukan",
    jumlah: 800000,
    kantong: "Kantong Utama",
    catatan: "Dividen investasi"
  },
  {
    id: 10,
    tanggal: "2024-01-24",
    jenis: "pengeluaran",
    jumlah: 50000,
    kantong: "Kantong Belanja",
    catatan: "Makanan harian"
  },
  {
    id: 11,
    tanggal: "2024-01-25",
    jenis: "pemasukan",
    jumlah: 1200000,
    kantong: "Kantong Operasional",
    catatan: "Komisi penjualan"
  },
  {
    id: 12,
    tanggal: "2024-01-26",
    jenis: "pengeluaran",
    jumlah: 300000,
    kantong: "Kantong Transport",
    catatan: "Pembelian sparepart"
  },
  {
    id: 13,
    tanggal: "2024-01-27",
    jenis: "pemasukan",
    jumlah: 2500000,
    kantong: "Kantong Utama",
    catatan: "Bonus kinerja"
  },
  {
    id: 14,
    tanggal: "2024-01-28",
    jenis: "pengeluaran",
    jumlah: 180000,
    kantong: "Kantong Belanja",
    catatan: "Belanja bahan makanan"
  },
  {
    id: 15,
    tanggal: "2024-01-29",
    jenis: "pemasukan",
    jumlah: 900000,
    kantong: "Kantong Operasional",
    catatan: "Pendapatan rental"
  }
];

export const kantongOptions = [
  "Kantong Utama",
  "Kantong Belanja",
  "Kantong Operasional",
  "Kantong Transport",
  "Kantong Tabungan",
  "Kantong Investasi"
];