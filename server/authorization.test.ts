import { describe,expect,it } from 'vitest';
import { canAccessCompany,canUpdateStatus } from './authorization.js';
describe('autorización por roles',()=>{
 it('limita los estados de la ejecutiva',()=>{expect(canUpdateStatus('ejecutiva','Formulario enviado')).toBe(true);expect(canUpdateStatus('ejecutiva','Visita realizada')).toBe(false)});
 it('limita los estados del supervisor',()=>{expect(canUpdateStatus('supervisor_empresa','Visita realizada')).toBe(true);expect(canUpdateStatus('supervisor_empresa','Contactado')).toBe(false)});
 it('impide cambios al cliente',()=>expect(canUpdateStatus('cliente','Contactado')).toBe(false));
 it('restringe empresas salvo al supervisor general',()=>{expect(canAccessCompany('cliente',['decal'],'ufitec')).toBe(false);expect(canAccessCompany('supervisor_general',[],'ufitec')).toBe(true)});
});
