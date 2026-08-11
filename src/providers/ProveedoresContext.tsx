import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../../services/api';
import type { EstadoSeguimiento, Proveedor } from '../../types';
import { useTenant } from '../tenant/TenantContext';
interface ProveedoresContextValue{proveedores:Proveedor[];loading:boolean;addProveedor:(proveedor:Proveedor)=>Promise<void>;updateEstado:(id:string,estado:EstadoSeguimiento)=>Promise<void>}
const ProveedoresContext=createContext<ProveedoresContextValue|null>(null);
export function ProveedoresProvider({children}:{children:ReactNode}){
 const {selectedProceso}=useTenant();const [proveedores,setProveedores]=useState<Proveedor[]>([]);const [loading,setLoading]=useState(false);
 useEffect(()=>{if(!selectedProceso){setProveedores([]);return}let active=true;setLoading(true);api.providers(selectedProceso.id).then(r=>{if(active)setProveedores(r.providers)}).catch(console.error).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[selectedProceso?.id]);
 const value=useMemo<ProveedoresContextValue>(()=>({proveedores,loading,addProveedor:async proveedor=>{const result=await api.createProvider(proveedor);setProveedores(current=>[result.provider,...current])},updateEstado:async(id,estado)=>{const result=await api.updateProviderStatus(id,estado);setProveedores(current=>current.map(item=>item.id===id?result.provider:item))}}),[proveedores,loading]);
 return <ProveedoresContext.Provider value={value}>{children}</ProveedoresContext.Provider>;
}
export function useProveedores(){const context=useContext(ProveedoresContext);if(!context)throw new Error('useProveedores debe utilizarse dentro de ProveedoresProvider');return context}
