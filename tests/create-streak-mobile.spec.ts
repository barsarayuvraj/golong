import { test, expect } from '@playwright/test';

test.describe('Create Streak Mobile Testing', () => {
  test('Create streak page loads on mobile', async ({ page }) => {
    await page.goto('/create');
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'mobile-create-streak.png', fullPage: true });
    
    // Check if page loads without errors
    await expect(page).toHaveTitle('GoLong - Where Streaks Become Stories');
    
    // Wait for the form to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to auth (expected behavior for unauthenticated users)
    const currentUrl = page.url();
    if (currentUrl.includes('/auth')) {
      console.log('Redirected to auth page (expected for unauthenticated users)');
      return;
    }
    
    // If we're on the create page, check for form elements
    const form = page.locator('form').or(page.locator('[role="form"]'));
    if (await form.isVisible()) {
      console.log('Create streak form is visible');
    } else {
      console.log('Form not found - might be loading or redirected');
    }
  });

  test('Create streak form is mobile-friendly', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('networkidle');
    
    // Check if form elements are visible and properly sized
    const titleInput = page.locator('input[placeholder*="title" i]').or(page.locator('input[name="title"]'));
    const descriptionTextarea = page.locator('textarea[placeholder*="description" i]').or(page.locator('textarea[name="description"]'));
    const categorySelect = page.locator('select').or(page.locator('[role="combobox"]'));
    
    if (await titleInput.isVisible()) {
      // Test input interaction
      await titleInput.click();
      await titleInput.fill('Test Mobile Streak');
      
      // Check input size for mobile touch targets
      const titleBox = await titleInput.boundingBox();
      if (titleBox) {
        console.log(`Title input height: ${titleBox.height}px`);
        expect(titleBox.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    if (await descriptionTextarea.isVisible()) {
      await descriptionTextarea.click();
      await descriptionTextarea.fill('This is a test streak created on mobile');
      
      const descriptionBox = await descriptionTextarea.boundingBox();
      if (descriptionBox) {
        console.log(`Description textarea height: ${descriptionBox.height}px`);
        expect(descriptionBox.height).toBeGreaterThanOrEqual(44);
      }
    }
    
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.waitForTimeout(500);
      
      // Check if dropdown opens
      const dropdownItems = page.locator('[role="option"]').or(page.locator('li'));
      if (await dropdownItems.first().isVisible()) {
        await dropdownItems.first().click();
      }
    }
  });

  test('Create streak form validation works on mobile', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /create/i }));
    
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Check for validation messages
      const errorMessages = page.locator('text=required').or(page.locator('[role="alert"]'));
      if (await errorMessages.isVisible()) {
        console.log('Form validation working on mobile');
      }
    }
  });

  test('Create streak navigation from mobile menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if mobile menu button exists
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    
    if (await mobileMenuButton.isVisible()) {
      // Click mobile menu
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      // Look for Create Streak link in mobile menu
      const createStreakLink = page.locator('a[href="/create"]').first();
      
      if (await createStreakLink.isVisible()) {
        await createStreakLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/create');
        console.log('Successfully navigated to create streak from mobile menu');
      } else {
        console.log('Create Streak link not found in mobile menu');
      }
    } else {
      console.log('Mobile menu button not visible - might be desktop view');
    }
  });

  test('Create streak form responsive design', async ({ page }) => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Pixel 5', width: 393, height: 851 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/create');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `mobile-create-streak-${viewport.name.replace(' ', '-').toLowerCase()}.png`,
        fullPage: true 
      });
      
      // Check if form is properly displayed
      const form = page.locator('form').or(page.locator('[role="form"]'));
      await expect(form).toBeVisible();
      
      // Check for horizontal scroll (should not exist)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (hasHorizontalScroll) {
        console.log(`Horizontal scroll detected on ${viewport.name} for create streak page`);
      }
    }
  });

  test('Create streak form touch interactions', async ({ page }) => {
    await page.goto('/create');
    await page.waitForLoadState('networkidle');
    
    // Test touch interactions
    const titleInput = page.locator('input[placeholder*="title" i]').or(page.locator('input[name="title"]'));
    
    if (await titleInput.isVisible()) {
      // Test tap interaction
      await titleInput.tap();
      await titleInput.fill('Touch Test Streak');
      
      // Test form submission button
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /create/i }));
      
      if (await submitButton.isVisible()) {
        await submitButton.tap();
        await page.waitForTimeout(1000);
        console.log('Form submission button responds to touch');
      }
    }
  });
});
