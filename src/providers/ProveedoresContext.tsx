import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { proveedoresMock } from '../../services/mockData';
import type { Proveedor } from '../../types';
import { useTenant } from '../tenant/TenantContext';

const STORAGE_KEY = 'af-proveedores-v1';

interface ProveedoresContextValue {
  proveedores: Proveedor[];
  addProveedor: (proveedor: Proveedor) => void;
  updateEstado: (id: string, estado: Proveedor['estado']) => void;
}

const ProveedoresContext = createContext<ProveedoresContextValue | null>(null);

function readProveedores() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return proveedoresMock;
    return (JSON.parse(value) as Proveedor[]).map((item) => {
      if (item.empresaId && item.procesoId) return item;
      const isUfitec = item.id === 'p-003' || item.id === 'p-004';
      return { ...item, empresaId: isUfitec ? 'ufitec' : 'decal', procesoId: isUfitec ? 'proc-ufitec-2026' : 'proc-decal-2026' };
    });
  } catch {
    return proveedoresMock;
  }
}

export function ProveedoresProvider({ children }: { children: ReactNode }) {
  const { selectedEmpresa, selectedProceso } = useTenant();
  const [allProveedores, setAllProveedores] = useState<Proveedor[]>(readProveedores);
  const proveedores = useMemo(() => allProveedores.filter((item) => item.empresaId === selectedEmpresa?.id && item.procesoId === selectedProceso?.id), [allProveedores, selectedEmpresa?.id, selectedProceso?.id]);

  const save = (next: Proveedor[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAllProveedores(next);
  };

  const addProveedor = (proveedor: Proveedor) => save([proveedor, ...allProveedores]);
  const updateEstado = (id: string, estado: Proveedor['estado']) => {
    save(allProveedores.map((proveedor) => proveedor.id === id ? { ...proveedor, estado } : proveedor));
  };

  return <ProveedoresContext.Provider value={{ proveedores, addProveedor, updateEstado }}>{children}</ProveedoresContext.Provider>;
}

export function useProveedores() {
  const context = useContext(ProveedoresContext);
  if (!context) throw new Error('useProveedores debe utilizarse dentro de ProveedoresProvider');
  return context;
}
