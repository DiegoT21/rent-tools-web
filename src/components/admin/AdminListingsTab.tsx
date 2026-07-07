import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2, Search, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toolService } from '@/services/toolService';
import { formatApiError } from '@/lib/isAdmin';
import Swal from 'sweetalert2';

interface AdminListing {
  uuid: string;
  name: string;
  brand?: string;
  category?: string;
  status?: string;
  isAvailable?: boolean;
  pricePerDay?: number;
  owner?: { firstName?: string; lastName?: string; email?: string };
}

export function AdminListingsTab() {
  const [items, setItems] = useState<AdminListing[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  const load = async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await toolService.listAdmin(p, q || undefined, ownerEmail || undefined);
      setItems(result.items);
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(formatApiError(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (item: AdminListing) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar publicación',
      html: `¿Eliminar <strong>${item.name}</strong> sin restricciones?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Eliminar',
    });
    if (!isConfirmed) return;
    try {
      await toolService.adminDelete(item.uuid);
      await Swal.fire('Eliminada', 'La publicación fue eliminada.', 'success');
      load(page);
    } catch (err: unknown) {
      await Swal.fire('Error', formatApiError(err), 'error');
    }
  };

  const handleEdit = async (item: AdminListing) => {
    const { value: formValues } = await Swal.fire({
      title: `Editar: ${item.name}`,
      html:
        `<input id="swal-name" class="swal2-input" placeholder="Nombre" value="${item.name ?? ''}">` +
        `<input id="swal-brand" class="swal2-input" placeholder="Marca" value="${item.brand ?? ''}">` +
        `<input id="swal-category" class="swal2-input" placeholder="Categoría" value="${item.category ?? ''}">` +
        `<input id="swal-price" class="swal2-input" type="number" placeholder="Precio/día" value="${item.pricePerDay ?? 0}">` +
        `<select id="swal-status" class="swal2-input">` +
        `<option value="pending" ${item.status === 'pending' ? 'selected' : ''}>pending</option>` +
        `<option value="approved" ${item.status === 'approved' ? 'selected' : ''}>approved</option>` +
        `<option value="rejected" ${item.status === 'rejected' ? 'selected' : ''}>rejected</option>` +
        `</select>`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => ({
        name: (document.getElementById('swal-name') as HTMLInputElement).value,
        brand: (document.getElementById('swal-brand') as HTMLInputElement).value,
        category: (document.getElementById('swal-category') as HTMLInputElement).value,
        pricePerDay: Number((document.getElementById('swal-price') as HTMLInputElement).value),
        status: (document.getElementById('swal-status') as HTMLSelectElement).value,
      }),
    });
    if (!formValues) return;
    try {
      await toolService.adminUpdate(item.uuid, formValues);
      await Swal.fire('Actualizada', 'Publicación modificada.', 'success');
      load(page);
    } catch (err) {
      await Swal.fire('Error', formatApiError(err), 'error');
    }
  };

  return (
    <Card className="border-slate-100 shadow-lg">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Publicaciones</CardTitle>
        <button type="button" onClick={() => load(page)} className="text-slate-500 hover:text-slate-800">
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Buscar por nombre..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Input placeholder="Email del dueño..." value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
          <Button type="button" onClick={() => load(1)} className="shrink-0">
            <Search className="mr-1 h-4 w-4" /> Buscar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400">
            <RefreshCw className="mr-2 h-6 w-6 animate-spin" /> Cargando...
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            {error ? 'No se pudieron cargar las publicaciones.' : 'No hay publicaciones en el sistema.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50/50 text-xs uppercase text-slate-400">
                  <th className="px-3 py-3">Herramienta</th>
                  <th className="px-3 py-3">Dueño</th>
                  <th className="px-3 py-3">Categoría</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.uuid} className="border-b border-slate-50 hover:bg-slate-50/40">
                    <td className="px-3 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-3 py-3 text-slate-500">
                      {item.owner?.firstName} {item.owner?.lastName}
                      <br />
                      <span className="text-xs">{item.owner?.email}</span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{item.category}</td>
                    <td className="px-3 py-3">
                      <Badge className={item.isAvailable ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}>
                        {item.status ?? (item.isAvailable ? 'Disponible' : 'No disp.')}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => handleEdit(item)}>
                          <Pencil className="mr-1 h-4 w-4" /> Editar
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => handleDelete(item)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => load(page - 1)}>
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm text-slate-500">
              {page} / {totalPages}
            </span>
            <Button type="button" variant="outline" disabled={page >= totalPages} onClick={() => load(page + 1)}>
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
