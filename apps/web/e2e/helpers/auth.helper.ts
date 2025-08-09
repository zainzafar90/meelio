import { Page, BrowserContext } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.test') });
export const ETHEREAL_EMAIL = process.env.ETHEREAL_EMAIL || 'iz6gkho3vdpzzqm5@ethereal.email';
export const ETHEREAL_PASSWORD = process.env.ETHEREAL_PASSWORD || 'DR6TmfmnyFBxsHh8Xf';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4000';
export const TEST_EMAIL = process.env.TEST_EMAIL || 'zainzafar90@gmail.com';

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
    
    // Go to messages
    await etherealPage.goto('https://ethereal.email/messages');
    await etherealPage.waitForLoadState('networkidle');
    
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
        if (href.startsWith('/')) {
          await etherealPage.goto(`https://ethereal.email${href}`);
        } else {
          await etherealPage.goto(href);
        }
      }
    } else {
      await firstRow.click();
    }
    
    await etherealPage.waitForLoadState('networkidle');
    await etherealPage.waitForTimeout(3000);
    
    const tabs = ['HTML', 'Html', 'html', 'Text', 'text', 'Raw', 'raw'];
    for (const tab of tabs) {
      const tabElement = etherealPage.locator(`text="${tab}"`).first();
      if (await tabElement.count() > 0) {
        await tabElement.click();
        await etherealPage.waitForTimeout(1000);
        
        const pageContent = await etherealPage.content();
        const linkMatch = pageContent.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
        if (linkMatch) {
          return linkMatch[0];
        }
      }
    }
    
    const preBlocks = await etherealPage.locator('pre, code').all();
    for (const block of preBlocks) {
      const text = await block.textContent();
      if (text) {
        const linkMatch = text.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
        if (linkMatch) {
          return linkMatch[0];
        }
      }
    }
    
    const elementsWithLink = await etherealPage.locator(`text=/localhost:4000.*token=/`).all();
    for (const element of elementsWithLink) {
      const text = await element.textContent();
      if (text) {
        const linkMatch = text.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
        if (linkMatch) {
          return linkMatch[0];
        }
      }
    }
    
    const pageContent = await etherealPage.content();
    const linkMatch = pageContent.match(/http:\/\/localhost:4000\?token=[A-Za-z0-9\-._~]+/);
    if (linkMatch) {
      return linkMatch[0];
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
  
  if (!clearStorage && await isUserLoggedIn(page)) {
    return;
  }
  
  if (clearStorage) {
    await clearAuthData(page);
  }
  
  await page.goto(FRONTEND_URL);
  await page.waitForLoadState('networkidle');
  
  const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  await emailInput.fill(email);
  
  const signInButton = await page.waitForSelector('button:has-text("Sign In with Email")', { timeout: 5000 });
  await signInButton.click();
  
  await page.waitForSelector('text="We sent you a magic link."', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  const magicLink = await getMagicLinkFromEmail(context);
  await page.goto(magicLink);
  
  await page.waitForSelector('text="Successfully verified!"', { timeout: 10000 });
  await page.waitForTimeout(2000);
  
  const currentUrl = page.url();
  if (currentUrl.includes('/login') || currentUrl.includes('/auth') || currentUrl === FRONTEND_URL + '/' || currentUrl === FRONTEND_URL) {
    await page.goto(`${FRONTEND_URL}/app`);
    await page.waitForLoadState('networkidle');
  }
  
  if (skipOnboarding) {
    await page.waitForTimeout(2000);
    const onboardingModal = await page.locator('dialog:has-text("Welcome to Meelio!")').isVisible().catch(() => false);
    
    if (onboardingModal) {
      const skipButton = page.locator('button:has-text("Skip")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.waitForTimeout(1000);
      }
    }
  }
  
  if (!skipOnboarding) {
    const hasSession = await page.evaluate(() => {
      const userStr = localStorage.getItem('meelio:local:user');
      return !!userStr;
    });
    
    if (!hasSession) {
      throw new Error('Authentication failed - no user session created');
    }
  } else {
    const loggedIn = await isUserLoggedIn(page);
    if (!loggedIn) {
      throw new Error('Authentication failed - user not logged in after magic link');
    }
  }
}

/**
 * Clear onboarding flag to force onboarding to show
 */
export async function clearOnboardingFlag(page: Page): Promise<void> {
  await page.evaluate(() => {
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
}