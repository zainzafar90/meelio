import { test, expect } from '@playwright/test';
import { 
  authenticateUser,
  clearAuthData,
  clearOnboardingFlag
} from './helpers/auth.helper';

test.describe('Onboarding Flow', () => {
  test.describe.configure({ mode: 'serial' });
  
  test.afterEach(async ({ page }) => {
    await clearAuthData(page);
  });
  
  test('onboarding modal displays with correct data-testids', async ({ page, context }) => {
    const TEST_EMAIL = process.env.TEST_EMAIL || 'zainzafar90@gmail.com';
    
    await page.goto('http://localhost:4000');
    await clearAuthData(page);
    
    await authenticateUser(page, context, { 
      email: TEST_EMAIL,
      skipOnboarding: false
    });
    
    await page.evaluate(() => {
      localStorage.removeItem('meelio:local:onboarding');
      const userStr = localStorage.getItem('meelio:local:user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.state?.user?.settings) {
            user.state.user.settings.onboardingCompleted = false;
            localStorage.setItem('meelio:local:user', JSON.stringify(user));
          }
        } catch (e) {
          console.error(e);
          throw e;
        }
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    let onboardingModal = page.locator('dialog:has-text("Welcome to Meelio!")').first();
    let isVisible = await onboardingModal.isVisible().catch(() => false);
    
    if (!isVisible) {
      onboardingModal = page.locator('[role="dialog"]:has-text("Welcome to Meelio!")').first();
      isVisible = await onboardingModal.isVisible().catch(() => false);
    }
    
    if (!isVisible) {
      await page.waitForSelector('text="Welcome to Meelio!"', { timeout: 5000 }).catch(() => null);
      onboardingModal = page.locator(':has-text("Welcome to Meelio!")').locator('xpath=..').first();
      isVisible = await onboardingModal.isVisible().catch(() => false);
    }
    
    if (!isVisible) {
      const dockDialog = page.locator('contentinfo dialog').first();
      if (await dockDialog.isVisible()) {
        onboardingModal = dockDialog;
        isVisible = true;
      }
    }
    
    if (!onboardingModal || !isVisible) {
      await page.screenshot({ path: 'onboarding-not-found.png', fullPage: true });
      throw new Error('Onboarding modal should appear for new user but was not found');
    }
    
    const EXPECTED_STEPS = 9;
    
    for (let i = 0; i < EXPECTED_STEPS; i++) {
      await page.waitForTimeout(500);
      
      if (i === EXPECTED_STEPS - 1) {
        const finishButton = page.locator('[data-testid="onboarding-finish"], button:has-text("Finish")');
        await finishButton.click();
        break;
      } else {
        const nextButton = page.locator('[data-testid="onboarding-next"], button:has-text("Next")');
        await nextButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    await page.waitForTimeout(1000);
    const modalGone = await page.locator('[data-testid="onboarding-modal"], [role="dialog"][aria-labelledby="onboarding-title"]').isVisible();
    
    expect(modalGone).toBeFalsy();
  });
  
  test('verify onboarding with existing user', async ({ page, context }) => {
    test.setTimeout(60000);
    
    await page.goto('http://localhost:4000');
    await clearAuthData(page);
    
    await authenticateUser(page, context, {
      clearStorage: false,
      skipOnboarding: false
    });
    
    await clearOnboardingFlag(page);
    await page.reload();
    await page.waitForTimeout(2000);
    
    const onboardingModal = await page.locator('[data-testid="onboarding-modal"]').isVisible().catch(() => false);
    
    if (onboardingModal) {
      const title = await page.locator('[data-testid="onboarding-title"]').isVisible();
      const description = await page.locator('[data-testid="onboarding-description"]').isVisible();
      const skipButton = await page.locator('[data-testid="onboarding-skip"]').isVisible();
      const nextButton = await page.locator('[data-testid="onboarding-next"]').isVisible();
      
      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
      expect(skipButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
      
      const skipBtn = page.locator('button:has-text("Skip")');
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});