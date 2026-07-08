import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Plus, Trash2, ChevronRight, ChevronDown, FolderPlus, CornerDownRight } from 'lucide-react';
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
  const [createMode, setCreateMode] = useState<'root' | 'child'>('root');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [brandName, setBrandName] = useState('');
  const catNameRef = useRef<HTMLInputElement>(null);

  const toggleExpanded = (uuid: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });
  };

  const startAddSubcategory = (parent: CatalogItem) => {
    setCreateMode('child');
    setParentUuid(parent.uuid);
    setExpandedIds((prev) => new Set(prev).add(parent.uuid));
    setTimeout(() => catNameRef.current?.focus(), 0);
  };

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
    if (createMode === 'child' && parentUuid === 'none') {
      await Swal.fire('Falta la categoría padre', 'Selecciona la categoría principal para la subcategoría.', 'warning');
      return;
    }
    try {
      await categoryService.create({
        name: catName.trim(),
        parentUuid: createMode === 'child' ? parentUuid : null,
      });
      setCatName('');
      if (createMode === 'root') setParentUuid('none');
      load();
    } catch (err) {
      await Swal.fire('Error', formatApiError(err), 'error');
    }
  };

  const addBrand = async () => {
    if (!brandName.trim()) return;
    try {
      await brandService.create({ name: brandName.trim() });
      setBrandName('');
      load();
    } catch (err) {
      await Swal.fire('Error', formatApiError(err), 'error');
    }
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
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => { setCreateMode('root'); setParentUuid('none'); }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${createMode === 'root' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <FolderPlus className="h-4 w-4" /> Categoría principal
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('child')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${createMode === 'child' ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CornerDownRight className="h-4 w-4" /> Subcategoría
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              {createMode === 'child' && (
                <Select value={parentUuid} onValueChange={setParentUuid}>
                  <SelectTrigger className="h-11 sm:col-span-2">
                    <SelectValue placeholder="Selecciona la categoría principal" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.uuid} value={c.uuid}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Input
                ref={catNameRef}
                placeholder={createMode === 'child' ? 'Nombre de la subcategoría' : 'Nombre de la categoría principal'}
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }}
                className="h-11"
              />
              <Button type="button" onClick={addCategory} className="h-11 shrink-0">
                <Plus className="mr-1 h-4 w-4" />
                {createMode === 'child' ? 'Crear subcategoría' : 'Crear categoría'}
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              {createMode === 'child'
                ? 'La subcategoría quedará dentro de la categoría principal que elijas.'
                : 'Crea una categoría de primer nivel. Luego podrás agregarle subcategorías.'}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-100">
            {categories.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-slate-400">No hay categorías todavía.</div>
            ) : (
              categories.map((parent) => {
                const childCount = parent.children?.length ?? 0;
                const isExpanded = expandedIds.has(parent.uuid);
                return (
                  <div key={parent.uuid} className="border-b border-slate-100 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-3 bg-white px-3 py-3 hover:bg-slate-50/60">
                      <button
                        type="button"
                        onClick={() => childCount > 0 && toggleExpanded(parent.uuid)}
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-400 ${childCount > 0 ? 'hover:bg-slate-100 hover:text-slate-700' : 'cursor-default opacity-40'}`}
                        aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{parent.name}</span>
                          {childCount > 0 && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                              {childCount} subcategoría{childCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          <Badge className={parent.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}>
                            {parent.isActive !== false ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                        <span className="text-xs text-slate-400">{parent.slug}</span>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button type="button" size="sm" variant="ghost" className="text-primary hover:bg-orange-50" onClick={() => startAddSubcategory(parent)}>
                          <Plus className="mr-1 h-4 w-4" /> Subcategoría
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => toggleCategory(parent)}>
                          {parent.isActive !== false ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => deleteCategory(parent, childCount > 0)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && childCount > 0 && (
                      <div className="bg-slate-50/40">
                        {(parent.children ?? []).map((child) => (
                          <div key={child.uuid} className="flex flex-wrap items-center gap-3 border-t border-slate-100 py-2.5 pl-12 pr-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                <span className="text-slate-700">{child.name}</span>
                                <Badge className={child.isActive !== false ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}>
                                  {child.isActive !== false ? 'Activa' : 'Inactiva'}
                                </Badge>
                              </div>
                              <span className="pl-5 text-xs text-slate-400">{child.slug}</span>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => toggleCategory(child)}>
                                {child.isActive !== false ? 'Desactivar' : 'Activar'}
                              </Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => deleteCategory(child, false)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
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
