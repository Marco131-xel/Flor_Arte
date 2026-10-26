import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base=process.env.FLORARTE_TEST_URL||'http://127.0.0.1:5175';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,headless:true});
let passed=0;
const mensajes={credenciales:'Correo o contraseña incorrectos. Revisa tus datos e intenta de nuevo.',conexion:'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente.'};
async function test(name,action){const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{await action(page,context);assert.deepEqual(errors,[]);passed++;console.log(`OK: ${name}`);}finally{await context.close();}}
async function login(page){await page.goto(`${base}/login`);await page.locator('#email').fill('empleado@example.com');await page.locator('#password').fill('Password-incorrecto');await page.getByRole('button',{name:/Entrar/}).click();}
try{
 for(const [nombre,status,data,esperado] of [
  ['contraseña incorrecta con mensaje técnico',401,{message:'Bad credentials'},mensajes.credenciales],
  ['correo desconocido',401,{message:'Usuario no encontrado empleado@example.com'},mensajes.credenciales],
  ['error Bad Request',400,{error:'Bad Request'},'Revisa el correo y la contraseña ingresados antes de continuar.'],
  ['contraseña incorrecta con estado 400',400,{message:'Bad credentials'},mensajes.credenciales],
  ['correo inválido',400,{errors:{correo:'must be a well-formed email address'}},'Ingresa un correo electrónico válido.'],
  ['cuenta sin acceso',403,{error:'Forbidden'},'Tu cuenta está inactiva o no tiene acceso. Contacta al administrador.'],
  ['límite de intentos',429,{message:'Too many requests'},'Has realizado demasiados intentos. Espera unos minutos antes de volver a iniciar sesión.'],
  ['servidor no disponible',500,{message:'Internal server error'},'El servicio de inicio de sesión no está disponible en este momento. Intenta más tarde.'],
  ['fallo al enviar código',503,{error:'CORREO_NO_DISPONIBLE'},'No se pudo enviar el código de verificación. Intenta más tarde o contacta al administrador.']
 ])await test(nombre,async(page,context)=>{
  await context.route('**/auth/login',route=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)}));await login(page);
  await page.getByRole('alert').filter({hasText:esperado}).waitFor();assert.equal(await page.locator('#password').inputValue(),'');assert.equal(await page.evaluate(()=>localStorage.getItem('token')),null);assert.ok(new URL(page.url()).pathname==='/login');
 });
 await test('sin conexión',async(page,context)=>{await context.route('**/auth/login',route=>route.abort('connectionfailed'));await login(page);await page.getByRole('alert').filter({hasText:mensajes.conexion}).waitFor();});
 await test('enlace de recuperación tiene el color de FlorArte',async page=>{await page.goto(`${base}/login`);const link=page.getByRole('link',{name:'¿Olvidaste tu contraseña?'});assert.equal(await link.evaluate(el=>getComputedStyle(el).color),'rgb(118, 83, 38)');await link.click();await page.waitForURL('**/recuperar-contrasena');});
 for(const activar of [true,false])await test(`${activar?'activar':'desactivar'} con confirmación de FlorArte`,async(page,context)=>{
  await context.addInitScript(()=>{localStorage.setItem('token','jwt-prueba');localStorage.setItem('role','ADMINISTRADOR');localStorage.setItem('user',JSON.stringify({id:2,nombre:'Equipo'}));});
  let guardados=0,nativos=0;page.on('dialog',async dialog=>{nativos++;await dialog.dismiss();});
  await context.route('**/*',async route=>{const req=route.request();if(!['fetch','xhr'].includes(req.resourceType()))return route.continue();const path=new URL(req.url()).pathname;let data={};
   if(path==='/gestion/avisos')data=[];
   else if(path==='/user/5'&&req.method()==='GET')data={idUsuario:5,idPersona:5,email:'empleado@example.com',estado:!activar,rol:'EMPLEADO',persona:{nombre:'Empleado prueba',rol:{tipo:'EMPLEADO'}}};
   else if(path==='/user/update/5'){guardados++;assert.equal(req.postDataJSON().estado,activar);data={message:'Usuario actualizado'};}
   else if(path.startsWith('/gestion/'))data={contenido:[],pagina:0,tamano:10,totalElementos:0,totalPaginas:0,resumen:{registros:0,importe:0,unidades:0},horaServidor:new Date().toISOString()};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await page.goto(`${base}/admin/usuarios/editar/5`);await page.locator('#estado').selectOption(activar?'activo':'inactivo');await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
  const modal=page.getByRole('dialog');await modal.getByRole('heading',{name:activar?'Activar cuenta':'Desactivar cuenta',exact:true}).waitFor();assert.equal(guardados,0);assert.equal(nativos,0);
  await modal.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(guardados,0);
  await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:activar?'Confirmar activación':'Confirmar desactivación',exact:true}).click();await page.waitForURL('**/admin/usuarios?seccion=usuarios');assert.equal(guardados,1);assert.equal(nativos,0);
 });
 console.log(`${passed} pruebas de mensajes, enlace y confirmaciones completadas.`);
}finally{await browser.close();}
