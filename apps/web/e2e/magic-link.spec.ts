import { test, expect } from '@playwright/test';
import { 
  getMagicLinkFromEmail,
  FRONTEND_URL,
  TEST_EMAIL
} from './helpers/auth.helper';

test('Magic Link Authentication', async ({ page, context }) => {
  await page.goto(FRONTEND_URL);
  await page.waitForLoadState('networkidle');
  
  const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await emailInput.fill(TEST_EMAIL);
  
  const signInButton = await page.waitForSelector('button:has-text("Sign In with Email")', { timeout: 5000 });
  await signInButton.click();
  
  await page.waitForSelector('text="We sent you a magic link."', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  const magicLink = await getMagicLinkFromEmail(context);
  await page.goto(magicLink);
  
  const verifiedToast = await page.waitForSelector('text="Successfully verified!"', { timeout: 10000 });
  
  const currentUrl = page.url();
  const isLoggedIn = !currentUrl.includes('/login') && !currentUrl.includes('/verify-magic-link');
  
  const userData = await page.evaluate(() => localStorage.getItem('meelio:local:user'));
  
  // Additional verification: check if we can see the main app content
  const appContent = await page.locator('main').isVisible().catch(() => false);
  
  expect(verifiedToast).toBeTruthy();
  expect(isLoggedIn).toBeTruthy();
  expect(userData).toBeTruthy();
  expect(appContent).toBeTruthy();
});