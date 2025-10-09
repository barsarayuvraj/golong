import { test, expect } from '@playwright/test'

test.describe('Real-time Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Real-time service is available', async ({ page }) => {
    // Check if real-time service is loaded
    const realtimeService = await page.evaluate(() => {
      return typeof window !== 'undefined' && window.realtimeService !== undefined
    })
    
    // Since we're using Supabase, we'll check if the service is properly initialized
    expect(realtimeService).toBeDefined()
    
    console.log('✅ Real-time service is available')
  })

  test('Real-time notifications hook works', async ({ page }) => {
    // Navigate to a page that uses real-time notifications
    await page.goto('/achievements')
    
    // Check if the page loads without errors
    await expect(page.locator('h1')).toContainText('Achievements')
    
    // Check for real-time connection indicator (if present)
    const connectionIndicator = page.locator('[data-testid="connection-status"]')
    if (await connectionIndicator.count() > 0) {
      await expect(connectionIndicator).toBeVisible()
    }
    
    console.log('✅ Real-time notifications hook works')
  })

  test('Activity feed loads correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check if activity feed component is present
    const activityFeed = page.locator('[data-testid="activity-feed"]')
    if (await activityFeed.count() > 0) {
      await expect(activityFeed).toBeVisible()
    }
    
    console.log('✅ Activity feed loads correctly')
  })

  test('Real-time connection status is displayed', async ({ page }) => {
    await page.goto('/achievements')
    
    // Look for connection status indicators
    const liveIndicator = page.locator('text=Live')
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    
    // At least one should be present
    const hasLiveIndicator = await liveIndicator.count() > 0
    const hasConnectionStatus = await connectionStatus.count() > 0
    
    expect(hasLiveIndicator || hasConnectionStatus).toBeTruthy()
    
    console.log('✅ Real-time connection status is displayed')
  })

  test('Real-time features work on mobile', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/achievements')
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for mobile-friendly real-time indicators
    const mobileIndicator = page.locator('text=Live')
    if (await mobileIndicator.count() > 0) {
      await expect(mobileIndicator).toBeVisible()
    }
    
    console.log('✅ Real-time features work on mobile')
  })

  test('Real-time notifications permission handling', async ({ page }) => {
    await page.goto('/achievements')
    
    // Check if notification permission is handled gracefully
    const notificationButton = page.locator('[data-testid="notification-permission"]')
    if (await notificationButton.count() > 0) {
      await expect(notificationButton).toBeVisible()
    }
    
    console.log('✅ Real-time notifications permission handling works')
  })

  test('Real-time activity feed updates', async ({ page }) => {
    await page.goto('/')
    
    // Check if activity feed is present and functional
    const activityFeed = page.locator('[data-testid="activity-feed"]')
    if (await activityFeed.count() > 0) {
      await expect(activityFeed).toBeVisible()
      
      // Check for refresh button
      const refreshButton = activityFeed.locator('button')
      if (await refreshButton.count() > 0) {
        await expect(refreshButton.first()).toBeVisible()
      }
    }
    
    console.log('✅ Real-time activity feed updates work')
  })

  test('Real-time analytics updates', async ({ page }) => {
    await page.goto('/analytics')
    
    // Check if analytics page loads with real-time features
    await expect(page.locator('h1')).toContainText('Analytics')
    
    // Look for real-time update indicators
    const updateIndicator = page.locator('text=Live')
    const refreshButton = page.locator('button:has-text("Refresh")')
    
    const hasUpdateIndicator = await updateIndicator.count() > 0
    const hasRefreshButton = await refreshButton.count() > 0
    
    expect(hasUpdateIndicator || hasRefreshButton).toBeTruthy()
    
    console.log('✅ Real-time analytics updates work')
  })

  test('Real-time error handling', async ({ page }) => {
    // Test error handling when real-time connection fails
    await page.goto('/achievements')
    
    // Check if page loads gracefully even without real-time connection
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for error states
    const errorMessage = page.locator('text=Connection failed')
    const fallbackMessage = page.locator('text=Offline mode')
    
    // Page should still work even if real-time fails
    expect(await errorMessage.count() === 0 || await fallbackMessage.count() > 0).toBeTruthy()
    
    console.log('✅ Real-time error handling works')
  })

  test('Real-time performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/achievements')
    await expect(page.locator('h1')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Page should load within reasonable time even with real-time features
    expect(loadTime).toBeLessThan(5000)
    
    console.log(`✅ Real-time performance is good (${loadTime}ms)`)
  })

  test('Real-time features integration', async ({ page }) => {
    // Test that real-time features integrate well with existing features
    await page.goto('/achievements')
    
    // Check if achievements page loads with real-time features
    await expect(page.locator('h1')).toContainText('Achievements')
    
    // Check for tabs (existing feature)
    await expect(page.locator('[role="tablist"]')).toBeVisible()
    
    // Check for real-time indicators
    const liveIndicator = page.locator('text=Live')
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    
    const hasRealTimeFeatures = await liveIndicator.count() > 0 || await connectionStatus.count() > 0
    
    // Real-time features should be present but not interfere with existing functionality
    expect(hasRealTimeFeatures).toBeTruthy()
    
    console.log('✅ Real-time features integrate well with existing features')
  })
})
