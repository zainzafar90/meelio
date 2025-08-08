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
  
  // 10. Find and open the latest email
  const emailRows = etherealPage.locator('tbody tr');
  const emailCount = await emailRows.count();
  
  if (emailCount === 0) {
    throw new Error('No emails found in Ethereal inbox');
  }
  
  // Look for the message link in the first email row
  const firstRow = emailRows.first();
  const messageLink = firstRow.locator('td a[href*="/message"]').first();
  
  if (await messageLink.count() > 0) {
    const href = await messageLink.getAttribute('href');
    if (href) {
      console.log('📧 Found message link:', href);
      // Navigate directly to the message
      if (href.startsWith('/')) {
        await etherealPage.goto(`https://ethereal.email${href}`);
      } else {
        await etherealPage.goto(href);
      }
      console.log('✅ Navigated to message view');
    }
  } else {
    // Fallback: click the row
    await firstRow.click();
    console.log('📧 Clicked email row');
  }
  
  // 11. Wait for email view to load
  await etherealPage.waitForLoadState('networkidle');
  await etherealPage.waitForTimeout(3000);
  
  // 12. Try different tabs to find the email content
  let magicLink: string | null = null;
  
  // Look for different tabs/views that might contain the email content
  const tabs = ['HTML', 'Html', 'html', 'Text', 'text', 'Raw', 'raw'];
  for (const tab of tabs) {
    const tabElement = etherealPage.locator(`text="${tab}"`).first();
    if (await tabElement.count() > 0) {
      console.log(`📄 Found ${tab} tab, clicking...`);
      await tabElement.click();
      await etherealPage.waitForTimeout(1000);
      
      // Check if we can find the magic link after clicking this tab
      const pageContent = await etherealPage.content();
      const linkMatch = pageContent.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
      if (linkMatch) {
        console.log(`🔗 Found magic link in ${tab} view`);
        magicLink = linkMatch[0];
        break;
      }
    }
  }
  
  // If not found in tabs, try other methods
  if (!magicLink) {
    // Try to find the email content in pre or code blocks
    const preBlocks = await etherealPage.locator('pre, code').all();
    for (const block of preBlocks) {
      const text = await block.textContent();
      if (text) {
        const linkMatch = text.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
        if (linkMatch) {
          console.log('🔗 Found magic link in pre/code block');
          magicLink = linkMatch[0];
          break;
        }
      }
    }
  }
  
  // Final fallback: check entire page content
  if (!magicLink) {
    const pageContent = await etherealPage.content();
    const linkMatch = pageContent.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
    if (linkMatch) {
      console.log('🔗 Found magic link in page content');
      magicLink = linkMatch[0];
    }
  }
  
  if (!magicLink) {
    console.log('❌ Could not extract magic link from email');
    // Log debugging info
    const visibleText = await etherealPage.locator('body').innerText();
    console.log('Visible text length:', visibleText.length);
    if (visibleText.includes('localhost')) {
      console.log('Page contains "localhost" but no valid magic link pattern found');
    }
    throw new Error('Magic link not found in email');
  }
  
  console.log('🔗 Found magic link:', magicLink);
  
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