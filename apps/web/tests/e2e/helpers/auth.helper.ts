import { Page, BrowserContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.test') });

const ETHEREAL_EMAIL = process.env.ETHEREAL_EMAIL || 'iz6gkho3vdpzzqm5@ethereal.email';
const ETHEREAL_PASSWORD = process.env.ETHEREAL_PASSWORD || 'DR6TmfmnyFBxsHh8Xf';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'zainzafar90@gmail.com';

export interface AuthHelperOptions {
  email?: string;
  clearStorage?: boolean;
  skipOnboarding?: boolean;
}

/**
 * Check if a user is currently logged in
 */
export async function isUserLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if we're on a protected route (not login page)
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      return false;
    }
    
    // Check for user data in localStorage
    const userData = await page.evaluate(() => {
      const userStr = localStorage.getItem('meelio:local:user');
      if (!userStr) return null;
      
      try {
        const user = JSON.parse(userStr);
        return user?.state?.user?.email || null;
      } catch {
        return null;
      }
    });
    
    return !!userData;
  } catch {
    return false;
  }
}

/**
 * Clear all authentication and storage data
 */
export async function clearAuthData(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear all localStorage keys related to Meelio
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('meelio')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also clear sessionStorage
    sessionStorage.clear();
  });
  
  // Clear cookies
  await page.context().clearCookies();
  
  console.log('🧹 Cleared all auth data');
}

/**
 * Get magic link from Ethereal email
 */
export async function getMagicLinkFromEmail(
  context: BrowserContext
): Promise<string> {
  const etherealPage = await context.newPage();
  
  try {
    // Login to Ethereal
    await etherealPage.goto('https://ethereal.email/login');
    await etherealPage.fill('input[name="address"]', ETHEREAL_EMAIL);
    await etherealPage.fill('input[name="password"]', ETHEREAL_PASSWORD);
    await etherealPage.click('button[type="submit"]');
    console.log('🔐 Logged into Ethereal');
    
    // Go to messages
    await etherealPage.goto('https://ethereal.email/messages');
    await etherealPage.waitForLoadState('networkidle');
    
    // Wait a bit for emails to load  
    await etherealPage.waitForTimeout(2000);
    
    // Find and click the latest email
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
    
    // Wait for email to load completely
    await etherealPage.waitForLoadState('networkidle');
    await etherealPage.waitForTimeout(3000);
    
    // Look for different tabs/views that might contain the email content
    // Ethereal has tabs like Text, HTML, Headers, Raw
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
          return linkMatch[0];
        }
      }
    }
    
    // If tabs didn't work, try to find the email content in pre or code blocks
    const preBlocks = await etherealPage.locator('pre, code').all();
    for (const block of preBlocks) {
      const text = await block.textContent();
      if (text) {
        const linkMatch = text.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
        if (linkMatch) {
          console.log('🔗 Found magic link in pre/code block');
          return linkMatch[0];
        }
      }
    }
    
    // Try to find any element containing the magic link text
    const elementsWithLink = await etherealPage.locator(`text=/localhost:4000.*token=/`).all();
    for (const element of elementsWithLink) {
      const text = await element.textContent();
      if (text) {
        const linkMatch = text.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
        if (linkMatch) {
          console.log('🔗 Found magic link in element');
          return linkMatch[0];
        }
      }
    }
    
    // Final fallback: check entire page content
    const pageContent = await etherealPage.content();
    const linkMatch = pageContent.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
    if (linkMatch) {
      console.log('🔗 Found magic link in page content');
      return linkMatch[0];
    }
    
    // If still not found, log what we see for debugging
    console.error('Magic link not found in email');
    console.error('Page title:', await etherealPage.title());
    const visibleText = await etherealPage.locator('body').innerText();
    console.error('Visible text length:', visibleText.length);
    if (visibleText.includes('localhost')) {
      console.error('Page contains "localhost" but no valid magic link pattern found');
    }
    
    throw new Error('Magic link not found in email');
  } finally {
    await etherealPage.close();
  }
}

/**
 * Authenticate a user via magic link
 */
