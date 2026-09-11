import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { authenticateRequest, canAccessCompany, requireRoles } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types.js';
import { validateBody } from '../validation.js';
export const usersRouter=Router();
usersRouter.use(authenticateRequest);
usersRouter.get('/',requireRoles('supervisor_general','administradora','jefe_inspecciones'),async(request,response)=>{
 const companyId=z.string().min(1).safeParse(request.query.empresaId);
 if(!companyId.success)return response.status(400).json({error:'Debes indicar una empresa.'});
 const user=(request as AuthenticatedRequest).user;
 if(!canAccessCompany(user,companyId.data))return response.status(403).json({error:'Empresa fuera de tu alcance.'});
 const result=await pool.query(`SELECT u.id,u.name,u.email,u.role FROM users u JOIN user_companies uc ON uc.user_id=u.id WHERE uc.company_id=$1 AND u.active=true ORDER BY u.name`,[companyId.data]);
 response.json({users:result.rows.map((row)=>({...row,empresaIds:[companyId.data]}))});
});
const schema=z.object({id:z.string().optional(),name:z.string().min(2).max(120),email:z.string().email(),password:z.string().min(8).max(128),role:z.enum(['cliente','ejecutiva','supervisor_empresa','jefe_inspecciones','inspector']),empresaIds:z.array(z.string()).min(1)});
usersRouter.post('/',requireRoles('supervisor_general','administradora'),validateBody(schema),async(request,response)=>{
 const b=request.body,id=b.id||randomUUID(),hash=await bcrypt.hash(b.password,12),client=await pool.connect();
 try{await client.query('BEGIN');await client.query('INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',[id,b.name,b.email.toLowerCase(),hash,b.role]);for(const companyId of b.empresaIds)await client.query('INSERT INTO user_companies(user_id,company_id) VALUES($1,$2)',[id,companyId]);await client.query('COMMIT');response.status(201).json({user:{id,name:b.name,email:b.email.toLowerCase(),role:b.role,empresaIds:b.empresaIds}})}catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
});
