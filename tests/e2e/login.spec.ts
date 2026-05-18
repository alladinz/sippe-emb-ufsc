import { test, expect } from '@playwright/test';

test('login page loads and has PT-BR text', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Sistema de Gestão de Planos de Ensino')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toContainText('Entrar');
});

test('successful login as professor', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[id="email"]', 'professor@teste.com');
  await page.fill('input[id="password"]', 'password123');
  
  await page.click('button[type="submit"]');
  
  // Increased timeout due to slow initial compilation/auth
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
  await expect(page.getByText('Bem-vindo, Professor Teste')).toBeVisible({ timeout: 10000 });
});

test('failed login shows error message', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('input[id="email"]', 'errado@teste.com');
  await page.fill('input[id="password"]', 'errada');
  
  await page.click('button[type="submit"]');
  
  // Check for localized error message or default English one if not translated yet
  // but we prefer the localized one we set in the page
  const errorMsg = page.locator('div.bg-destructive\\/15');
  await expect(errorMsg).toBeVisible({ timeout: 10000 });
});
