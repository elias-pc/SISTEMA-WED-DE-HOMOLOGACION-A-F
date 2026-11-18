import { describe,expect,it } from 'vitest';
import { canAccessCompany,canApplyTransition,canUpdateStatus } from './authorization.js';
describe('autorización por roles',()=>{
 it('limita los estados de la ejecutiva',()=>{expect(canUpdateStatus('ejecutiva','Formulario enviado')).toBe(true);expect(canUpdateStatus('ejecutiva','Visita realizada')).toBe(false)});
 it('limita los estados del inspector',()=>{expect(canUpdateStatus('inspector','Visita realizada')).toBe(true);expect(canUpdateStatus('inspector','Contactado')).toBe(false)});
 it('impide cambios al cliente',()=>expect(canUpdateStatus('cliente','Contactado')).toBe(false));
 it('restringe empresas salvo al administrador',()=>{expect(canAccessCompany('cliente',['decal'],'ufitec')).toBe(false);expect(canAccessCompany('administradora',[],'ufitec')).toBe(true)});
 it('autoriza transiciones según el paso y el rol',()=>{
  const state={step:6,status:'INSCRITO',substatus:'FORMULARIO_DEVUELTO'} as const;
  expect(canApplyTransition('jefe_inspecciones',state,'ASIGNAR_INSPECTOR')).toBe(true);
  expect(canApplyTransition('ejecutiva',state,'ASIGNAR_INSPECTOR')).toBe(false);
 });
});
