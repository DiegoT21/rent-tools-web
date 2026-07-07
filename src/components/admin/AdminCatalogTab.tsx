import React, { useEffect, useState } from 'react';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { categoryService, brandService, type CatalogItem } from '@/services/catalogService';
import Swal from 'sweetalert2';

export function AdminCatalogTab() {
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [catName, setCatName] = useState('');
  const [brandName, setBrandName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [cats, brs] = await Promise.all([
        categoryService.listAdmin(),
        brandService.listAdmin(),
      ]);
      setCategories(cats);
      setBrands(brs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async () => {
    if (!catName.trim()) return;
    await categoryService.create({ name: catName.trim() });
    setCatName('');
    load();
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

  const deleteCategory = async (item: CatalogItem) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Desactivar categoría',
      text: `¿Desactivar "${item.name}"?`,
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
      <Card className="border-slate-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categorías</CardTitle>
          <button type="button" onClick={load} className="text-slate-500 hover:text-slate-800">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Nueva categoría"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="h-11"
            />
            <Button type="button" onClick={addCategory} className="shrink-0">
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
                {categories.map((c) => (
                  <tr key={c.uuid} className="border-b border-slate-50">
                    <td className="py-3 pr-2 font-medium">{c.name}</td>
                    <td className="py-3 pr-2 text-slate-500">{c.slug}</td>
                    <td className="py-3 pr-2">
                      <Badge className={c.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}>
                        {c.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => toggleCategory(c)}>
                          {c.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => deleteCategory(c)}>
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

      <Card className="border-slate-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Marcas</CardTitle>
          <button type="button" onClick={load} className="text-slate-500 hover:text-slate-800">
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
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
