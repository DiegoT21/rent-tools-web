import React, { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  categoryService,
  brandService,
  type CatalogItem,
  DEFAULT_CATEGORY_TREE,
} from '@/services/catalogService';
import { formatApiError } from '@/lib/isAdmin';
import Swal from 'sweetalert2';

export function AdminCatalogTab() {
  const [categories, setCategories] = useState<CatalogItem[]>(DEFAULT_CATEGORY_TREE);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [parentUuid, setParentUuid] = useState<string>('none');
  const [brandName, setBrandName] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, brs] = await Promise.all([
        categoryService.listAdmin(),
        brandService.listAdmin(),
      ]);
      if (cats.length) setCategories(cats);
      setBrands(brs);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);


  const addCategory = async () => {
    if (!catName.trim()) return;
    try {
      await categoryService.create({
        name: catName.trim(),
        parentUuid: parentUuid === 'none' ? null : parentUuid,
      });
      setCatName('');
      setParentUuid('none');
      load();
    } catch (err) {
      await Swal.fire('Error', formatApiError(err), 'error');
    }
  };

  const addBrand = async () => {
    if (!brandName.trim()) return;
    await brandService.create({ name: brandName.trim() });
    setBrandName('');
    load();
  };

  const toggleCategory = async (item: CatalogItem) => {
    await categoryService.update(item.uuid, { isActive: !item.isActive });
    load();
  };

  const toggleBrand = async (item: CatalogItem) => {
    await brandService.update(item.uuid, { isActive: !item.isActive });
    load();
  };

  const deleteCategory = async (item: CatalogItem, hasChildren: boolean) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Desactivar categoría',
      html: hasChildren
        ? `¿Desactivar <strong>${item.name}</strong> y sus subcategorías?`
        : `¿Desactivar <strong>${item.name}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desactivar',
    });
    if (isConfirmed) {
      await categoryService.remove(item.uuid);
      load();
    }
  };

  const deleteBrand = async (item: CatalogItem) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Desactivar marca',
      text: `¿Desactivar "${item.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desactivar',
    });
    if (isConfirmed) {
      await brandService.remove(item.uuid);
      load();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {error && (
        <div className="lg:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="border-slate-100 shadow-lg lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorías (árbol)</CardTitle>
          <button type="button" onClick={load} className="text-slate-500 hover:text-slate-800">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input
              placeholder="Nueva categoría o subcategoría"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="h-11"
            />
            <Select value={parentUuid} onValueChange={setParentUuid}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Categoría padre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Categoría raíz —</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.uuid} value={c.uuid}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" onClick={addCategory} className="shrink-0">
              <Plus className="mr-1 h-4 w-4" /> Agregar
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-xs uppercase text-slate-400">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((parent) => (
                  <React.Fragment key={parent.uuid}>
                    <tr className="border-b border-slate-50 bg-white">
                      <td className="px-4 py-3 font-semibold text-slate-800">{parent.name}</td>
                      <td className="px-4 py-3 text-slate-500">{parent.slug}</td>
                      <td className="px-4 py-3">
                        <Badge className={parent.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}>
                          {parent.isActive !== false ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => toggleCategory(parent)}>
                            {parent.isActive !== false ? 'Desactivar' : 'Activar'}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => deleteCategory(parent, Boolean(parent.children?.length))}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {(parent.children ?? []).map((child) => (
                      <tr key={child.uuid} className="border-b border-slate-50 hover:bg-slate-50/40">
                        <td className="px-4 py-3 pl-10 text-slate-700">
                          <ChevronRight className="mr-1 inline h-3 w-3 text-slate-400" />
                          {child.name}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{child.slug}</td>
                        <td className="px-4 py-3">
                          <Badge className={child.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}>
                            {child.isActive !== false ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => toggleCategory(child)}>
                              {child.isActive !== false ? 'Desactivar' : 'Activar'}
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => deleteCategory(child, false)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Marcas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Nueva marca"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="h-11"
            />
            <Button type="button" onClick={addBrand} className="shrink-0">
              <Plus className="mr-1 h-4 w-4" /> Agregar
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-slate-400">
                  <th className="py-2 pr-2">Nombre</th>
                  <th className="py-2 pr-2">Slug</th>
                  <th className="py-2 pr-2">Estado</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.uuid} className="border-b border-slate-50">
                    <td className="py-3 pr-2 font-medium">{b.name}</td>
                    <td className="py-3 pr-2 text-slate-500">{b.slug}</td>
                    <td className="py-3 pr-2">
                      <Badge className={b.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}>
                        {b.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => toggleBrand(b)}>
                          {b.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => deleteBrand(b)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
