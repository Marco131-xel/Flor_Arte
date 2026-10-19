import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.FLORARTE_TEST_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, headless: true });
const recibo = { id: 12, tipo: 'PEDIDO', idOrigen: 3, emitidoEn: '2026-10-12T10:00:00', emitidoPor: 'equipo@example.com',
  documento: { empresa: { nombre: 'FlorArte', direccion: 'Quetzaltenango', correo: 'empresa@example.com', telefono: '35847828' },
    persona: 'María López', direccion: null, telefono: null, correo: 'cliente@example.com', responsable: 'Equipo',
    fecha: '2026-10-12T09:00:00', estado: 'ENTREGADO', total: 20, lineas: [{ descripcion: 'Rosas rojas', cantidad: 2, precio: 10, subtotal: 20 }] } };
let passed = 0;
async function test(name, action, { email = true, role = 'EMPLEADO', mobile = false } = {}) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 } });
  await context.addInitScript(({ role }) => {
    localStorage.setItem('token', 'jwt-prueba'); localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify({ id: 2, nombre: 'Equipo' }));
  }, { role });
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  let send = async () => ({ status: 200, message: 'El comprobante PDF fue enviado al correo indicado.' });
  const c = structuredClone(recibo); if (!email) c.documento.correo = null;
  await context.route('**/*', async route => {
    const req = route.request(); if (!['fetch', 'xhr'].includes(req.resourceType())) return route.continue();
    const path = new URL(req.url()).pathname;
    let status = 200, data = {};
    if (path === '/gestion/avisos') data = [];
    else if (path === '/comprobante/pagina') data = { contenido: [{ ...c, persona: c.documento.persona, total: 20 }], pagina: 0, tamano: 10, totalElementos: 1, totalPaginas: 1 };
    else if (path === '/comprobante/12/correo') {
      requests.push(req.postDataJSON()); const result = await send(); status = result.status; data = { message: result.message };
    } else if (path === '/comprobante/12') data = c;
    await route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
  });
  try {
    await page.goto(`${base}/${role === 'ADMINISTRADOR' ? 'admin' : 'empleado'}/recibos`);
    await page.getByRole('button', { name: 'Ver comprobante 12', exact: true }).click();
    await page.getByRole('button', { name: 'Enviar por correo', exact: true }).click();
    await action({ page, requests, setSend: callback => { send = callback; } });
    assert.deepEqual(errors, []); passed++; console.log(`OK: ${name}`);
  } finally { await context.close(); }
}
try {
  await test('correo registrado precargado y envío confirmado', async ({ page, requests }) => {
    assert.equal(await page.getByLabel('Correo del cliente').inputValue(), 'cliente@example.com');
    await page.getByRole('button', { name: 'Enviar PDF', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'fue enviado' }).waitFor();
    assert.deepEqual(requests, [{ correo: 'cliente@example.com' }]);
  });
  await test('sin correo permite introducirlo y valida antes del envío', async ({ page, requests }) => {
    const input = page.getByLabel('Correo del cliente'); assert.equal(await input.inputValue(), '');
    await page.getByRole('button', { name: 'Enviar PDF', exact: true }).click(); assert.equal(requests.length, 0);
    await input.fill('correo-invalido'); await page.getByRole('button', { name: 'Enviar PDF', exact: true }).click(); assert.equal(requests.length, 0);
    await input.fill('nuevo@example.com'); await page.getByRole('button', { name: 'Enviar PDF', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'fue enviado' }).waitFor(); assert.deepEqual(requests, [{ correo: 'nuevo@example.com' }]);
  }, { email: false });
  await test('SMTP fallido muestra error y permite reintentar', async ({ page, requests, setSend }) => {
    setSend(async () => ({ status: 503, message: 'No se pudo enviar el correo. Intenta más tarde.' }));
    await page.getByRole('button', { name: 'Enviar PDF', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'No se pudo enviar' }).waitFor();
    setSend(async () => ({ status: 200, message: 'El comprobante PDF fue enviado al correo indicado.' }));
    await page.getByRole('button', { name: 'Enviar PDF', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'fue enviado' }).waitFor(); assert.equal(requests.length, 2);
  });
  await test('envío bloquea botones mientras procesa y funciona para administrador', async ({ page, setSend }) => {
    let resolve; setSend(() => new Promise(r => { resolve = r; }));
    await page.getByRole('button', { name: 'Enviar PDF', exact: true }).click();
    await page.getByRole('button', { name: 'Enviando…', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Cerrar ventana' }).isDisabled(), true);
    resolve({ status: 200, message: 'El comprobante PDF fue enviado al correo indicado.' });
    await page.getByRole('status').filter({ hasText: 'fue enviado' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Cerrar ventana' }).isDisabled(), false);
  }, { role: 'ADMINISTRADOR' });
  await test('formulario y botón visibles en celular', async ({ page }) => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.equal(await page.getByRole('button', { name: 'Enviar PDF', exact: true }).isVisible(), true);
    const rect = await page.getByLabel('Correo del cliente').boundingBox(); assert.ok(rect && rect.width > 180 && rect.x >= 0);
  }, { mobile: true });
  console.log(`${passed} pruebas de recibos por correo completadas.`);
} finally { await browser.close(); }
