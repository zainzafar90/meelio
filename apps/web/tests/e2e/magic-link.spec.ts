import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.test') });

const TEST_EMAIL = process.env.TEST_EMAIL || 'nonprouser@test.com';
const ETHEREAL_EMAIL = process.env.ETHEREAL_EMAIL || 'iz6gkho3vdpzzqm5@ethereal.email';
const ETHEREAL_PASSWORD = process.env.ETHEREAL_PASSWORD || 'DR6TmfmnyFBxsHh8Xf';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';

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
  
  // 5. Wait for success toast
  await page.waitForSelector('text="We sent you a magic link."', { timeout: 10000 });
  console.log('✅ Magic link sent - toast confirmed');
  
  // 6. Wait for email to arrive
  console.log('⏳ Waiting 3 seconds for email delivery...');
  await page.waitForTimeout(3000);

  // 7. Open Ethereal in new tab
  const etherealPage = await context.newPage();
  await etherealPage.goto('https://ethereal.email/login');
  console.log('📬 Opening Ethereal email service');
  
  // 8. Login to Ethereal
  await etherealPage.fill('input[name="address"]', ETHEREAL_EMAIL);
  await etherealPage.fill('input[name="password"]', ETHEREAL_PASSWORD);
  await etherealPage.click('button[type="submit"]');
  console.log(`🔐 Logging into Ethereal as: ${ETHEREAL_EMAIL}`);
  
  // 9. Go directly to messages page
  await etherealPage.goto('https://ethereal.email/messages');
  await etherealPage.waitForLoadState('networkidle');
  console.log('📧 On Ethereal messages page');
  
  // 10. Click the first (latest) email with bold style - it's the newest one
  const latestEmail = etherealPage.locator('tbody tr[style*="bold"]').first();
  await latestEmail.click();
  console.log('📨 Opened latest email');
  
  // 11. Wait for email view to load
  await etherealPage.waitForLoadState('networkidle');
  await etherealPage.waitForTimeout(2000);
  
  // 12. Extract magic link from page content
  const pageContent = await etherealPage.content();
  
  // Look for the magic link URL pattern in the page
  const tokenPattern = new RegExp(`${FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\?token=[A-Za-z0-9\\-._~]+`);
  const tokenMatch = pageContent.match(tokenPattern);
  
  if (!tokenMatch) {
    console.log('❌ Could not extract magic link from email');
    throw new Error('Magic link not found in email');
  }
  
  const [magicLink] = tokenMatch || [];
  console.log('🔗 Found magic link:', magicLink);

  if (!magicLink) {
    console.log('❌ Could not extract magic link from email');
    throw new Error('Magic link not found in email');
  }
  
  // 13. Close Ethereal tab
  await etherealPage.close();
  
  // 14. Navigate to the magic link
  console.log('🚀 Visiting magic link...');
  await page.goto(magicLink);
  
  // 15. Wait for verification success toast
  const verifiedToast = await page.waitForSelector('text="Successfully verified!"', { timeout: 10000 });
  console.log('✅ Magic link verified - toast confirmed');
  
  // 16. Verify we're logged in
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