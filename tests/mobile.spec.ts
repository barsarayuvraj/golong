import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness Tests', () => {
  test('Homepage loads correctly on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle('GoLong - Where Streaks Become Stories');
    
    // Check if the main heading is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check if the hero section is properly displayed
    await expect(page.locator('text=Go Long on Your')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Streaks');
  });

  test('Mobile navigation works correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if mobile menu button is visible on mobile
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]').or(page.locator('button:has-text("Menu")'));
    
    if (await mobileMenuButton.isVisible()) {
      // Click mobile menu button
      await mobileMenuButton.click();
      
      // Check if mobile menu opens
      await expect(page.locator('text=Explore')).toBeVisible();
      await expect(page.locator('text=Create Streak')).toBeVisible();
      
      // Test navigation links
      await page.click('text=Explore');
      await expect(page).toHaveURL('/explore');
    }
  });

  test('Responsive design adapts to different screen sizes', async ({ page }) => {
    // Test iPhone size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if content is properly sized for mobile
    const heroText = page.locator('h1');
    await expect(heroText).toBeVisible();
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(heroText).toBeVisible();
    
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await expect(heroText).toBeVisible();
  });

  test('Touch interactions work on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Test button interactions
    const getStartedButton = page.locator('button:has-text("Get Started")').first();
    const exploreButton = page.locator('button:has-text("Explore Streaks")').first();
    
    if (await getStartedButton.isVisible()) {
      await getStartedButton.tap();
      // Should navigate to auth page
      await page.waitForLoadState('networkidle');
    } else if (await exploreButton.isVisible()) {
      await exploreButton.tap();
      // Should navigate to explore page
      await page.waitForLoadState('networkidle');
    }
  });

  test('Mobile performance is acceptable', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Page should load within 3 seconds on mobile
    expect(loadTime).toBeLessThan(3000);
    
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should have no critical errors
    expect(errors.filter(error => error.includes('Failed to load') || error.includes('404'))).toHaveLength(0);
  });

  test('Mobile forms are usable', async ({ page }) => {
    await page.goto('/auth');
    
    // Check if auth form is mobile-friendly
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.isVisible()) {
      // Test form interaction
      await emailInput.tap();
      await emailInput.fill('test@example.com');
      
      if (await passwordInput.isVisible()) {
        await passwordInput.tap();
        await passwordInput.fill('password123');
      }
      
      // Check if form elements are properly sized for mobile
      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      
      if (emailBox && passwordBox) {
        // Input fields should be at least 44px tall for mobile touch targets
        expect(emailBox.height).toBeGreaterThanOrEqual(44);
        expect(passwordBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Mobile scrolling works smoothly', async ({ page }) => {
    await page.goto('/');
    
    // Test smooth scrolling
    await page.evaluate(() => {
      window.scrollTo({ top: 1000, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(1000);
    
    // Check if we can scroll back to top
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    await page.waitForTimeout(1000);
    
    // Verify we're back at the top
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeLessThan(100);
  });
});
