import { test, expect } from '@playwright/test'

test.describe('Check-in System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test('Check-in API endpoint works', async ({ request }) => {
    // Test the check-in API endpoint directly
    const response = await request.post('http://localhost:3000/api/checkins', {
      data: {
        streak_id: 'test-streak-id',
        checkin_date: new Date().toISOString().split('T')[0]
      }
    })

    // Should return 401 since we're not authenticated
    expect(response.status()).toBe(401)
  })

  test('Calendar page loads with check-in functionality', async ({ page }) => {
    // Navigate to calendar page
    await page.goto('http://localhost:3000/calendar')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if calendar component is present
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    // Check if stats cards are present
    await expect(page.locator('text=Current Streak')).toBeVisible()
    await expect(page.locator('text=Longest Streak')).toBeVisible()
    await expect(page.locator('text=Total Check-ins')).toBeVisible()
  })

  test('Streak detail page has check-in button', async ({ page }) => {
    // Navigate to a streak detail page (using a mock ID)
    await page.goto('http://localhost:3000/streaks/test-streak-id')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if check-in button is present
    const checkInButton = page.locator('button:has-text("Check In")')
    await expect(checkInButton).toBeVisible()
  })

  test('Mobile check-in functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Navigate to calendar page
    await page.goto('http://localhost:3000/calendar')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if mobile calendar is responsive
    await expect(page.locator('.calendar-container')).toBeVisible()
    
    // Check if stats cards are properly sized for mobile
    const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-4')
    await expect(statsGrid).toBeVisible()
  })

  test('Check-in form validation', async ({ page }) => {
    // Navigate to calendar page
    await page.goto('http://localhost:3000/calendar')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Try to interact with check-in buttons (should show auth required)
    const checkInButtons = page.locator('button:has-text("Check In")')
    if (await checkInButtons.count() > 0) {
      await checkInButtons.first().click()
      
      // Should either work or show auth message
      await page.waitForTimeout(1000)
    }
  })

  test('Calendar date selection works', async ({ page }) => {
    // Navigate to calendar page
    await page.goto('http://localhost:3000/calendar')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Click on a date in the calendar
    const calendarTile = page.locator('.react-calendar__tile').first()
    await calendarTile.click()
    
    // Check if selected date details are shown
    await expect(page.locator('text=Selected Date')).toBeVisible()
  })

  test('Streak filtering in calendar', async ({ page }) => {
    // Navigate to calendar page
    await page.goto('http://localhost:3000/calendar')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
    
    // Check if streak filter dropdown is present
    const filterSelect = page.locator('select, [role="combobox"]')
    await expect(filterSelect).toBeVisible()
  })
})
