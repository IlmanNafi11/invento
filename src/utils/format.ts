export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}


export function extractUniqueRoles(users: Array<{ role: { name: string } }>): Array<{ id: number; nama_role: string; jumlah_permission: number; tanggal_diperbarui: string }> {
  const uniqueRoles = Array.from(new Set(users.map(user => user.role.name)));
  return uniqueRoles.map((role, index) => ({
    id: index + 1,
    nama_role: role,
    jumlah_permission: 0,
    tanggal_diperbarui: new Date().toISOString(),
  }));
}
