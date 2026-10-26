import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.env.FLORARTE_TEST_URL||'http://127.0.0.1:5175';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true});
const persona={idPersona:5,nombre:'Empleado prueba',correo:'empleado@example.com',telefono:'12345678',dpi:null,idRol:2,tipoRol:'EMPLEADO',rol:{idRol:2,tipo:'EMPLEADO'}};
const usuario={idUsuario:5,idPersona:5,name:'empleado',email:'empleado@example.com',estado:true,rol:'EMPLEADO',persona};
const flor={idFlor:10,idTipoFlor:1,nombreTipoFlor:'Rosa',idColor:1,nombreColor:'Roja',precio:10,stock:100,estado:true};
const pagina={contenido:[],pagina:0,tamano:10,totalElementos:0,totalPaginas:0,resumen:{registros:0,importe:0,unidades:0},horaServidor:new Date().toISOString()};
let passed=0;
async function test(name,action,{role='ADMINISTRADOR',fallo=false}={}){
 const context=await browser.newContext();await context.addInitScript(role=>{localStorage.setItem('token','jwt-prueba');localStorage.setItem('role',role);localStorage.setItem('user',JSON.stringify({id:2,nombre:'Equipo'}));},role);
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',error=>errors.push(error.message));
 await context.route('**/*',async route=>{
  const req=route.request();if(!['fetch','xhr'].includes(req.resourceType()))return route.continue();
  const path=new URL(req.url()).pathname;let data={},status=200;
  if(req.method()!=='GET'){
   requests.push({path,body:req.postData()?req.postDataJSON():null});
   if(path.startsWith('/auth/recuperacion/empleado/'))data={message:'Solicitud procesada. El empleado recibirá un enlace de recuperación en su correo registrado; tendrá una vigencia de 15 minutos.'};
   else if(path==='/comprobante')data={id:12,tipo:'PEDIDO',idOrigen:10,emitidoEn:new Date().toISOString(),documento:{}};
   else if(fallo){status=400;data={message:'No se pudo guardar. Revisa los datos.'};}
   else data=usuario;
  }else if(path==='/comprobante/pagina')data={contenido:[],pagina:0,tamano:10,totalElementos:0,totalPaginas:0};
  else if(path==='/gestion/pedidos/pagina'&&page.url().endsWith('/recibos'))data={...pagina,contenido:[{id:10,nombre:'Cliente prueba',estado:'PENDIENTE',total:10,fecha:'2026-10-19T10:00:00'}],totalElementos:1,totalPaginas:1};
  else if(path==='/gestion/avisos')data=[];
  else if(path.startsWith('/gestion/'))data=path.endsWith('/permiso')?{puedeEditar:true,editableHasta:new Date(Date.now()+1800000).toISOString(),horaServidor:new Date().toISOString()}:pagina;
  else if(path==='/persona/all')data=[persona];
  else if(path==='/user/all')data=[];
  else if(path==='/user/5')data=usuario;
  else if(path==='/user/2')data={...usuario,idUsuario:2,idPersona:2,persona:{...persona,idPersona:2,idRol:1,rol:{idRol:1,tipo:'ADMINISTRADOR'}}};
  else if(path==='/persona/5')data=persona;
  else if(path==='/flor/all')data=[flor];
  else if(path==='/movimiento_inventario/costo/10')data={costoUnitario:5};
  else if(path==='/movimiento_inventario/show/5')data={idMovimientoInventario:5,idFlor:10,tipoMovimiento:'SALIDA',motivo:'MERMA',cantidad:1,costoUnitario:5};
  else if(path==='/auth/2fa/configuracion')data={habilitado:false};
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 try{await action(page,requests);assert.deepEqual(errors,[]);passed++;console.log(`OK: ${name}`);}finally{await context.close();}
}
try{
 await test('crear usuario regresa a la pestaña Usuarios',async(page,requests)=>{
  await page.goto(`${base}/admin/usuarios/crear`);await page.locator('#idPersona').selectOption('5');await page.locator('#name').fill('empleado_nuevo');await page.locator('#password').fill('Password-prueba-1');
  await page.getByRole('button',{name:'Crear usuario',exact:true}).click();await page.waitForURL('**/admin/usuarios?seccion=usuarios');
  assert.equal(await page.getByRole('button',{name:/Usuarios del sistema/}).getAttribute('aria-pressed'),'true');assert.equal(requests.filter(r=>r.path==='/user/create').length,1);
 });
 await test('editar usuario regresa al listado y no al inicio',async(page)=>{
  await page.goto(`${base}/admin/usuarios/editar/5`);await page.locator('#email').fill('nuevo@example.com');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.waitForURL('**/admin/usuarios?seccion=usuarios');
 });
 for(const editar of [false,true])await test(`${editar?'editar':'crear'} persona de administrador regresa a Personas`,async(page)=>{
  await page.goto(`${base}/admin/usuarios/${editar?'editar-Persona/5':'crear-Persona'}`);await page.locator('#persona-nombre').fill('Cliente prueba');await page.locator('#persona-rol').selectOption('3');await page.getByRole('button',{name:'Guardar',exact:true}).click();await page.waitForURL('**/admin/usuarios?seccion=personas');
 });
 await test('editar perfil regresa al perfil',async(page)=>{
  await page.goto(`${base}/admin/perfil/editar`);await page.locator('#nombre').fill('Nombre actualizado');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.waitForURL('**/admin/perfil');
 });
 for(const role of ['ADMINISTRADOR','EMPLEADO']){
  const panel=role==='ADMINISTRADOR'?'admin':'empleado';
  await test(`crear merma regresa a Mermas (${role})`,async(page)=>{
   await page.goto(`${base}/${panel}/inventario/merma`);await page.locator('#flor').click();await page.getByRole('option').filter({hasText:'Rosa'}).click();await page.locator('#cantidad').fill('2');await page.locator('#merma-costo').fill('5');
   await page.getByRole('button',{name:/Registrar merma/}).click();await page.waitForURL(`**/${panel}/inventario?seccion=mermas`);assert.equal(await page.getByRole('button',{name:/Mermas/}).getAttribute('aria-pressed'),'true');
  },{role});
  await test(`editar merma regresa a Mermas (${role})`,async(page)=>{
   await page.goto(`${base}/${panel}/inventario/merma/editar/5`);await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.waitForURL(`**/${panel}/inventario?seccion=mermas`);
  },{role});
 }
 await test('guardar fallido conserva el formulario y sus datos',async(page)=>{
  await page.goto(`${base}/admin/usuarios/editar/5`);await page.locator('#email').fill('nuevo@example.com');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByRole('alert').waitFor();assert.ok(page.url().endsWith('/usuarios/editar/5'));assert.equal(await page.locator('#email').inputValue(),'nuevo@example.com');
 },{fallo:true});
 await test('solicitud administrativa usa el usuario registrado y bloquea cambios pendientes',async(page,requests)=>{
  await page.goto(`${base}/admin/usuarios/editar/5`);const boton=page.getByRole('button',{name:/Enviar cambio de contraseña/});await boton.waitFor();
  await page.locator('#email').fill('sin-guardar@example.com');assert.equal(await boton.isDisabled(),true);await page.locator('#email').fill(usuario.email);await boton.click();await page.getByRole('status').filter({hasText:'Solicitud procesada'}).waitFor();
  assert.equal(requests.filter(r=>r.path==='/auth/recuperacion/empleado/5').length,1);assert.equal(requests.some(r=>r.body?.correo==='sin-guardar@example.com'),false);
 });
 await test('generar comprobante cierra el formulario y regresa al historial',async(page,requests)=>{
  await page.goto(`${base}/admin/recibos`);await page.getByRole('button',{name:'Generar comprobante',exact:true}).click();
  await page.getByRole('button').filter({hasText:'#10 · Cliente prueba'}).click();await page.getByRole('button',{name:'Emitir comprobante',exact:true}).click();
  await page.getByRole('status').filter({hasText:'Comprobante REC-000012 generado correctamente.'}).waitFor();assert.equal(await page.getByRole('dialog').count(),0);assert.equal(requests.filter(r=>r.path==='/comprobante').length,1);
 });
 console.log(`${passed} pruebas de formularios y recuperación administrativa completadas.`);
}finally{await browser.close();}