export async function authenticateUser(
  page: Page,
  context: BrowserContext,
  options: AuthHelperOptions = {}
): Promise<void> {
  const {
    email = TEST_EMAIL,
    clearStorage = false,
    skipOnboarding = false
  } = options;
  
  // Check if already logged in
  if (!clearStorage && await isUserLoggedIn(page)) {
    console.log('✅ User already logged in');
    return;
  }
  
  // Clear storage if requested
  if (clearStorage) {
    await clearAuthData(page);
  }
  
  // Navigate to login page
  await page.goto(FRONTEND_URL);
  await page.waitForLoadState('networkidle');
  
  // Request magic link
  const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await emailInput.fill(email);
  console.log(`✉️ Requesting magic link for: ${email}`);
  
  const signInButton = await page.waitForSelector('button:has-text("Sign In with Email")', { timeout: 5000 });
  await signInButton.click();
  
  // Wait for confirmation
  await page.waitForSelector('text="We sent you a magic link."', { timeout: 10000 });
  console.log('✅ Magic link sent');
  
  // Wait for email to arrive
  console.log('⏳ Waiting for email delivery...');
  await page.waitForTimeout(3000);
  
  // Get magic link from email
  const magicLink = await getMagicLinkFromEmail(context);
  
  // Visit magic link
  console.log('🚀 Visiting magic link...');
  await page.goto(magicLink);
  
  // Wait for verification
  await page.waitForSelector('text="Successfully verified!"', { timeout: 10000 });
  console.log('✅ Successfully authenticated');
  
  // The app might redirect back to login, we need to go to the main app manually
  await page.waitForTimeout(2000);
  
  // Check if we're back on the login page
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/auth') || currentUrl === FRONTEND_URL + '/' || currentUrl === FRONTEND_URL) {
    console.log('⚠️ Redirected back to login, navigating to app...');
    // Try to navigate to the main app page
    await page.goto(`${FRONTEND_URL}/app`);
    await page.waitForLoadState('networkidle');
    
    // If that doesn't work, try the base URL again
    const newUrl = page.url();
    if (newUrl.includes('/login') || newUrl.includes('/auth') || newUrl === FRONTEND_URL + '/' || newUrl === FRONTEND_URL) {
      console.log('⚠️ Still on auth page, user session might not be persisted');
    }
  }
  
  // Handle onboarding if needed
  if (skipOnboarding) {
    await page.waitForTimeout(2000);
    
    // Check if onboarding modal appears (use the working selector)
    const onboardingModal = await page.locator('dialog:has-text("Welcome to Meelio!")').isVisible().catch(() => false);
    
    if (onboardingModal) {
      console.log('⏭️ Skipping onboarding...');
      const skipButton = page.locator('button:has-text("Skip")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Onboarding skipped');
      }
    }
  }
  
  // For tests that want to see onboarding, don't verify login immediately
  // as the onboarding modal might block the check
  if (!skipOnboarding) {
    // Just ensure we have the user session
    const hasSession = await page.evaluate(() => {
      const userStr = localStorage.getItem('meelio:local:user');
      return !!userStr;
    });
    
    if (!hasSession) {
      throw new Error('Authentication failed - no user session created');
    }
    console.log('✅ User session exists, onboarding test can proceed');
  } else {
    // Verify login successful for non-onboarding tests
    const loggedIn = await isUserLoggedIn(page);
    if (!loggedIn) {
      throw new Error('Authentication failed - user not logged in after magic link');
    }
  }
}

/**
 * Create a unique test email address
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}_${timestamp}_${random}@test.com`;
}

/**
 * Wait for user session to be established
 */
export async function waitForSession(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      const userStr = localStorage.getItem('meelio:local:user');
      if (!userStr) return false;
      try {
        const user = JSON.parse(userStr);
        return !!user?.state?.user?.email;
      } catch {
        return false;
      }
    },
    { timeout }
  );
  console.log('✅ User session established');
}

/**
 * Get current user data from localStorage
 */
export async function getCurrentUser(page: Page): Promise<{ email?: string; name?: string; id?: string } | null> {
  return await page.evaluate(() => {
    const userStr = localStorage.getItem('meelio:local:user');
    if (!userStr) return null;
    
    try {
      const user = JSON.parse(userStr);
      return user?.state?.user || null;
    } catch {
      return null;
    }
  });
}

/**
 * Clear onboarding flag to force onboarding to show
 */
export async function clearOnboardingFlag(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear localStorage onboarding flag
    const onboardingData = localStorage.getItem('meelio:local:onboarding');
    if (onboardingData) {
      try {
        const data = JSON.parse(onboardingData);
        data.state.hasDockOnboardingCompleted = false;
        localStorage.setItem('meelio:local:onboarding', JSON.stringify(data));
      } catch {
        localStorage.removeItem('meelio:local:onboarding');
      }
    }
  });
  console.log('🔄 Cleared onboarding flag');
}