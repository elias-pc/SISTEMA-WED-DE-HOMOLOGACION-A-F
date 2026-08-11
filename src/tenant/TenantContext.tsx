import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../../services/api';
import type { Empresa, ProcesoHomologacion } from '../../types';
import { useAuth } from '../auth/AuthContext';

const SELECTED_KEY='af-selected-tenant-v1';
interface TenantContextValue{empresas:Empresa[];procesos:ProcesoHomologacion[];empresasDisponibles:Empresa[];selectedEmpresa:Empresa|null;selectedProceso:ProcesoHomologacion|null;loading:boolean;selectEmpresa:(id:string)=>void;selectProceso:(id:string)=>void;createEmpresaConProceso:(empresa:Empresa,proceso:ProcesoHomologacion)=>Promise<void>}
const TenantContext=createContext<TenantContextValue|null>(null);
export function TenantProvider({children}:{children:ReactNode}){
 const {user}=useAuth();const [empresas,setEmpresas]=useState<Empresa[]>([]);const [procesos,setProcesos]=useState<ProcesoHomologacion[]>([]);const [loading,setLoading]=useState(false);
 const [selectedEmpresaId,setSelectedEmpresaId]=useState(()=>localStorage.getItem(SELECTED_KEY)||'');const [selectedProcesoId,setSelectedProcesoId]=useState('');
 useEffect(()=>{if(!user){setEmpresas([]);setProcesos([]);return}let active=true;setLoading(true);Promise.all([api.companies(),api.processes()]).then(([c,p])=>{if(active){setEmpresas(c.companies);setProcesos(p.processes)}}).catch(console.error).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[user]);
 const empresasDisponibles=empresas;
 const effectiveEmpresaId=empresasDisponibles.some(i=>i.id===selectedEmpresaId)?selectedEmpresaId:empresasDisponibles[0]?.id||'';
 const procesosDisponibles=procesos.filter(p=>p.empresaId===effectiveEmpresaId);
 const effectiveProcesoId=procesosDisponibles.some(i=>i.id===selectedProcesoId)?selectedProcesoId:procesosDisponibles[0]?.id||'';
 const selectedEmpresa=empresas.find(i=>i.id===effectiveEmpresaId)||null;const selectedProceso=procesos.find(i=>i.id===effectiveProcesoId)||null;
 useEffect(()=>{if(effectiveEmpresaId)localStorage.setItem(SELECTED_KEY,effectiveEmpresaId)},[effectiveEmpresaId]);
 const createEmpresaConProceso=async(empresa:Empresa,proceso:ProcesoHomologacion)=>{const createdCompany=await api.createCompany(empresa);const createdProcess=await api.createProcess(proceso);setEmpresas(current=>[...current,createdCompany.company]);setProcesos(current=>[...current,createdProcess.process]);setSelectedEmpresaId(empresa.id);setSelectedProcesoId(proceso.id)};
 const value=useMemo(()=>({empresas,procesos,empresasDisponibles,selectedEmpresa,selectedProceso,loading,selectEmpresa:setSelectedEmpresaId,selectProceso:setSelectedProcesoId,createEmpresaConProceso}),[empresas,procesos,selectedEmpresa,selectedProceso,loading]);
 return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
export function useTenant(){const context=useContext(TenantContext);if(!context)throw new Error('useTenant debe utilizarse dentro de TenantProvider');return context}
