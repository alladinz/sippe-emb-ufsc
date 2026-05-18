import { test, expect } from '@playwright/test';

// Shared variable to pass semester name between tests in the same run
let sharedSemesterName: string;

test.describe.serial('Coordinator Review Workflow', () => {
  test.setTimeout(180000);

  test('Step 1: Teacher should create and submit a plan', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
    const randomSuffix = Math.random().toString(36).substring(7);
    sharedSemesterName = `E2E-${randomSuffix}`;

    // 1. Teacher Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'professor-auto@teste.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Bem-vindo')).toBeVisible({ timeout: 30000 });

    // 2. Create Plan
    await page.goto('/dashboard/study-plans');
    await page.getByRole('button', { name: 'Novo Plano de Ensino' }).click();
    await expect(page).toHaveURL(/\/dashboard\/study-plans\/[a-f0-9-]+/, { timeout: 40000 });
    
    // 3. Fill Form
    await page.getByRole('tab', { name: 'Institucional' }).click();
    await page.locator('input[name="semester"]').fill(sharedSemesterName);
    await page.locator('input[name="semester"]').blur();
    
    await page.getByRole('tab', { name: 'Disciplinas' }).click();
    await page.getByRole('button', { name: 'Adicionar Manual' }).click();
    await page.getByPlaceholder('ABC1234').fill('E2E101');
    await page.getByPlaceholder('ABC1234').blur();
    await page.getByPlaceholder('Cálculo I').fill('Test Course');
    await page.getByPlaceholder('Cálculo I').blur();
    
    await page.getByRole('tab', { name: 'Metodologia' }).click();
    await page.locator('textarea[name="methodology"]').fill('Metodologia de teste E2E');
    await page.locator('textarea[name="methodology"]').blur();

    await page.getByRole('tab', { name: 'Avaliação' }).click();
    await page.locator('textarea[name="evaluation"]').fill('Avaliação de teste E2E');
    await page.locator('textarea[name="evaluation"]').blur();
    
    // 4. Wait for auto-save - wait longer to be sure
    await page.waitForTimeout(3000);
    await expect(page.locator('#save-status')).toBeVisible({ timeout: 20000 });

    // 5. Submit
    const submitBtn = page.getByRole('button', { name: 'Submeter para Revisão' });
    await expect(submitBtn).toBeEnabled({ timeout: 20000 });
    await submitBtn.click();
    await page.getByRole('button', { name: 'Confirmar Envio' }).click();
    
    // 6. Verify submission success
    await expect(page).toHaveURL('/dashboard/study-plans', { timeout: 30000 });
  });

  test('Step 2: Coordinator should claim and reject the submitted plan', async ({ browser }) => {
    // Fresh context for Step 2
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Coordinator Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'coordenador@teste.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });

    // Force Organization Activation via API
    await page.evaluate(async () => {
        const listRes = await fetch('/api/auth/organization/list');
        const orgs = await listRes.json();
        if (orgs && orgs.length > 0) {
            await fetch('/api/auth/organization/set-active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: orgs[0].id })
            });
        }
    });
    
    await page.waitForTimeout(1000);
    
    // 2. Go to review dashboard explicitly
    await page.goto('/dashboard/coordinator');
    
    // If access is denied, try to reload once
    const accessDenied = await page.getByText('Acesso Negado').isVisible();
    if (accessDenied) {
        await page.reload();
    }

    await expect(page.getByText('Novas Submissões')).toBeVisible({ timeout: 30000 });
    
    // DEBUG: See what is in the table
    const tableText = await page.innerText('table');
    console.log("TABLE CONTENT:", tableText);
    console.log("Looking for sharedSemesterName:", sharedSemesterName);

    // 3. Find and Iniciar Revisão
    const row = page.locator('tr', { hasText: sharedSemesterName });
    await expect(row).toBeVisible({ timeout: 20000 });
    await row.getByRole('button', { name: 'Iniciar Revisão' }).click();

    // 4. Preview Page - Click Claim
    await expect(page).toHaveURL(/\/preview/);
    await page.getByRole('button', { name: 'Iniciar Revisão' }).click();
    
    // 5. Reject with feedback
    await expect(page.getByRole('button', { name: 'Rejeitar' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Rejeitar' }).click();
    await page.fill('textarea[id="feedback"]', 'Rejeitado via E2E test. Por favor, revise a bibliografia.');
    await page.getByRole('button', { name: 'Confirmar Rejeição' }).click();

    // 6. Verify status change
    await expect(page.getByText('Rejeitado')).toBeVisible({ timeout: 15000 });
    
    await context.close();
  });
});
