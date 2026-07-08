import { api } from '@/lib/api';

export interface CategoryTreeNode {
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  children?: CategoryTreeNode[];
}

export interface CatalogItem {
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  children?: CatalogItem[];
}

export const DEFAULT_CATEGORY_TREE: CategoryTreeNode[] = [
  {
    uuid: 'default-herramientas-poder',
    name: 'Herramientas de Poder',
    slug: 'herramientas-poder',
    children: [
      { uuid: 'default-taladros', name: 'Taladros y Rotomartillos', slug: 'taladros-rotomartillos' },
      { uuid: 'default-amoladoras', name: 'Amoladoras', slug: 'amoladoras' },
      { uuid: 'default-sierras', name: 'Sierras Eléctricas', slug: 'sierras-electricas' },
      { uuid: 'default-llaves', name: 'Llaves de Impacto', slug: 'llaves-impacto' },
    ],
  },
  {
    uuid: 'default-medicion',
    name: 'Medición y Precisión',
    slug: 'medicion-precision',
    children: [
      { uuid: 'default-laser', name: 'Niveles Láser', slug: 'niveles-laser' },
      { uuid: 'default-totales', name: 'Estaciones Totales', slug: 'estaciones-totales' },
      { uuid: 'default-multimetros', name: 'Multímetros Profesionales', slug: 'multimetros' },
      { uuid: 'default-detectores', name: 'Detectores', slug: 'detectores' },
    ],
  },
  {
    uuid: 'default-energia',
    name: 'Energía y Generación',
    slug: 'energia-generacion',
    children: [
      { uuid: 'default-generadores', name: 'Generadores', slug: 'generadores' },
      { uuid: 'default-compresores', name: 'Compresores de Aire', slug: 'compresores' },
      { uuid: 'default-soldadoras', name: 'Soldadoras', slug: 'soldadoras' },
      { uuid: 'default-plantas', name: 'Plantas Eléctricas', slug: 'plantas-electricas' },
    ],
  },
  {
    uuid: 'default-excavacion',
    name: 'Excavación y Demolición',
    slug: 'excavacion-demolicion',
    children: [
      { uuid: 'default-mini', name: 'Mini Excavadoras', slug: 'mini-excavadoras' },
      { uuid: 'default-martillos', name: 'Martillos Demoledores', slug: 'martillos-demoledores' },
      { uuid: 'default-compactadores', name: 'Compactadores', slug: 'compactadores' },
      { uuid: 'default-rozadoras', name: 'Rozadoras', slug: 'rozadoras' },
    ],
  },
  {
    uuid: 'default-elevacion',
    name: 'Elevación y Manejo',
    slug: 'elevacion-manejo',
    children: [
      { uuid: 'default-polipastos', name: 'Polipastos y Winches', slug: 'polipastos' },
      { uuid: 'default-montacargas', name: 'Montacargas y Transpaletas', slug: 'montacargas' },
      { uuid: 'default-andamios', name: 'Andamios Modulares', slug: 'andamios' },
      { uuid: 'default-gruas', name: 'Grúas Portátiles', slug: 'gruas-portatiles' },
    ],
  },
  {
    uuid: 'default-lab',
    name: 'Laboratorio y TI',
    slug: 'laboratorio-ti',
    children: [
      { uuid: 'default-osciloscopios', name: 'Osciloscopios', slug: 'osciloscopios' },
      { uuid: 'default-analizadores', name: 'Analizadores de Red', slug: 'analizadores-red' },
      { uuid: 'default-bga', name: 'Equipos de Soldadura BGA', slug: 'soldadura-bga' },
      { uuid: 'default-fuentes', name: 'Fuentes de Laboratorio', slug: 'fuentes-lab' },
    ],
  },
];

/** @deprecated Use DEFAULT_CATEGORY_TREE */
export const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_TREE.map((c) => ({
  name: c.name,
  slug: c.slug,
}));

export const DEFAULT_BRANDS = [
  { name: 'Hilti', slug: 'hilti' },
  { name: 'DeWalt', slug: 'dewalt' },
  { name: 'Milwaukee', slug: 'milwaukee' },
  { name: 'Makita', slug: 'makita' },
];

export const categoryService = {
  list: async (): Promise<CatalogItem[]> => {
    const res = await api.get('/categories');
    return res.data?.data ?? [];
  },
  listTree: async (): Promise<CategoryTreeNode[]> => {
    const res = await api.get('/categories/tree');
    return res.data?.data ?? [];
  },
  listAdmin: async (): Promise<CatalogItem[]> => {
    const res = await api.get('/categories/admin');
    return res.data?.data ?? [];
  },
  create: async (payload: {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    parentUuid?: string | null;
  }) => {
    const res = await api.post('/categories/admin', payload);
    return res.data?.data;
  },
  update: async (
    uuid: string,
    payload: Partial<{
      name: string;
      slug: string;
      description: string;
      icon: string;
      isActive: boolean;
      parentUuid: string | null;
    }>,
  ) => {
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
