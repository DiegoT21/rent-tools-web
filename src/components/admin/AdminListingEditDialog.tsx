import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryCascadeSelect } from '@/components/catalog/CategoryCascadeSelect';
import {
  brandService,
  categoryService,
  DEFAULT_BRANDS,
  DEFAULT_CATEGORY_TREE,
  type CategoryTreeNode,
} from '@/services/catalogService';
import { toolService } from '@/services/toolService';
import { formatApiError } from '@/lib/isAdmin';
import { Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export interface AdminListingItem {
  uuid: string;
  name: string;
  brand?: string;
  category?: string;
  categoryId?: string | { uuid?: string; name?: string };
  status?: string;
  isAvailable?: boolean;
  pricePerDay?: number;
  owner?: { firstName?: string; lastName?: string; email?: string };
}

function resolveCategoryUuid(item: AdminListingItem, tree: CategoryTreeNode[]): string {
  const raw = item.categoryId;
  if (raw && typeof raw === 'object' && raw.uuid) return raw.uuid;
  if (typeof raw === 'string' && raw.includes('-')) return raw;

  const label = (item.category ?? '').trim();
  if (!label) return '';

  for (const parent of tree) {
    if (parent.name === label) return parent.uuid;
    for (const child of parent.children ?? []) {
      if (child.name === label || label === `${parent.name} > ${child.name}`) return child.uuid;
    }
  }
  return '';
}

interface AdminListingEditDialogProps {
  item: AdminListingItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AdminListingEditDialog({ item, open, onOpenChange, onSaved }: AdminListingEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>(DEFAULT_CATEGORY_TREE);
  const [brandOptions, setBrandOptions] = useState(DEFAULT_BRANDS);
  const [form, setForm] = useState({
    name: '',
    brand: '',
    categoryId: '',
    pricePerDay: '',
    status: 'approved',
  });

  useEffect(() => {
    Promise.all([categoryService.listTree(), brandService.list()])
      .then(([tree, brands]) => {
        if (tree.length) setCategoryTree(tree);
        if (brands.length) setBrandOptions(brands.map((b) => ({ name: b.name, slug: b.slug })));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!item || !open) return;
    setForm({
      name: item.name ?? '',
      brand: item.brand ?? '',
      categoryId: resolveCategoryUuid(item, categoryTree),
      pricePerDay: String(item.pricePerDay ?? ''),
      status: item.status ?? 'approved',
    });
  }, [item, open, categoryTree]);

  const handleSave = async () => {
    if (!item) return;
    if (!form.name.trim()) {
      await Swal.fire('Campo requerido', 'El nombre es obligatorio.', 'warning');
      return;
    }
    if (!form.categoryId) {
      await Swal.fire('Campo requerido', 'Selecciona una categoría.', 'warning');
      return;
    }
    if (!form.brand.trim() || form.brand.trim().length < 2) {
      await Swal.fire('Campo requerido', 'Escribe una marca válida.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await toolService.adminUpdate(item.uuid, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        categoryId: form.categoryId,
        pricePerDay: Number(form.pricePerDay) || 0,
        status: form.status,
      });
      await Swal.fire('Actualizada', 'Publicación modificada correctamente.', 'success');
      onOpenChange(false);
      onSaved();
    } catch (err) {
      await Swal.fire('Error', formatApiError(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar publicación</DialogTitle>
          <DialogDescription className="truncate">
            {item?.name ?? '—'}
            {item?.owner?.email ? ` · ${item.owner.email}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin-edit-name">Nombre de la herramienta</Label>
            <Input
              id="admin-edit-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>

          <CategoryCascadeSelect
            tree={categoryTree}
            value={form.categoryId}
            onChange={(categoryId) => setForm((f) => ({ ...f, categoryId }))}
          />

          <div className="space-y-2">
            <Label htmlFor="admin-edit-brand">Marca</Label>
            <Input
              id="admin-edit-brand"
              list="admin-brand-suggestions"
              disabled={!form.categoryId}
              placeholder={form.categoryId ? 'Ej. DeWalt, Apple, Hilti...' : 'Selecciona primero una categoría'}
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              className="h-11 rounded-xl disabled:opacity-60"
            />
            <datalist id="admin-brand-suggestions">
              {brandOptions.map((b) => (
                <option key={b.slug} value={b.name} />
              ))}
            </datalist>
            <p className="text-xs text-slate-400">
              {form.categoryId
                ? 'Marcas del catálogo como sugerencias, o escribe una personalizada.'
                : 'Selecciona una categoría para habilitar la marca.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-edit-price">Precio por día ($)</Label>
              <Input
                id="admin-edit-price"
                type="number"
                min={0}
                value={form.pricePerDay}
                onChange={(e) => setForm((f) => ({ ...f, pricePerDay: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado de revisión</Label>
              <Select value={form.status} onValueChange={(status) => setForm((f) => ({ ...f, status }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
