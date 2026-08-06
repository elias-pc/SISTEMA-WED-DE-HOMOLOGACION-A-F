import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { empresasMock, procesosMock } from '../../services/mockData';
import type { Empresa, ProcesoHomologacion } from '../../types';
import { useAuth } from '../auth/AuthContext';

const EMPRESAS_KEY = 'af-empresas-v1';
const PROCESOS_KEY = 'af-procesos-v1';
const SELECTED_KEY = 'af-selected-tenant-v1';

interface TenantContextValue {
  empresas: Empresa[];
  procesos: ProcesoHomologacion[];
  empresasDisponibles: Empresa[];
  selectedEmpresa: Empresa | null;
  selectedProceso: ProcesoHomologacion | null;
  selectEmpresa: (id: string) => void;
  selectProceso: (id: string) => void;
  createEmpresaConProceso: (empresa: Empresa, proceso: ProcesoHomologacion) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

function readList<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : fallback;
  } catch { return fallback; }
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>(() => readList(EMPRESAS_KEY, empresasMock));
  const [procesos, setProcesos] = useState<ProcesoHomologacion[]>(() => readList(PROCESOS_KEY, procesosMock));
  const [selectedEmpresaId, setSelectedEmpresaId] = useState(() => localStorage.getItem(SELECTED_KEY) || '');
  const [selectedProcesoId, setSelectedProcesoId] = useState('');

  const empresasDisponibles = useMemo(() => {
    if (!user) return [];
    return user.role === 'supervisor_general' ? empresas : empresas.filter((empresa) => user.empresaIds.includes(empresa.id) || (user.role === 'ejecutiva' && procesos.some((proceso) => proceso.empresaId === empresa.id && proceso.ejecutivaId === user.id)));
  }, [empresas, procesos, user]);

  const effectiveEmpresaId = empresasDisponibles.some((item) => item.id === selectedEmpresaId) ? selectedEmpresaId : empresasDisponibles[0]?.id || '';
  const procesosDisponibles = procesos.filter((proceso) => proceso.empresaId === effectiveEmpresaId);
  const effectiveProcesoId = procesosDisponibles.some((item) => item.id === selectedProcesoId) ? selectedProcesoId : procesosDisponibles[0]?.id || '';
  const selectedEmpresa = empresas.find((item) => item.id === effectiveEmpresaId) || null;
  const selectedProceso = procesos.find((item) => item.id === effectiveProcesoId) || null;

  useEffect(() => {
    if (effectiveEmpresaId) localStorage.setItem(SELECTED_KEY, effectiveEmpresaId);
  }, [effectiveEmpresaId]);

  const createEmpresaConProceso = (empresa: Empresa, proceso: ProcesoHomologacion) => {
    const nextEmpresas = [...empresas, empresa];
    const nextProcesos = [...procesos, proceso];
    localStorage.setItem(EMPRESAS_KEY, JSON.stringify(nextEmpresas));
    localStorage.setItem(PROCESOS_KEY, JSON.stringify(nextProcesos));
    setEmpresas(nextEmpresas);
    setProcesos(nextProcesos);
    setSelectedEmpresaId(empresa.id);
    setSelectedProcesoId(proceso.id);
  };

  return (
    <TenantContext.Provider value={{ empresas, procesos, empresasDisponibles, selectedEmpresa, selectedProceso, selectEmpresa: setSelectedEmpresaId, selectProceso: setSelectedProcesoId, createEmpresaConProceso }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant debe utilizarse dentro de TenantProvider');
  return context;
}
