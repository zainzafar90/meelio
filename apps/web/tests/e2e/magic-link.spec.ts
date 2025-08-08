import { test, expect } from '@playwright/test';
import { 
  getMagicLinkFromEmail,
  FRONTEND_URL,
  TEST_EMAIL
} from './helpers/auth.helper';

test('magic link authentication', async ({ page, context }) => {
  await page.goto(FRONTEND_URL);
  console.log('📍 On home (auth) page');
  
  // 2. Wait for page to fully load
  await page.waitForLoadState('networkidle');
  
  // 3. Enter email and request magic link
  const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await emailInput.fill(TEST_EMAIL);
  console.log(`✉️ Filled email: ${TEST_EMAIL}`);
  
  // 4. Click the Sign In button
  const signInButton = await page.waitForSelector('button:has-text("Sign In with Email")', { timeout: 5000 });
  await signInButton.click();
  console.log('🔘 Clicked Sign In button');
  console.log(`✉️ Requesting magic link for: ${TEST_EMAIL}`);
  
  // 5. Wait for confirmation that email was sent
  await page.waitForSelector('text="We sent you a magic link."', { timeout: 10000 });
  console.log('✅ Magic link sent - toast confirmed');
  
  // 6. Wait for email to arrive
  console.log('⏳ Waiting 3 seconds for email delivery...');
  await page.waitForTimeout(3000);
  
  // 7. Get magic link from email using helper
  console.log('📬 Getting magic link from email...');
  const magicLink = await getMagicLinkFromEmail(context);
  console.log('🔗 Found magic link:', magicLink);
  
  // 8. Navigate to the magic link
  console.log('🚀 Visiting magic link...');
  await page.goto(magicLink);
  
  // 9. Wait for verification success toast
  const verifiedToast = await page.waitForSelector('text="Successfully verified!"', { timeout: 10000 });
  console.log('✅ Magic link verified - toast confirmed');
  
  // 10. Verify we're logged in
  const currentUrl = page.url();
  const isLoggedIn = !currentUrl.includes('/login') && !currentUrl.includes('/verify-magic-link');
  
  console.log('📍 Current URL:', currentUrl);
  
  // Check if user data is in localStorage
  const userData = await page.evaluate(() => localStorage.getItem('meelio:local:user'));
  if (userData) {
    console.log('✅ User session created in localStorage');
  }
  
  // Final verification
  expect(verifiedToast).toBeTruthy();
  expect(isLoggedIn).toBeTruthy();
  console.log('🎉 Successfully authenticated via magic link!');
});