import { api } from '@/lib/api';

export interface CatalogItem {
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export const categoryService = {
  list: async (): Promise<CatalogItem[]> => {
    const res = await api.get('/categories');
    return res.data?.data ?? [];
  },
  listAdmin: async (): Promise<CatalogItem[]> => {
    const res = await api.get('/categories/admin');
    return res.data?.data ?? [];
  },
  create: async (payload: { name: string; slug?: string; description?: string; icon?: string }) => {
    const res = await api.post('/categories/admin', payload);
    return res.data?.data;
  },
  update: async (uuid: string, payload: Partial<{ name: string; slug: string; description: string; icon: string; isActive: boolean }>) => {
    const res = await api.patch(`/categories/admin/${uuid}`, payload);
    return res.data?.data;
  },
  remove: async (uuid: string) => {
    const res = await api.delete(`/categories/admin/${uuid}`);
    return res.data?.data;
  },
};

export const brandService = {
  list: async (): Promise<CatalogItem[]> => {
    const res = await api.get('/brands');
    return res.data?.data ?? [];
  },
  listAdmin: async (): Promise<CatalogItem[]> => {
    const res = await api.get('/brands/admin');
    return res.data?.data ?? [];
  },
  create: async (payload: { name: string; slug?: string }) => {
    const res = await api.post('/brands/admin', payload);
    return res.data?.data;
  },
  update: async (uuid: string, payload: Partial<{ name: string; slug: string; isActive: boolean }>) => {
    const res = await api.patch(`/brands/admin/${uuid}`, payload);
    return res.data?.data;
  },
  remove: async (uuid: string) => {
    const res = await api.delete(`/brands/admin/${uuid}`);
    return res.data?.data;
  },
};

export const DEFAULT_CATEGORIES = [
  { name: 'Herramientas de Poder', slug: 'drills' },
  { name: 'Excavadoras', slug: 'access' },
  { name: 'Manejo de Materiales', slug: 'generators' },
  { name: 'Lab. de Precisión', slug: 'saws' },
];

export const DEFAULT_BRANDS = [
  { name: 'Hilti', slug: 'hilti' },
  { name: 'DeWalt', slug: 'dewalt' },
  { name: 'Milwaukee', slug: 'milwaukee' },
  { name: 'Makita', slug: 'makita' },
];
