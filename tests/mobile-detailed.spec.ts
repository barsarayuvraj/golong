import { test, expect } from '@playwright/test';

test.describe('Comprehensive Mobile Testing', () => {
  test('Mobile homepage visual inspection', async ({ page }) => {
    await page.goto('/');
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'mobile-homepage.png', fullPage: true });
    
    // Check if page loads without errors
    await expect(page).toHaveTitle('GoLong - Where Streaks Become Stories');
    
    // Check console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Log any errors found
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    // Check if main content is visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Go Long on Your')).toBeVisible();
  });

  test('Mobile navigation functionality', async ({ page }) => {
    await page.goto('/');
    
    // Check if mobile menu button exists
    const mobileMenuButton = page.locator('button:has-text("Menu")').or(page.locator('[data-testid="mobile-menu-button"]'));
    
    if (await mobileMenuButton.isVisible()) {
      // Click mobile menu
      await mobileMenuButton.click();
      await page.waitForTimeout(500);
      
      // Check if menu opens
      const exploreLink = page.locator('text=Explore');
      if (await exploreLink.isVisible()) {
        await exploreLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/explore');
      }
    } else {
      console.log('Mobile menu button not found - might be desktop view');
    }
  });

  test('Mobile form interactions', async ({ page }) => {
    await page.goto('/auth');
    
    // Take screenshot of auth page
    await page.screenshot({ path: 'mobile-auth.png', fullPage: true });
    
    // Check if form elements are visible and properly sized
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.isVisible()) {
      // Test input interaction
      await emailInput.click();
      await emailInput.fill('test@example.com');
      
      // Check input size
      const emailBox = await emailInput.boundingBox();
      if (emailBox) {
        console.log(`Email input height: ${emailBox.height}px`);
        expect(emailBox.height).toBeGreaterThanOrEqual(44);
      }
      
      if (await passwordInput.isVisible()) {
        await passwordInput.click();
        await passwordInput.fill('password123');
        
        const passwordBox = await passwordInput.boundingBox();
        if (passwordBox) {
          console.log(`Password input height: ${passwordBox.height}px`);
          expect(passwordBox.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('Mobile performance and loading', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check for slow resources
    const requests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        duration: r.duration,
        size: r.transferSize
      }));
    });
    
    const slowRequests = requests.filter(r => r.duration > 1000);
    if (slowRequests.length > 0) {
      console.log('Slow requests found:', slowRequests);
    }
  });

  test('Mobile responsive breakpoints', async ({ page }) => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12', width: 390, height: 844 },
      { name: 'Pixel 5', width: 393, height: 851 },
      { name: 'iPad', width: 768, height: 1024 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot for each viewport
      await page.screenshot({ 
        path: `mobile-${viewport.name.replace(' ', '-').toLowerCase()}.png`,
        fullPage: true 
      });
      
      // Check if content is properly displayed
      const heroText = page.locator('h1');
      await expect(heroText).toBeVisible();
      
      // Check for horizontal scroll (should not exist)
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      if (hasHorizontalScroll) {
        console.log(`Horizontal scroll detected on ${viewport.name}`);
      }
    }
  });

  test('Mobile touch gestures', async ({ page }) => {
    await page.goto('/');
    
    // Test swipe gestures
    await page.touchscreen.tap(200, 300);
    await page.waitForTimeout(100);
    
    // Test scroll
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    
    // Test button tap
    const getStartedButton = page.locator('button:has-text("Get Started")').first();
    const exploreButton = page.locator('button:has-text("Explore Streaks")').first();
    
    if (await getStartedButton.isVisible()) {
      await getStartedButton.tap();
      await page.waitForLoadState('networkidle');
    } else if (await exploreButton.isVisible()) {
      await exploreButton.tap();
      await page.waitForLoadState('networkidle');
    }
  });
});
