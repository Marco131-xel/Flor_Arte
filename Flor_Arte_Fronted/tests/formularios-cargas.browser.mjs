import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// API simulada: sin PostgreSQL, correos ni modificaciones de datos reales.
const base = process.env.FLORARTE_TEST_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
});
const flor = { idFlor: 10, idTipoFlor: 1, nombreTipoFlor: 'Rosa', idColor: 1, nombreColor: 'Rojo', precio: 10, stock: 100, estado: true };
const persona = { idPersona: 2, nombre: 'Equipo de prueba', telefono: null, dpi: null, correo: null, idRol: 1, tipoRol: 'ADMINISTRADOR', rol: { idRol: 1, tipo: 'ADMINISTRADOR' } };
const usuario = { idUsuario: 2, idPersona: 2, name: 'equipo', email: 'equipo@example.test', estado: true, persona };
const pedido = id => ({ idPedido: id, idCliente: 3, idEmpleado: 2, estado: 'PENDIENTE', fecha: '2026-10-24T10:00:00', total: 20, detalles: [{ idDetallePedido: id, idFlor: 10, nombreFlor: 'Rosa Rojo', cantidad: 2, precio: 10, subtotal: 20 }] });
let passed = 0;
async function test(name, action, options = {}) {
  const context = await browser.newContext();
  await context.addInitScript(sesion => {
    localStorage.setItem('token', 'jwt-simulado');
    localStorage.setItem('role', 'ADMINISTRADOR');
    localStorage.setItem('user', JSON.stringify(sesion));
  }, options.sinUsuario ? {} : { id: 2 });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(15000);
  console.log(`INICIO: ${name}`);
  const errors = [], gets = new Map(), writes = [];
  let colores = [{ idColor: 1, nombre: 'Rojo' }];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/*', async route => {
    const req = route.request();
    if (!['fetch', 'xhr'].includes(req.resourceType())) return route.continue();
    const path = new URL(req.url()).pathname;
    if (req.method() === 'GET') gets.set(path, (gets.get(path) || 0) + 1);
    else writes.push({ method: req.method(), path, body: req.postDataJSON() });
    if (options.intercept && await options.intercept(route, path)) return;
    let data = {}, status = 200;
    if (options.errorCarga === path) { status = 500; data = { message: 'Carga rechazada de prueba' }; }
    else if (req.method() !== 'GET') {
      if (options.errorGuardar) { status = 400; data = { error: 'Bad Request', message: options.errorGuardar }; }
      else if (path === '/color/create') { colores = [...colores, { idColor: 2, ...req.postDataJSON() }]; data = { message: 'Color creado' }; }
      else if (path.startsWith('/color/update/')) { colores = colores.map(c => c.idColor === 2 ? { ...c, ...req.postDataJSON() } : c); data = { message: 'Color actualizado' }; }
      else data = { message: 'Guardado', pedido: pedido(10) };
    } else if (path === '/gestion/avisos') data = [];
    else if (path.startsWith('/gestion/')) data = { contenido: [], pagina: 0, tamano: 10, totalElementos: 0, totalPaginas: 0, resumen: { registros: 0, importe: 0, unidades: 0 }, horaServidor: new Date().toISOString() };
    else if (path === '/color/all') data = colores;
    else if (path === '/tipoflor/all') data = [{ idTipoFlor: 1, nombre: 'Rosa', descripcion: null, imagenUrl: null }];
    else if (path === '/flor/all') data = [flor];
    else if (path.startsWith('/flor/')) data = { ...flor, idFlor: Number(path.split('/').at(-1)), precio: path.endsWith('/20') ? 20 : 10 };
    else if (path === '/persona/all') data = [{ ...persona, idPersona: 3, nombre: 'Cliente de prueba', idRol: 3, tipoRol: 'CLIENTE' }];
    else if (path === '/user/2') data = usuario;
    else if (path === '/user/all') data = [];
    else if (path.startsWith('/pedido/show/')) data = pedido(Number(path.split('/').at(-1)));
    else if (path === '/auth/2fa/configuracion') data = { habilitado: false };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) });
  });
  try {
    await action(page, { gets, writes });
    assert.deepEqual(errors, []);
    passed++;
    console.log(`OK: ${name}`);
  } finally { await context.close(); }
}
async function sinRecargas(page, gets, action) {
  const anteriores = new Map(gets);
  await action();
  // Observar tras interacción: detecta efectos que vuelven a pedir catálogos al editar.
  await page.waitForTimeout(350);
  assert.deepEqual(gets, anteriores, 'Editar campos no debe volver a cargar los datos');
  for (const cantidad of gets.values()) assert.ok(cantidad <= 2, 'Carga inicial acotada, incluyendo StrictMode');
}
async function cambiarRuta(page, path) {
  await page.evaluate(path => { history.pushState(null, '', path); dispatchEvent(new PopStateEvent('popstate')); }, path);
}
try {
  await test('crear flor conserva selectores, números, payload y regreso sin recargas', async (page, { gets, writes }) => {
    await page.goto(`${base}/admin/flores/create`);
    await page.getByRole('button', { name: 'Selecciona un tipo' }).click();
    await page.locator('.crear-flor-combo-item').filter({ hasText: 'Rosa' }).click();
    await page.getByRole('button', { name: 'Selecciona un color' }).click();
    await page.locator('.crear-flor-combo-item').filter({ hasText: 'Rojo' }).click();
    await sinRecargas(page, gets, async () => { await page.locator('#precio').fill('15'); await page.locator('#stock').fill('12'); });
    await page.getByRole('button', { name: 'Guardar Flor', exact: true }).click();
    await page.waitForURL('**/admin/flores');
    assert.deepEqual(writes, [{ method: 'POST', path: '/flor/create', body: { idTipoFlor: 1, idColor: 1, precio: 15, stock: 12 } }]);
  });
  await test('editar flor carga valores y conserva payload y regreso sin recargas', async (page, { gets, writes }) => {
    await page.goto(`${base}/admin/flores/update/10`);
    await page.locator('#precio').waitFor();
    assert.equal(await page.locator('#precio').inputValue(), '10');
    await sinRecargas(page, gets, async () => { await page.locator('#precio').fill('18'); });
    await page.getByRole('button', { name: 'Guardar Cambios', exact: true }).click();
    await page.waitForURL('**/admin/flores');
    assert.deepEqual(writes[0], { method: 'PUT', path: '/flor/update/10', body: { idTipoFlor: 1, idColor: 1, precio: 18, stock: 100 } });
  });
  await test('colores carga inicialmente y refresca después de crear y editar', async (page, { gets, writes }) => {
    await page.goto(`${base}/admin/flores/color`);
    await page.getByRole('button', { name: '+ Crear Color', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Azul QA');
    const iniciales = gets.get('/color/all');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await page.locator('.color-card-nombre').filter({ hasText: /^Azul QA$/ }).waitFor();
    assert.equal(gets.get('/color/all'), iniciales + 1);
    const fila = page.locator('.color-card').filter({ hasText: 'Azul QA' });
    await fila.getByTitle('Editar', { exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Azul editado');
    await page.getByRole('button', { name: 'Guardar Cambios', exact: true }).click();
    await page.locator('.color-card-nombre').filter({ hasText: /^Azul editado$/ }).waitFor();
    assert.equal(gets.get('/color/all'), iniciales + 2);
    assert.equal(writes.length, 2);
  });
  await test('editar pedido conserva detalles, total, endpoint y regreso sin recargas', async (page, { gets, writes }) => {
    await page.goto(`${base}/admin/pedidos/update/10`);
    await page.getByRole('heading', { name: 'Editar pedido #10' }).waitFor();
    await sinRecargas(page, gets, async () => { await page.getByLabel('Cantidad de Rosa Rojo', { exact: true }).fill('3'); });
    await page.getByRole('button', { name: /Guardar cambios/i }).click();
    await page.waitForURL('**/admin/pedidos');
    assert.equal(writes[0].path, '/pedido/update-completo/10');
    assert.equal(writes[0].body.detalles[0].cantidad, 3);
    assert.equal(writes[0].body.idCliente, 3);
  });
  await test('pedido inválido muestra error sin solicitar una ruta NaN', async (page, { gets }) => {
    await page.goto(`${base}/admin/pedidos/update/invalido`);
    await page.getByRole('alert').filter({ hasText: 'Pedido no válido.' }).waitFor();
    assert.equal([...gets.keys()].some(path => path.startsWith('/pedido/')), false);
  });
  for (const modulo of ['flores', 'pedidos']) {
    let liberar, aviso;
    const pendiente = new Promise(resolve => { liberar = resolve; });
    const recibida = new Promise(resolve => { aviso = resolve; });
    const rutaVieja = modulo === 'flores' ? '/flor/10' : '/pedido/show/10';
    await test(`${modulo}: una respuesta anterior no sobrescribe el registro de la ruta nueva`, async (page) => {
      await page.goto(`${base}/admin/${modulo}/update/10`);
      await recibida;
      await cambiarRuta(page, `/admin/${modulo}/update/20`);
      if (modulo === 'flores') {
        await page.locator('#precio').waitFor();
        assert.equal(await page.locator('#precio').inputValue(), '20');
      } else await page.getByRole('heading', { name: 'Editar pedido #20' }).waitFor();
      liberar();
      await page.waitForTimeout(350);
      if (modulo === 'flores') assert.equal(await page.locator('#precio').inputValue(), '20');
      else assert.equal(await page.getByRole('heading', { name: 'Editar pedido #20' }).count(), 1);
    }, { intercept: async (route, path) => {
      if (path !== rutaVieja) return false;
      aviso(); await pendiente;
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(modulo === 'flores' ? flor : pedido(10)) });
      return true;
    } });
  }
  await test('perfil sin identificador muestra error sin consultar un usuario indefinido', async (page, { gets }) => {
    await page.goto(`${base}/admin/perfil/editar`);
    await page.getByText('No se pudo identificar al usuario', { exact: true }).waitFor();
    assert.equal([...gets.keys()].some(path => path.startsWith('/user/')), false);
  }, { sinUsuario: true });
  await test('perfil conserva mensaje de error del servidor y limpia error DPI al editar', async (page, { gets }) => {
    await page.goto(`${base}/admin/perfil/editar`);
    await page.locator('#nombre').waitFor();
    await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
    await page.locator('.cp-field-error').filter({ hasText: 'El DPI ya está en uso' }).waitFor();
    await sinRecargas(page, gets, async () => { await page.locator('#dpi').fill('1234'); });
    assert.equal(await page.locator('.cp-field-error').count(), 0);
  }, { errorGuardar: 'El DPI ya está en uso' });
  await test('fallo de catálogo floral conserva mensaje y finaliza carga', async page => {
    await page.goto(`${base}/admin/flores/create`);
    await page.getByText('No se pudieron cargar los colores y tipos de flor.', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Selecciona un tipo' }).isEnabled(), true);
  }, { errorCarga: '/color/all' });
  console.log(`${passed} pruebas de cargas y formularios completadas.`);
} finally { await browser.close(); }
