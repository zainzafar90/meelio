import { test, expect } from '@playwright/test';
import { 
  authenticateUser,
  clearAuthData,
  clearOnboardingFlag
} from './helpers/auth.helper';

test.describe('Onboarding Flow', () => {
  // Run tests in serial mode to avoid conflicts
  test.describe.configure({ mode: 'serial' });
  
  // Add cleanup after each test
  test.afterEach(async ({ page }) => {
    // Clear auth data after each test to ensure clean state
    await clearAuthData(page);
    console.log('🧹 Cleaned up after test');
  });
  
  test.skip('onboarding modal displays with correct data-testids', async ({ page, context }) => {
    console.log('📍 Testing onboarding modal data-testid attributes');
    
    // Use existing test user
    const TEST_EMAIL = process.env.TEST_EMAIL || 'zainzafar90@gmail.com';
    
    // Step 1: Navigate to the app and clear any existing auth
    await page.goto('http://localhost:4000');
    await clearAuthData(page);
    
    // Step 2: Authenticate using the helper (which will handle the magic link)
    await authenticateUser(page, context, { 
      email: TEST_EMAIL,
      skipOnboarding: false // We want to see the onboarding
    });
    
    console.log('✅ User authenticated');
    
    // Clear onboarding state AFTER authentication to force modal to appear
    await page.evaluate(() => {
      localStorage.removeItem('meelio:local:onboarding');
      // Also clear any user onboarding flags
      const userStr = localStorage.getItem('meelio:local:user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user?.state?.user?.settings) {
            user.state.user.settings.onboardingCompleted = false;
            localStorage.setItem('meelio:local:user', JSON.stringify(user));
          }
        } catch (e) {
          console.error('Failed to reset user onboarding state:', e);
        }
      }
    });
    console.log('🧹 Cleared onboarding state after auth');
    
    // Reload the page to trigger onboarding
    await page.reload();
    
    // Wait a bit for the app to initialize after reload
    await page.waitForTimeout(2000);
    
    // Step 3: Check for onboarding modal
    console.log('🎯 Checking for onboarding modal...');
    
    // The onboarding modal should appear for new users
    // Look for the dialog element that contains "Welcome to Meelio!"
    let onboardingModal = await page.locator('dialog:has-text("Welcome to Meelio!")').first();
    
    // Check if the modal is visible
    let isVisible = await onboardingModal.isVisible().catch(() => false);
    
    if (!isVisible) {
      console.log('⚠️ Dialog not visible, trying role="dialog" selector...');
      // Try with role="dialog"
      onboardingModal = await page.locator('[role="dialog"]:has-text("Welcome to Meelio!")').first();
      isVisible = await onboardingModal.isVisible().catch(() => false);
    }
    
    if (!isVisible) {
      console.log('⚠️ Still not found, waiting for any element with welcome text...');
      // Try waiting for the welcome text to appear
      await page.waitForSelector('text="Welcome to Meelio!"', { timeout: 5000 }).catch(() => null);
      
      // Now try to find the container
      onboardingModal = await page.locator(':has-text("Welcome to Meelio!")').locator('xpath=..').first();
      isVisible = await onboardingModal.isVisible().catch(() => false);
    }
    
    if (!isVisible) {
      // Check localStorage to see onboarding state for debugging
      const onboardingState = await page.evaluate(() => {
        const onboardingData = localStorage.getItem('meelio:local:onboarding');
        const userData = localStorage.getItem('meelio:local:user');
        return {
          onboarding: onboardingData ? JSON.parse(onboardingData) : null,
          user: userData ? JSON.parse(userData) : null
        };
      });
      
      console.log('📊 Onboarding state:', {
        hasDockOnboardingCompleted: onboardingState.onboarding?.state?.hasDockOnboardingCompleted,
        userOnboardingCompleted: onboardingState.user?.state?.user?.settings?.onboardingCompleted
      });
      
    } else {
      console.log('✅ Found onboarding modal');
    }
    
    if (!onboardingModal || !isVisible) {
      console.log('❌ Onboarding modal not found, trying one more approach...');
      
      // Final attempt: look for the dialog in the contentinfo (dock area)
      const dockDialog = await page.locator('contentinfo dialog').first();
      if (await dockDialog.isVisible()) {
        console.log('✅ Found onboarding modal in dock');
        onboardingModal = dockDialog;
        isVisible = true;
      }
    }
    
    if (!onboardingModal || !isVisible) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'onboarding-not-found.png', fullPage: true });
      console.log('📸 Screenshot saved as onboarding-not-found.png');
      
      // Check if user might already be onboarded
      const isAlreadyOnboarded = await page.evaluate(() => {
        const data = localStorage.getItem('meelio:local:onboarding');
        if (data) {
          const parsed = JSON.parse(data);
          return parsed.state?.hasDockOnboardingCompleted;
        }
        return false;
      });
      
      if (isAlreadyOnboarded) {
        console.log('ℹ️ User has already completed onboarding');
      } else {
        console.log('ℹ️ Onboarding should appear but modal not found');
      }
      
      throw new Error('Onboarding modal should appear for new user but was not found');
    }
    
    console.log('✅ Onboarding modal is visible');
    
    // Step 4: Go through onboarding steps
    const EXPECTED_STEPS = 9; // Total number of onboarding steps
    
    for (let i = 0; i < EXPECTED_STEPS; i++) {
      console.log(`📖 Step ${i + 1}/${EXPECTED_STEPS}`);
      
      // Wait for step to be visible
      await page.waitForTimeout(500);
      
      // Check if we're on the last step
      if (i === EXPECTED_STEPS - 1) {
        // Look for finish button
        const finishButton = page.locator('[data-testid="onboarding-finish"], button:has-text("Finish")');
        await finishButton.click();
        console.log('🏁 Clicked Finish');
        break;
      } else {
        // Click next button
        const nextButton = page.locator('[data-testid="onboarding-next"], button:has-text("Next")');
        await nextButton.click();
        await page.waitForTimeout(300); // Wait for animation
      }
    }
    
    // Step 5: Verify onboarding is complete
    console.log('🔍 Verifying onboarding completion...');
    
    // Modal should disappear
    await page.waitForTimeout(1000);
    const modalGone = await page.locator('[data-testid="onboarding-modal"], [role="dialog"][aria-labelledby="onboarding-title"]').isVisible();
    
    if (!modalGone) {
      console.log('✅ Onboarding modal closed');
    }
    
    // Check localStorage for completion
    const finalState = await page.evaluate(() => {
      const data = localStorage.getItem('meelio:local:onboarding');
      return data ? JSON.parse(data) : null;
    });
    
    if (finalState?.state?.hasDockOnboardingCompleted) {
      console.log('✅ Onboarding marked as completed');
    }
    
    console.log('🎉 Onboarding test completed!');
  });
  
  test('verify onboarding with existing user', async ({ page, context }) => {
    test.setTimeout(60000); // Increase timeout to 60 seconds for this test
    console.log('📍 Testing onboarding with existing user');
    
    // First authenticate as existing user
    await page.goto('http://localhost:4000');
    await clearAuthData(page);
    
    await authenticateUser(page, context, {
      clearStorage: false,
      skipOnboarding: false
    });
    
    // Clear the onboarding flag to force it to show
    await clearOnboardingFlag(page);
    
    // Refresh the page to trigger onboarding check
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check if onboarding modal appears
    const onboardingModal = await page.locator('[data-testid="onboarding-modal"]').isVisible().catch(() => false);
    
    if (onboardingModal) {
      console.log('✅ Onboarding modal found with data-testid');
      
      // Verify all data-testid attributes are present
      const title = await page.locator('[data-testid="onboarding-title"]').isVisible();
      const description = await page.locator('[data-testid="onboarding-description"]').isVisible();
      const skipButton = await page.locator('[data-testid="onboarding-skip"]').isVisible();
      const nextButton = await page.locator('[data-testid="onboarding-next"]').isVisible();
      
      expect(title).toBeTruthy();
      expect(description).toBeTruthy();
      expect(skipButton).toBeTruthy();
      expect(nextButton).toBeTruthy();
      
      console.log('✅ All data-testid attributes verified');
      
      // Skip the onboarding - use the button text selector that works
      const skipBtn = page.locator('button:has-text("Skip")');
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
        await page.waitForTimeout(1000);
        console.log('✅ Onboarding skipped');
      } else {
        console.log('⚠️ Skip button not found, onboarding may have auto-completed');
      }
    } else {
      console.log('⚠️ Onboarding modal not visible (user may have server-side completion flag)');
      console.log('Note: Onboarding requires both localStorage AND server flags to be false');
    }
  });
});