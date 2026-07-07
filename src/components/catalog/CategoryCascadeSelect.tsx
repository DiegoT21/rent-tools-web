import { useEffect, useMemo, useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { CategoryTreeNode } from '@/services/catalogService';

interface CategoryCascadeSelectProps {
  tree: CategoryTreeNode[];
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}

function SearchableList({
  items,
  value,
  onSelect,
  placeholder,
}: {
  items: CategoryTreeNode[];
  value: string;
  onSelect: (uuid: string) => void;
  placeholder: string;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) => i.name.toLowerCase().includes(term));
  }, [items, q]);

  return (
    <div className="space-y-2">
      <Input
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-9"
      />
      <div className="max-h-48 overflow-y-auto space-y-0.5">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-sm text-slate-400">Sin resultados</p>
        ) : (
          filtered.map((item) => (
            <button
              key={item.uuid}
              type="button"
              onClick={() => onSelect(item.uuid)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100',
                value === item.uuid && 'bg-orange-50 text-primary font-semibold',
              )}
            >
              <Check className={cn('h-4 w-4 shrink-0', value === item.uuid ? 'opacity-100' : 'opacity-0')} />
              {item.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function CategoryCascadeSelect({ tree, value, onChange, disabled }: CategoryCascadeSelectProps) {
  const [parentUuid, setParentUuid] = useState('');
  const [parentOpen, setParentOpen] = useState(false);
  const [childOpen, setChildOpen] = useState(false);

  useEffect(() => {
    if (!value || !tree.length) return;
    for (const parent of tree) {
      if (parent.uuid === value) {
        setParentUuid(parent.uuid);
        return;
      }
      const child = parent.children?.find((c) => c.uuid === value);
      if (child) {
        setParentUuid(parent.uuid);
        return;
      }
    }
  }, [value, tree]);

  const selectedParent = tree.find((p) => p.uuid === parentUuid);
  const children = selectedParent?.children ?? [];
  const requiresChild = children.length > 0;

  const selectedParentLabel = selectedParent?.name ?? 'Selecciona categoría principal';
  const selectedChild = children.find((c) => c.uuid === value);
  const selectedChildLabel = selectedChild?.name ?? (requiresChild ? 'Selecciona subcategoría' : selectedParentLabel);

  const handleParentSelect = (uuid: string) => {
    setParentUuid(uuid);
    setParentOpen(false);
    const parent = tree.find((p) => p.uuid === uuid);
    if (!parent?.children?.length) {
      onChange(uuid);
    } else {
      onChange('');
    }
  };

  const handleChildSelect = (uuid: string) => {
    onChange(uuid);
    setChildOpen(false);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-slate-600 font-semibold">Categoría principal</Label>
        <Popover open={parentOpen} onOpenChange={setParentOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-12 w-full justify-between rounded-xl border-slate-200 bg-slate-50 font-normal"
            >
              <span className="truncate">{selectedParentLabel}</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-3" align="start">
            <SearchableList
              items={tree}
              value={parentUuid}
              onSelect={handleParentSelect}
              placeholder="Buscar categoría..."
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-600 font-semibold">
          {requiresChild ? 'Subcategoría' : 'Subcategoría (opcional)'}
        </Label>
        <Popover open={childOpen} onOpenChange={setChildOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !parentUuid || !requiresChild}
              className="h-12 w-full justify-between rounded-xl border-slate-200 bg-slate-50 font-normal"
            >
              <span className="truncate">{selectedChildLabel}</span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-3" align="start">
            <SearchableList
              items={children}
              value={value}
              onSelect={handleChildSelect}
              placeholder="Buscar subcategoría..."
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
