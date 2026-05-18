import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Study Plan Management', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'professor@teste.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Bem-vindo')).toBeVisible({ timeout: 30000 });
  });

  test('should create and auto-save a new plan', async ({ page }) => {
    await page.goto('/dashboard/study-plans');
    await page.getByRole('button', { name: 'Novo Plano de Ensino' }).click();
    
    await expect(page).toHaveURL(/\/dashboard\/study-plans\/[a-f0-9-]+/, { timeout: 40000 });
    
    await page.getByRole('tab', { name: 'Institucional' }).click();
    const semesterInput = page.locator('input[name="semester"]');
    await expect(semesterInput).toBeVisible({ timeout: 30000 });
    
    const newVal = 'Auto.' + Math.random().toString(36).substring(7);
    await semesterInput.fill(newVal);
    await semesterInput.blur();
    
    // Wait for auto-save indicator
    await page.waitForTimeout(3000);
    await expect(page.locator('#save-status')).toBeVisible({ timeout: 20000 });
    
    await page.reload();
    await page.getByRole('tab', { name: 'Institucional' }).click();
    await expect(page.locator('input[name="semester"]')).toHaveValue(newVal, { timeout: 20000 });
  });

  test('should import courses from CSV', async ({ page }) => {
    await page.goto('/dashboard/study-plans');
    await page.getByRole('button', { name: 'Novo Plano de Ensino' }).click();
    await expect(page).toHaveURL(/\/dashboard\/study-plans\/[a-f0-9-]+/, { timeout: 40000 });
    
    await page.getByRole('tab', { name: 'Disciplinas' }).click();
    await page.getByText('Importar CSV').click();
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Clique para selecionar o arquivo');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, 'mock-courses.csv'));
    
    await page.click('button[id="mapping-code"]');
    await page.click('role=option[name="Código"]');
    
    await page.click('button[id="mapping-name"]');
    await page.click('role=option[name="Nome"]');
    
    await page.getByRole('button', { name: 'Concluir Importação' }).click();
    
    await expect(page.getByPlaceholder('ABC1234').first()).toHaveValue('MAT101', { timeout: 15000 });
  });

  test('should show preview correctly', async ({ page }) => {
    await page.goto('/dashboard/study-plans');
    await page.getByRole('button', { name: 'Novo Plano de Ensino' }).click();
    await expect(page).toHaveURL(/\/dashboard\/study-plans\/[a-f0-9-]+/, { timeout: 40000 });
    
    await page.getByRole('tab', { name: 'Institucional' }).click();
    const newVal = 'Pre.' + Math.random().toString(36).substring(7);
    await page.locator('input[name="semester"]').fill(newVal);
    await page.locator('input[name="semester"]').blur();
    await page.getByRole('tab', { name: 'Metodologia' }).click();
    await page.locator('textarea[name="methodology"]').fill('Preview methodology content');
    await page.locator('textarea[name="methodology"]').blur();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('#save-status')).toBeVisible({ timeout: 20000 });
    await page.getByRole('link', { name: 'Visualizar' }).click();
    
    await expect(page).toHaveURL(/\/preview/, { timeout: 30000 });
    await expect(page.getByText(newVal)).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Preview methodology content')).toBeVisible({ timeout: 20000 });
  });
});
