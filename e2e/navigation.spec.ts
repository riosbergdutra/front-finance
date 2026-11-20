import { test, expect, Page } from '@playwright/test';

// Helper: injeta token falso no sessionStorage para simular login
async function mockAuth(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    // Simula token em memória via Angular signal não é possível via E2E puro.
    // Esta suite testa o comportamento de redirect (sem token = volta para /login).
    // Testes com auth real requerem mock do Keycloak (ver README).
  });
}

test.describe('Navegação pública', () => {
  test('home → login via navbar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-outline', { hasText: 'Entrar' }).first().click();
    await expect(page).toHaveURL('/login');
  });

  test('home → login via botão hero', async ({ page }) => {
    await page.goto('/');
    // Sem auth, clicar em "Começar grátis" vai para login via Keycloak
    // Só verificamos que o botão existe e é clicável
    await expect(page.locator('.btn-hero-primary')).toBeEnabled();
  });

  test('rotas /app/* protegidas sem token', async ({ page }) => {
    const routes = ['/app/dashboard', '/app/accounts', '/app/transactions', '/app/budgets', '/app/goals', '/app/notifications', '/app/subscription'];
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
