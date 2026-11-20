import { test, expect } from '@playwright/test';

test.describe('Home (Landing Page)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('exibe o título FinanceFlow na navbar', async ({ page }) => {
    await expect(page.locator('.nav-brand')).toContainText('FinanceFlow');
  });

  test('exibe o hero com CTA', async ({ page }) => {
    await expect(page.locator('.hero-badge')).toBeVisible();
    await expect(page.locator('.btn-hero-primary')).toBeVisible();
  });

  test('exibe 6 feature cards', async ({ page }) => {
    await expect(page.locator('.feature-card')).toHaveCount(6);
  });

  test('exibe 2 planos (FREE e PRO)', async ({ page }) => {
    await expect(page.locator('.plan-card')).toHaveCount(2);
    await expect(page.locator('.plan-card.highlight')).toHaveCount(1);
  });

  test('botão Entrar navega para /login', async ({ page }) => {
    await page.locator('.btn-outline', { hasText: 'Entrar' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('navbar tem link Entrar quando não autenticado', async ({ page }) => {
    await expect(page.locator('.nav-actions .btn-outline')).toBeVisible();
  });

  test('footer exibe copyright', async ({ page }) => {
    await expect(page.locator('.footer-copy')).toContainText('FinanceFlow');
  });

  test('seção de features está visível', async ({ page }) => {
    await page.locator('#features').scrollIntoViewIfNeeded();
    await expect(page.locator('.features-section')).toBeVisible();
  });
});
