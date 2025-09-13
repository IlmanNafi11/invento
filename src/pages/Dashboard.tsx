"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Saldo</CardTitle>
            <CardDescription>Saldo keseluruhan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp 10,000,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Pemasukan</CardTitle>
            <CardDescription>Pemasukan bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">Rp 5,000,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Pengeluaran</CardTitle>
            <CardDescription>Pengeluaran bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">Rp 3,000,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Utang</CardTitle>
            <CardDescription>Utang yang belum dibayar</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">Rp 2,000,000</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}