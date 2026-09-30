import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.delete('/api/decisions');
});

test('creates a Fast Or decision and saves it', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Coffee');
  await page.getByLabel('Option B').fill('Matcha');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByText('fast Or chose', { exact: false })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: "I'll do it" }).click();
  await expect(page.getByText("It’s decided.", { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open my decisions' })).toBeVisible();
});

test('saves the user choice when they override Or', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Coffee');
  await page.getByLabel('Option B').fill('Matcha');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByRole('heading', { name: 'Coffee.' })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: 'Not this time' }).click();
  await expect(page.getByText('It’s decided.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Matcha' })).toBeVisible();
  await page.getByRole('link', { name: 'Open entry' }).click();
  await expect(page.getByText('Matcha', { exact: true }).first()).toBeVisible();
});

test('rejects incomplete and duplicate options before deciding', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Coffee');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByRole('alert')).toHaveText(/two possibilities/i);
  await page.getByLabel('Option B').fill('coffee');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByRole('alert')).toHaveText(/look the same/i);
  await expect(page.getByRole('heading', { name: 'What are you deciding?' })).toBeVisible();
});

test('exports a saved decision as a PNG journal card', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Coffee');
  await page.getByLabel('Option B').fill('Matcha');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByText('fast Or chose', { exact: false })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: "I'll do it" }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save journal card' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^or-decision-.*\.png$/);
});

test('previews an option photo and persists the ambient scene', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'option.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByRole('button', { name: 'Remove photo from option A' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove photo from option A' }).click();
  await expect(page.getByRole('button', { name: 'Remove photo from option A' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Sound off' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sound ready' })).toBeVisible();
  await page.getByRole('button', { name: 'Sound ready' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toBeVisible();
  await page.getByRole('button', { name: 'Sound on' }).click();

  await page.getByRole('link', { name: 'Settings' }).click();
  const focusScene = page.getByRole('button', { name: /Focus/ });
  await focusScene.click();
  await expect(focusScene).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: /Focus/ })).toHaveAttribute('aria-pressed', 'true');
});

test('falls back to text when speech recognition is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true });
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByRole('button', { name: 'Tap to speak' }).click();
  await expect(page.getByText("Voice isn't supported here — type instead.")).toBeVisible();
  await expect(page.getByLabel('Option A')).toBeEditable();
});

test('creates a Think Or decision through clarifying questions', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Stay home tonight');
  await page.getByLabel('Option B').fill('Go out with friends');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByText('think Or · 1 of 2', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /Go out with friends/ }).click();
  await page.getByRole('button', { name: /Go out with friends/ }).click();
  await expect(page.getByRole('heading', { name: /Go out with friends/ })).toBeVisible({ timeout: 5_000 });
});

test('finds a saved decision in the diary', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Sushi');
  await page.getByLabel('Option B').fill('Ramen');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByText('fast Or chose', { exact: false })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: "I'll do it" }).click();
  await page.getByRole('link', { name: 'Open my decisions' }).click();
  await expect(page.getByText('Sushi or Ramen?')).toBeVisible();
});

test('submits an outcome from decision detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Movie A');
  await page.getByLabel('Option B').fill('Movie B');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await expect(page.getByText('fast Or chose', { exact: false })).toBeVisible({ timeout: 5_000 });
  await page.getByRole('button', { name: "I'll do it" }).click();
  await page.getByRole('link', { name: 'Open entry' }).click();
  await page.getByRole('button', { name: /Loved it/ }).click();
  await page.getByRole('button', { name: 'Save what happened' }).click();
  await expect(page.getByText('Outcome saved. This will shape similar decisions.')).toBeVisible();
});

test('a past outcome appears in a future recommendation', async ({ page, request }) => {
  const created = await request.post('/api/decisions', { data: {
    question: 'Stay home tonight or go out with friends?', optionA: 'Stay home tonight', optionB: 'Go out with friends', context: '',
    mode: 'think', category: 'social', reversible: true, recommendationIndex: 1, confidence: 78,
    reason: 'Experience mattered.', tradeoff: 'Less rest.', regretEstimate: 'Low', finalChoiceIndex: 1, accepted: true,
    durationSeconds: 18, mood: 'torn', reflection: 'I chose experience.',
  } });
  const body = await created.json();
  await request.patch(`/api/decisions/${body.decision.id}`, { data: { rating: 'loved', satisfaction: 5, regret: 0, reflection: 'Glad I went.' } });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeEnabled();
  await page.getByLabel('Option A').fill('Stay home tonight');
  await page.getByLabel('Option B').fill('Go out with friends');
  await page.getByRole('button', { name: 'Choose for me' }).click();
  await page.getByRole('button', { name: /Go out with friends/ }).click();
  await page.getByRole('button', { name: /Go out with friends/ }).click();
  await expect(page.getByText('Or found a related decision', { exact: false })).toBeVisible({ timeout: 5_000 });
});

test('mobile viewport keeps the primary action usable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'mobile-only check');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What are you deciding?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose for me' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
});
