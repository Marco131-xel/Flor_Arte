import assert from 'node:assert/strict';
import { rutaRegresoFormulario } from '../src/utils/regresoFormulario.ts';
let count=0;
for(const role of ['admin','empleado']){
 for(const modulo of (role==='admin'?['flores','pedidos','inventario','arreglos','arreglos/pedidos','eventos']:['flores','pedidos','inventario','arreglos','arreglos/pedidos','eventos','personas'])){
  for(const form of ['create','update/7']){
   const ruta=`/${role}/${modulo}/${form}`;
   assert.equal(rutaRegresoFormulario(ruta),`/${role}/${modulo}`);count++;
  }
 }
 for(const form of ['merma','merma/editar/7']){assert.equal(rutaRegresoFormulario(`/${role}/inventario/${form}`),`/${role}/inventario?seccion=mermas`);count++;}
 for(const form of ['color','tipoflor']){assert.equal(rutaRegresoFormulario(`/${role}/flores/${form}`),`/${role}/flores`);count++;}
}
for(const form of ['crear','editar/7']){assert.equal(rutaRegresoFormulario(`/admin/usuarios/${form}`),'/admin/usuarios?seccion=usuarios');count++;}
for(const form of ['crear-Persona','editar-Persona/7']){assert.equal(rutaRegresoFormulario(`/admin/usuarios/${form}`),'/admin/usuarios?seccion=personas');count++;}
assert.equal(rutaRegresoFormulario('/admin/perfil/editar'),'/admin/perfil');count++;
console.log(`${count} rutas de formularios regresan a su módulo y pestaña.`);
