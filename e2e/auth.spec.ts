import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('/ redireciona para home (landing page)', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('.hero')).toBeVisible();
  });

  test('/login exibe a tela de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.login-card')).toBeVisible();
    await expect(page.locator('.brand h1')).toContainText('FinanceFlow');
  });

  test('/login tem botão de entrar com Keycloak', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('.login-btn')).toContainText('Entrar com Keycloak');
  });

  test('/app/dashboard redireciona para /login sem sessão', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('/app/accounts redireciona para /login sem sessão', async ({ page }) => {
    await page.goto('/app/accounts');
    await expect(page).toHaveURL('/login');
  });

  test('/app/transactions redireciona para /login sem sessão', async ({ page }) => {
    await page.goto('/app/transactions');
    await expect(page).toHaveURL('/login');
  });

  test('callback exibe erro quando o BFF rejeita a sessão', async ({ page }) => {
    // Intercepta por pathname, independentemente do host configurado para a API.
    // Isso mantém o E2E isolado do backend real e também cobre eventual preflight.
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== '/auth/session') {
        await route.continue();
        return;
      }

      const corsHeaders = {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: corsHeaders });
        return;
      }

      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Sessão inválida.' }),
      });
    });

    const rejectedSession = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === '/auth/session'
        && response.request().method() === 'GET'
        && response.status() === 401;
    });

    await page.goto('/auth/callback');
    await rejectedSession;
    await expect(page.locator('.error-state')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.error-state')).toContainText('Falha na autenticação');
  });
});
