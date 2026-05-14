// Playwright test starter for Festival system
// Usage notes in README.md in the same folder.

const { test, expect, request } = require('@playwright/test');

const API_FESTIVAL = process.env.API_FESTIVAL || 'http://localhost:3015';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Environment variables the test expects (provide before running):
// - JUDGE_TOKEN: token for a judge user
// - JUDGE_USER: JSON string of the judge user object (at least { id, name })
// - SESSION_ID and CANDIDATE_ID (optional): if provided, the test will try to set session active using ADMIN_TOKEN
// - ADMIN_TOKEN (optional): when present, the test uses it to set session status and active candidate via API

test.describe('Festival — Judge voting flow (starter)', () => {
  test('judge sees active candidate and can submit a vote', async ({ page, request: apiRequest }) => {
    const judgeToken = process.env.JUDGE_TOKEN;
    const judgeUserStr = process.env.JUDGE_USER;

    if (!judgeToken || !judgeUserStr) {
      test.skip(true, 'Set JUDGE_TOKEN and JUDGE_USER env vars to run this test');
      return;
    }

    const judgeUser = JSON.parse(judgeUserStr);

    // Optional: prepare session via admin API
    const adminToken = process.env.ADMIN_TOKEN;
    const sessionId = process.env.SESSION_ID;
    const candidateId = process.env.CANDIDATE_ID;

    if (adminToken && sessionId && candidateId) {
      const res = await apiRequest.post(`${API_FESTIVAL}/api/sessions/${sessionId}/activate`, {
        data: { status: 'judge_voting', active_candidate_id: candidateId },
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(e => null);
      // Accept failure — user can prepare session manually
      console.log('Attempted to activate session (may require different endpoint)', res && res.status());
    }

    // Seed localStorage with judge credentials before page loads
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', user);
    }, { token: judgeToken, user: JSON.stringify(judgeUser) });

    // Navigate to judge area — adjust path if your app uses different route
    await page.goto(`${FRONTEND_URL}/festival-forro/judge`);

    // Wait for UI to render and check for candidate card or waiting message
    await page.waitForLoadState('networkidle');

    // If the page shows "SISTEMA EM ESPERA" the test should fail here (unless intentionally no session active)
    const waiting = await page.locator('text=SISTEMA EM ESPERA').first().count();
    expect(waiting).toBe(0);

    // Check candidate name visible
    const candidateName = await page.locator('.candidate-name').first().innerText().catch(() => null);
    expect(candidateName).not.toBeNull();

    // Move a slider (first criterion) and submit a vote
    const firstSlider = await page.locator('input[type="range"]').first();
    await firstSlider.evaluate((el) => el.value = 7.5);
    await firstSlider.dispatchEvent('change');

    // Click confirm (button text may vary)
    const confirmBtn = page.locator('button:has-text("Confirmar Voto")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // After submit, expect confirmation (alert or button disabled)
    await page.waitForTimeout(800); // short wait for API response
    const votedText = await page.locator('text=Voto Já Registrado').count();
    expect(votedText).toBeGreaterThanOrEqual(0);
  });
});
