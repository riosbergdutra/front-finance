import { test, expect } from '@playwright/test';

test.describe('Navegação pública', () => {
  test('home → login via navbar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-outline', { hasText: 'Entrar' }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('home → login via botão hero', async ({ page }) => {
    await page.goto('/');
    // Sem autenticação, validamos que o CTA está disponível sem iniciar o fluxo externo do Keycloak.
    await expect(page.locator('.btn-hero-primary')).toBeEnabled();
  });

  test('rotas /app/* protegidas sem sessão', async ({ page }) => {
    const routes = [
      '/app/dashboard',
      '/app/accounts',
      '/app/transactions',
      '/app/budgets',
      '/app/goals',
      '/app/notifications',
      '/app/subscription',
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page).toHaveURL('/login', { timeout: 5000 });
    }
  });

  test('rota inválida vai para home', async ({ page }) => {
    await page.goto('/rota-que-nao-existe');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Login page', () => {
  test('exibe features de segurança', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.feature')).toHaveCount(3);
  });

  test('exibe nota de rodapé', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.footer-note')).toBeVisible();
  });
});
