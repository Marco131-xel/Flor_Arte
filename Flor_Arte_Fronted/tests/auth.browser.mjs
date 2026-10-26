import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// API simulada: estas pruebas no necesitan PostgreSQL ni envían correos.
const base = process.env.FLORARTE_TEST_URL || 'http://127.0.0.1:5175';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined,
  headless: true,
});
let passed = 0;
async function test(name, action) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try { await action(page, context); assert.deepEqual(errors, []); passed++; console.log(`OK: ${name}`); }
  finally { await context.close(); }
}
const sesion = { requires2fa: false, token: 'jwt-definitivo-simulado', nombre: 'Equipo FlorArte',
  tipoUsuario: 'EMPLEADO', id_usuario: 21, estado: true, message: 'Inicio de sesión exitoso' };
const desafio = { requires2fa: true, challengeId: '8a90e38d-a3c6-45de-b4cb-974538797e48',
  expiresInSeconds: 300, resendAfterSeconds: 60, message: 'Enviamos un código al correo registrado.' };
const generic = { message: 'Si el correo corresponde a una cuenta activa, recibirás un enlace para restablecer la contraseña.' };
async function intercept(context, handler) {
  await context.route('**/*', async route => {
    const req = route.request();
    const url = new URL(req.url());
    if (req.resourceType() !== 'xhr' && req.resourceType() !== 'fetch') return route.continue();
    let body = {}; try { body = req.postDataJSON() || {}; } catch { /* GET */ }
    const response = await handler(url.pathname, body, req) ?? (url.pathname === "/gestion/avisos" ? { data: [] } : undefined);
    await route.fulfill({ status: response?.status || 200, contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(response?.data || {}) });
  });
}
async function credentials(page) {
  await page.goto(`${base}/login`);
  await page.getByLabel('Correo', { exact: true }).fill('equipo@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Password-prueba-1');
  await page.getByRole('button', { name: /Entrar/ }).click();
}
try {
  await test('2FA no guarda sesión antes del código y conserva el rol final', async (page, context) => {
    let attempt = 0;
    await intercept(context, async path => path === '/auth/login' ? { data: desafio } :
      path === '/auth/2fa/verificar' ? (++attempt === 1
        ? { status: 401, data: { error: 'CODIGO_INCORRECTO', message: 'El código es incorrecto. Te quedan 4 intentos.' } }
        : { data: sesion }) : undefined);
    await credentials(page);
    await page.getByLabel('Código de seis dígitos').waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
    assert.equal(await page.getByRole('button', { name: /Reenviar en/ }).isDisabled(), true);
    await page.getByLabel('Código de seis dígitos').fill('000000');
    await page.getByRole('button', { name: 'Verificar código' }).click();
    await page.getByRole('alert').filter({ hasText: 'incorrecto' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
    await page.getByLabel('Código de seis dígitos').fill('123456');
    await page.getByRole('button', { name: 'Verificar código' }).click();
    await page.waitForURL('**/empleado');
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), sesion.token);
    assert.equal(await page.evaluate(() => localStorage.getItem('role')), 'EMPLEADO');
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('123456')), false);
  });
  await test('login sin 2FA mantiene compatibilidad', async (page, context) => {
    await intercept(context, async path => path === '/auth/login' ? { data: sesion } : undefined);
    await credentials(page); await page.waitForURL('**/empleado');
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), sesion.token);
  });
  await test('caducidad y reenvío con espera', async (page, context) => {
    await intercept(context, async path => path === '/auth/login'
      ? { data: { ...desafio, expiresInSeconds: 1, resendAfterSeconds: 1 } }
      : path === '/auth/2fa/reenviar' ? { data: desafio } : undefined);
    await credentials(page); await page.getByText(/El código ha vencido/).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Verificar código' }).isDisabled(), true);
    await page.getByRole('button', { name: 'Reenviar código', exact: true }).click();
    await page.getByText('Enviamos un nuevo código. El anterior ya no es válido.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Verificar código' }).isDisabled(), false);
  });
  await test('recuperación muestra la respuesta genérica', async (page, context) => {
    await intercept(context, async path => path === '/auth/recuperacion/solicitar' ? { data: generic } : undefined);
    await page.goto(`${base}/login`);
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await page.getByLabel('Correo electrónico').fill('cuenta@example.com');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await page.getByRole('status').filter({ hasText: generic.message }).waitFor();
  });
  await test('token solo en memoria; sin referer ni recursos externos; contraseña confirmada', async (page, context) => {
    const token = 'A'.repeat(43); const external = []; let submissions = 0;
    page.on('request', req => { if (!req.url().startsWith(base)) external.push(req.url());
      assert.equal((req.headers().referer || '').includes(token), false); });
    await intercept(context, async (path, body) => {
      if (path === '/auth/recuperacion/restablecer') {
        submissions++; assert.equal(body.token, token);
        assert.equal(body.contrasena, 'Nueva-password-2');
        return { data: { message: 'Tu contraseña fue actualizada. Inicia sesión nuevamente.' } };
      }
    });
    await page.goto(`${base}/restablecer-contrasena#token=${token}`);
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('Nueva-password-2');
    assert.equal(new URL(page.url()).hash, '');
    assert.equal(await page.evaluate(() => window.__florArteResetToken), undefined);
    assert.deepEqual(external, []);
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('A'.repeat(43))), false);
    await page.getByLabel('Confirmar contraseña').fill('Diferente-password');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await page.getByRole('alert').filter({ hasText: 'no coinciden' }).waitFor(); assert.equal(submissions, 0);
    await page.getByLabel('Confirmar contraseña').fill('Nueva-password-2');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await page.getByRole('status').filter({ hasText: 'actualizada' }).waitFor(); assert.equal(submissions, 1);
    assert.equal(await page.evaluate(() => JSON.stringify(localStorage).includes('Nueva-password-2')), false);
  });
  await test('enlace vencido y enlace ausente muestran opciones de recuperación', async (page, context) => {
    await intercept(context, async path => path === '/auth/recuperacion/restablecer'
      ? { status: 400, data: { message: 'El enlace es inválido, expiró o ya fue utilizado. Solicita uno nuevo.' } } : undefined);
    await page.goto(`${base}/restablecer-contrasena#token=${'B'.repeat(43)}`);
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('Nueva-password-2');
    await page.getByLabel('Confirmar contraseña').fill('Nueva-password-2');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await page.getByRole('alert').filter({ hasText: 'expiró' }).waitFor();
    await page.goto(`${base}/restablecer-contrasena`);
    await page.getByRole('alert').filter({ hasText: 'no es válido' }).waitFor();
  });
  await test('perfil configura 2FA con contraseña y código, renovando la sesión', async (page, context) => {
    await context.addInitScript(() => { localStorage.setItem('token', 'jwt-previo'); localStorage.setItem('role', 'EMPLEADO');
      localStorage.setItem('user', JSON.stringify({ id: 21, nombre: 'Equipo', email: 'equipo@example.com' })); });
    await intercept(context, async path => path === '/user/21'
      ? { data: { name: 'Equipo', email: 'equipo@example.com', estado: true,
        persona: { nombre: 'Equipo FlorArte', rol: { tipo: 'EMPLEADO' } } } }
      : path === '/auth/2fa/configuracion' ? { data: { habilitado: false } }
      : path === '/auth/2fa/configuracion/iniciar' ? { data: desafio }
      : path === '/auth/2fa/configuracion/verificar' ? { data: sesion } : undefined);
    await page.goto(`${base}/empleado/perfil`);
    await page.getByLabel('Confirma tu contraseña actual').fill('Password-prueba-1');
    await page.getByRole('button', { name: 'Activar 2FA' }).click();
    await page.getByLabel('Código de seis dígitos').fill('123456');
    await page.getByRole('button', { name: 'Verificar código' }).click();
    await page.getByRole('status').filter({ hasText: 'Configuración actualizada' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), sesion.token);
    await page.getByRole('button', { name: 'Desactivar 2FA' }).waitFor();
  });
  await test('recuperación se adapta al celular', async (page) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/recuperar-contrasena`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    assert.equal(await page.getByRole('button', { name: 'Enviar enlace' }).isVisible(), true);
  });
  console.log(`${passed} pruebas de navegador completadas.`);
} finally { await browser.close(); }
