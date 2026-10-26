import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.FLORARTE_TEST_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, headless: true });
let passed=0;
async function test(name, action, { role='ADMINISTRADOR', permitido=true, fallo=false, falloPdf=false }={}) {
 const context=await browser.newContext();
 await context.addInitScript(({role})=>{localStorage.setItem('token','jwt-prueba');localStorage.setItem('role',role);localStorage.setItem('user',JSON.stringify({id:2,nombre:'Equipo'}));},{role});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 let eliminado=false,deletes=0,descargas=0;
 const recibo={id:12,tipo:'PEDIDO',idOrigen:3,emitidoEn:new Date().toISOString(),emitidoPor:'equipo@example.com',puedeEliminar:permitido,editableHasta:new Date(Date.now()+(permitido?1800000:-1800000)).toISOString(),horaServidor:new Date().toISOString(),documento:{empresa:{nombre:'FlorArte',direccion:'Quetzaltenango',correo:'empresa@example.com',telefono:'35847828'},persona:'María López',fecha:'2026-10-12T09:00:00',estado:'ENTREGADO',total:20,lineas:[{descripcion:'Rosas rojas',cantidad:2,precio:10,subtotal:20}]}};
 await context.route('**/*',async route=>{
  const req=route.request();if(!['fetch','xhr'].includes(req.resourceType()))return route.continue();
  const path=new URL(req.url()).pathname;let status=200,data={};
  if(path==='/gestion/avisos')data=[];
  else if(path==='/comprobante/pagina')data={horaServidor:new Date().toISOString(),contenido:eliminado?[]:[{...recibo,persona:recibo.documento.persona,total:20}],pagina:0,tamano:10,totalElementos:eliminado?0:1,totalPaginas:eliminado?0:1};
  else if(path==='/comprobante/12/pdf'){descargas++;if(falloPdf)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'No se pudo generar el PDF. Intenta nuevamente.'})});return route.fulfill({status:200,contentType:'application/pdf',body:Buffer.from('%PDF-servidor-comun')});}
  else if(path==='/comprobante/12'&&req.method()==='DELETE'){deletes++;if(fallo){status=403;data={message:'El plazo para eliminar este comprobante terminó.'};}else {eliminado=true;return route.fulfill({status:204});}}
  else if(path==='/comprobante/12')data=recibo;
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 try{await page.goto(`${base}/${role==='ADMINISTRADOR'?'admin':'empleado'}/recibos`);await page.getByRole('button',{name:'Ver comprobante 12',exact:true}).waitFor();
 await action({page,counts:()=>({deletes,descargas,eliminado})});assert.deepEqual(errors,[]);passed++;console.log(`OK: ${name}`);
 }finally{await context.close();}
}
try {
 await test('administrador elimina con confirmación y refresca el historial',async({page,counts})=>{
  await page.getByRole('button',{name:'Eliminar comprobante 12',exact:true}).click();
  await page.getByRole('button',{name:'Confirmar eliminación',exact:true}).click();
  await page.getByText('No hay comprobantes para esta consulta').waitFor();assert.equal(counts().deletes,1);
 });
 await test('cancelar conserva el comprobante y la vista omite el estado',async({page,counts})=>{
  await page.getByRole('button',{name:'Ver comprobante 12',exact:true}).click();assert.equal(await page.getByText('Estado al emitir',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Eliminar comprobante',exact:true}).click();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();assert.equal(counts().deletes,0);
  assert.equal(await page.getByRole('button',{name:'Eliminar comprobante',exact:true}).isVisible(),true);
 });
 await test('empleado fuera de plazo tiene la eliminación deshabilitada',async({page})=>{
  assert.equal(await page.getByRole('button',{name:'Eliminar comprobante 12',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Ver comprobante 12',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Eliminar comprobante',exact:true}).isDisabled(),true);
 },{role:'EMPLEADO',permitido:false});
 await test('empleado reciente puede eliminar y un rechazo del servidor conserva el registro',async({page,counts})=>{
  assert.equal(await page.getByRole('button',{name:'Eliminar comprobante 12',exact:true}).isDisabled(),false);
  await page.getByRole('button',{name:'Eliminar comprobante 12',exact:true}).click();
  await page.getByRole('button',{name:'Confirmar eliminación',exact:true}).click();
  await page.getByRole('dialog').getByRole('alert').filter({hasText:'plazo'}).waitFor();assert.equal(counts().eliminado,false);
 },{role:'EMPLEADO',fallo:true});
 await test('descarga utiliza el PDF del servidor con el número correcto',async({page,counts})=>{
  const event=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar PDF 12',exact:true}).click();
  const download=await event;assert.equal(download.suggestedFilename(),'REC-000012.pdf');assert.equal(await download.failure(),null);assert.equal(counts().descargas,1);
 });
 await test('fallo de PDF muestra el mensaje del servidor',async({page})=>{
  await page.getByRole('button',{name:'Descargar PDF 12',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'No se pudo generar el PDF'}).waitFor();
 },{falloPdf:true});
 console.log(`${passed} pruebas de acciones de comprobantes completadas.`);
}finally {await browser.close();}
