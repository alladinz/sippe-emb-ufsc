import { test, expect } from '@playwright/test';

// Shared variable to pass semester name between tests in the same run
let sharedSemesterName: string;

test.describe.serial('Teacher Revision Loop', () => {
  test.setTimeout(180000);

  test('Step 1: Setup a Rejected Plan (Coordinator Role)', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
    const randomSuffix = Math.random().toString(36).substring(7);
    sharedSemesterName = `REV-LOOP-${randomSuffix}`;

    // 1. Teacher: Submit a new plan
    await page.goto('/login');
    await page.fill('input[id="email"]', 'professor-auto@teste.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Bem-vindo')).toBeVisible({ timeout: 30000 });

    await page.goto('/dashboard/study-plans');
    await page.getByRole('button', { name: 'Novo Plano de Ensino' }).click();
    await expect(page).toHaveURL(/\/dashboard\/study-plans\/[a-f0-9-]+/, { timeout: 40000 });
    
    await page.getByRole('tab', { name: 'Institucional' }).click();
    await page.locator('input[name="semester"]').fill(sharedSemesterName);
    await page.locator('input[name="semester"]').blur();
    
    await page.getByRole('tab', { name: 'Disciplinas' }).click();
    await page.getByRole('button', { name: 'Adicionar Manual' }).click();
    await page.getByPlaceholder('ABC1234').fill('REV101');
    await page.getByPlaceholder('Cálculo I').fill('Revision Course');
    
    await page.getByRole('tab', { name: 'Metodologia' }).click();
    await page.locator('textarea[name="methodology"]').fill('Initial methodology');
    await page.getByRole('tab', { name: 'Avaliação' }).click();
    await page.locator('textarea[name="evaluation"]').fill('Initial evaluation');
    
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'Submeter para Revisão' }).click();
    await page.getByRole('button', { name: 'Confirmar Envio' }).click();
    await expect(page).toHaveURL('/dashboard/study-plans', { timeout: 30000 });

    // 2. Coordinator: Claim and Reject
    const coordContext = await browser.newContext();
    const coordPage = await coordContext.newPage();
    await coordPage.goto('/login');
    await coordPage.fill('input[id="email"]', 'coordenador@teste.com');
    await coordPage.fill('input[id="password"]', 'password123');
    await coordPage.click('button[type="submit"]');
    
    // Wait for session
    await expect(coordPage).toHaveURL(/\/dashboard/);
    
    await coordPage.goto('/dashboard/coordinator');
    // Activate org if needed
    await coordPage.evaluate(async () => {
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
    await coordPage.waitForTimeout(2000);
    await coordPage.goto('/dashboard/coordinator');

    const row = coordPage.locator('tr', { hasText: sharedSemesterName });
    await row.getByRole('button', { name: 'Iniciar Revisão' }).click();
    await expect(coordPage).toHaveURL(/\/preview/);
    await coordPage.getByRole('button', { name: 'Iniciar Revisão' }).click();
    
    await coordPage.getByRole('button', { name: 'Rejeitar' }).click();
    await coordPage.fill('textarea[id="feedback"]', 'POR FAVOR AJUSTE A METODOLOGIA');
    await coordPage.getByRole('button', { name: 'Confirmar Rejeição' }).click();
    await expect(coordPage.getByText('Rejeitado')).toBeVisible();

    await coordContext.close();
    await context.close();
  });

  test('Step 2: Teacher Revises and Re-submits', async ({ page }) => {
    // Catch console logs
    page.on('console', msg => {
        console.log(`BROWSER CONSOLE: ${msg.text()}`);
    });

    // Catch alerts
    page.on('dialog', dialog => {
        console.log(`STEP 2 DIALOG: ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
    });

    await page.context().clearCookies();
    // 1. Login as Teacher
    await page.goto('/login');
    await page.fill('input[id="email"]', 'professor-auto@teste.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    
    // 2. Open the rejected plan
    await page.goto('/dashboard/study-plans');
    const row = page.locator('tr', { hasText: sharedSemesterName });
    await row.getByRole('button', { name: 'Editar' }).click();

    // 3. Verify Feedback is visible
    await expect(page.getByText('Feedback de Rejeição')).toBeVisible();
    await expect(page.getByText('POR FAVOR AJUSTE A METODOLOGIA')).toBeVisible();

    // 4. Revise Methodology
    await page.getByRole('tab', { name: 'Metodologia' }).click();
    await page.locator('textarea[name="methodology"]').fill('Revised methodology based on feedback');
    await page.locator('textarea[name="methodology"]').blur();
    
    // Ensure courses are still there or add one
    await page.getByRole('tab', { name: 'Disciplinas' }).click();
    const courseCount = await page.locator('input[placeholder="ABC1234"]').count();
    if (courseCount === 0) {
        console.log("No courses found in rejected plan, adding one manually...");
        await page.getByRole('button', { name: 'Adicionar Manual' }).click();
        await page.getByPlaceholder('ABC1234').fill('FIX101');
        await page.getByPlaceholder('ABC1234').blur();
        await page.getByPlaceholder('Cálculo I').fill('Fixed Course');
        await page.getByPlaceholder('Cálculo I').blur();
        
        // Wait for auto-save of the new course
        await page.waitForTimeout(3000);
        await expect(page.locator('#save-status')).toBeVisible({ timeout: 20000 });
    }

    // 5. Re-submit
    await page.waitForTimeout(4000);
    await page.reload();
    await page.getByRole('tab', { name: 'Metodologia' }).click();

    const submitBtn = page.getByRole('button', { name: /submeter para revisão/i });
    const isBtnDisabled = await submitBtn.isDisabled();
    const btnText = await submitBtn.innerText();
    console.log(`SUBMIT BUTTON: text="${btnText}", disabled=${isBtnDisabled}`);

    if (isBtnDisabled) {
        // Log the status badge text to see what the UI thinks the status is
        const statusBadge = await page.locator('.rounded-full.px-2\\.5').first().innerText();
        console.log(`CURRENT UI STATUS: ${statusBadge}`);
    }

    await expect(submitBtn).toBeEnabled({ timeout: 15000 });
    
    console.log("Attempting to click submit...");
    await submitBtn.click();
    await page.getByRole('button', { name: 'Confirmar Envio' }).click();

    // Check for potential validation dialog OR successful navigation
    try {
        await page.waitForURL('/dashboard/study-plans', { timeout: 10000 });
    } catch (e) {
        console.log("Redirect did not happen in 10s, checking for validation state...");
        // If we are still on the form, log the current URL and status
        console.log("STILL ON PAGE:", page.url());
    }

    // 6. Verify success (allow more time if slow)
    await expect(page).toHaveURL('/dashboard/study-plans', { timeout: 20000 });
    const updatedRow = page.locator('tr', { hasText: sharedSemesterName });
    await expect(updatedRow.getByText('Enviado')).toBeVisible();
  });

  test('Step 3: Verify Form Locking (Read-Only State)', async ({ page }) => {
    await page.context().clearCookies();
    // 1. Teacher Login
    await page.goto('/login');
    await page.fill('input[id="email"]', 'professor-auto@teste.com');
    await page.fill('input[id="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/dashboard/study-plans');
    
    // 2. Find the SUBMITTED plan (from Step 2)
    const row = page.locator('tr', { hasText: sharedSemesterName });
    await row.getByRole('button', { name: 'Editar' }).click();

    // 3. Verify inputs are disabled
    await page.getByRole('tab', { name: 'Institucional' }).click();
    const semesterInput = page.locator('input[name="semester"]');
    await expect(semesterInput).toBeDisabled();

    await page.getByRole('tab', { name: 'Metodologia' }).click();
    const methodologyTextarea = page.locator('textarea[name="methodology"]');
    await expect(methodologyTextarea).toBeDisabled();

    // 4. Verify Submit button is disabled/hidden
    const submitBtn = page.getByRole('button', { name: 'Submeter para Revisão' });
    await expect(submitBtn).toBeDisabled();
  });
});
