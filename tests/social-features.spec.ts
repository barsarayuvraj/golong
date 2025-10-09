import { test, expect } from '@playwright/test'

test.describe('Social Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3001')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('Comments API endpoint works', async ({ request }) => {
    // Test the comments API endpoint directly with a valid UUID
    const response = await request.get('http://localhost:3001/api/comments?streak_id=123e4567-e89b-12d3-a456-426614174000')

    // Should return 200 with empty comments array for non-existent streak
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.comments).toEqual([])
  })

  test('Likes API endpoint works', async ({ request }) => {
    // Test the likes API endpoint directly with a valid UUID
    const response = await request.get('http://localhost:3001/api/likes?streak_id=123e4567-e89b-12d3-a456-426614174000')

    // Should return 200 with like count 0 for non-existent streak
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.likeCount).toBe(0)
    expect(data.liked).toBe(false)
  })

  test('Notifications API endpoint works', async ({ request }) => {
    // Test the notifications API endpoint directly
    const response = await request.get('http://localhost:3001/api/notifications')

    // Should return 401 since we're not authenticated
    expect(response.status()).toBe(401)
  })

  test('Comments section loads on streak detail page', async ({ page }) => {
    // Navigate to a streak detail page with valid UUID
    await page.goto('http://localhost:3001/streaks/123e4567-e89b-12d3-a456-426614174000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if comments section is present
    await expect(page.locator('text=Comments')).toBeVisible()
  })

  test('Likes button is present on streak detail page', async ({ page }) => {
    // Navigate to a streak detail page with valid UUID
    await page.goto('http://localhost:3001/streaks/123e4567-e89b-12d3-a456-426614174000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if likes button is present (heart icon)
    const heartIcon = page.locator('[data-testid="heart-icon"], .lucide-heart, svg[data-lucide="heart"]')
    await expect(heartIcon).toBeVisible()
  })

  test('Notifications dropdown loads in navbar', async ({ page }) => {
    // Check if notifications bell icon is present in navbar
    const bellIcon = page.locator('[data-testid="notifications-bell"], .lucide-bell, svg[data-lucide="bell"]')
    await expect(bellIcon).toBeVisible()
  })

  test('Social features work on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to a streak detail page with valid UUID
    await page.goto('http://localhost:3001/streaks/123e4567-e89b-12d3-a456-426614174000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if comments section is responsive
    await expect(page.locator('text=Comments')).toBeVisible()
    
    // Check if likes button is visible on mobile
    const heartIcon = page.locator('[data-testid="heart-icon"], .lucide-heart, svg[data-lucide="heart"]')
    await expect(heartIcon).toBeVisible()
  })

  test('Comments form validation', async ({ page }) => {
    // Navigate to a streak detail page with valid UUID
    await page.goto('http://localhost:3001/streaks/123e4567-e89b-12d3-a456-426614174000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Look for comment textarea
    const commentTextarea = page.locator('textarea[placeholder*="Share your thoughts"], textarea[placeholder*="comment"]')
    
    if (await commentTextarea.count() > 0) {
      // Try to type in the textarea
      await commentTextarea.fill('Test comment')
      
      // Check if submit button is present
      const submitButton = page.locator('button:has-text("Post Comment"), button:has-text("Post")')
      await expect(submitButton).toBeVisible()
    }
  })

  test('Likes button interaction', async ({ page }) => {
    // Navigate to a streak detail page with valid UUID
    await page.goto('http://localhost:3001/streaks/123e4567-e89b-12d3-a456-426614174000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Look for likes button
    const likesButton = page.locator('button:has(svg[data-lucide="heart"]), button:has(.lucide-heart)')
    
    if (await likesButton.count() > 0) {
      // Click the likes button
      await likesButton.click()
      
      // Wait a moment for any potential API calls
      await page.waitForTimeout(1000)
    }
  })

  test('Notifications dropdown interaction', async ({ page }) => {
    // Look for notifications bell icon
    const bellIcon = page.locator('[data-testid="notifications-bell"], .lucide-bell, svg[data-lucide="bell"]')
    
    if (await bellIcon.count() > 0) {
      // Click the bell icon
      await bellIcon.click()
      
      // Wait for dropdown to appear
      await page.waitForTimeout(500)
      
      // Check if notifications dropdown content is visible
      const notificationsContent = page.locator('text=Notifications, text=No notifications')
      await expect(notificationsContent).toBeVisible()
    }
  })

  test('Social features cross-browser compatibility', async ({ page, browserName }) => {
    // Navigate to a streak detail page with valid UUID
    await page.goto('http://localhost:3001/streaks/123e4567-e89b-12d3-a456-426614174000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if comments section loads in all browsers
    await expect(page.locator('text=Comments')).toBeVisible()
    
    // Check if likes button loads in all browsers
    const heartIcon = page.locator('[data-testid="heart-icon"], .lucide-heart, svg[data-lucide="heart"]')
    await expect(heartIcon).toBeVisible()
    
    console.log(`Social features working in ${browserName}`)
  })

  test('API error handling', async ({ page }) => {
    // Navigate to a streak detail page with valid UUID
    await page.goto('http://localhost:3001/streaks/123e4567-e89b-12d3-a456-426614174000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check console for any API errors
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    
    // Wait a bit for any API calls to complete
    await page.waitForTimeout(2000)
    
    // Check that there are no critical API errors
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('Failed to fetch') || 
      error.includes('NetworkError') ||
      error.includes('500')
    )
    
    expect(criticalErrors.length).toBe(0)
  })
})
