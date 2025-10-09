import { test, expect } from '@playwright/test'

test.describe('Advanced Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Achievements API works correctly', async ({ page }) => {
    // Test achievements API endpoint
    const response = await page.request.get('/api/achievements')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('achievements')
    expect(data).toHaveProperty('earnedAchievements')
    expect(data).toHaveProperty('totalPoints')
    expect(data).toHaveProperty('totalEarned')
    expect(data).toHaveProperty('totalAvailable')
    
    console.log('✅ Achievements API working correctly')
  })

  test('Analytics API works correctly', async ({ page }) => {
    // Test analytics API endpoint
    const response = await page.request.get('/api/analytics?timeRange=month')
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('analytics')
    expect(data.analytics).toHaveProperty('overview')
    expect(data.analytics).toHaveProperty('streaksByCategory')
    expect(data.analytics).toHaveProperty('monthlyData')
    expect(data.analytics).toHaveProperty('weeklyData')
    expect(data.analytics).toHaveProperty('dailyPatterns')
    expect(data.analytics).toHaveProperty('topStreaks')
    expect(data.analytics).toHaveProperty('recentActivity')
    expect(data.analytics).toHaveProperty('insights')
    
    console.log('✅ Analytics API working correctly')
  })

  test('Export API works correctly', async ({ page }) => {
    // Test export API endpoint
    const response = await page.request.post('/api/export', {
      data: {
        format: 'json',
        includeCharts: true,
        includeAchievements: true,
        includeCheckins: true,
        dateRange: 'month'
      }
    })
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('data')
    expect(data.data).toHaveProperty('exportInfo')
    expect(data.data).toHaveProperty('userInfo')
    expect(data.data).toHaveProperty('streaks')
    expect(data.data).toHaveProperty('checkins')
    expect(data.data).toHaveProperty('achievements')
    expect(data.data).toHaveProperty('charts')
    
    console.log('✅ Export API working correctly')
  })

  test('Achievements page loads correctly', async ({ page }) => {
    await page.goto('/achievements')
    
    // Check if page loads
    await expect(page).toHaveTitle(/Achievements/)
    
    // Check for achievement elements
    await expect(page.locator('h1')).toContainText('Achievements')
    
    // Check for tabs
    await expect(page.locator('[role="tablist"]')).toBeVisible()
    
    console.log('✅ Achievements page loads correctly')
  })

  test('Analytics page loads correctly', async ({ page }) => {
    await page.goto('/analytics')
    
    // Check if page loads
    await expect(page).toHaveTitle(/Analytics/)
    
    // Check for analytics elements
    await expect(page.locator('h1')).toContainText('Analytics')
    
    // Check for time range selector
    await expect(page.locator('select')).toBeVisible()
    
    console.log('✅ Analytics page loads correctly')
  })

  test('Export page loads correctly', async ({ page }) => {
    await page.goto('/export')
    
    // Check if page loads
    await expect(page).toHaveTitle(/Export/)
    
    // Check for export elements
    await expect(page.locator('h1')).toContainText('Export')
    
    // Check for export options
    await expect(page.locator('button:has-text("Export Data")')).toBeVisible()
    
    console.log('✅ Export page loads correctly')
  })

  test('Achievement calculation logic works', async ({ page }) => {
    // Test achievement calculation with POST request
    const response = await page.request.post('/api/achievements', {
      data: {
        user_id: '123e4567-e89b-12d3-a456-426614174000'
      }
    })
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('newAchievements')
    expect(data).toHaveProperty('totalEarned')
    expect(data).toHaveProperty('message')
    
    console.log('✅ Achievement calculation logic working')
  })

  test('Analytics with different time ranges', async ({ page }) => {
    const timeRanges = ['week', 'month', 'year', 'all']
    
    for (const timeRange of timeRanges) {
      const response = await page.request.get(`/api/analytics?timeRange=${timeRange}`)
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data.analytics.timeRange).toBe(timeRange)
      
      console.log(`✅ Analytics API works for ${timeRange} time range`)
    }
  })

  test('Export with different formats', async ({ page }) => {
    const formats = ['json', 'csv']
    
    for (const format of formats) {
      const response = await page.request.post('/api/export', {
        data: {
          format,
          includeCharts: true,
          includeAchievements: true,
          includeCheckins: true,
          dateRange: 'month'
        }
      })
      
      expect(response.status()).toBe(200)
      
      if (format === 'csv') {
        // Check CSV content type
        expect(response.headers()['content-type']).toContain('text/csv')
      } else {
        // Check JSON response
        const data = await response.json()
        expect(data).toHaveProperty('data')
      }
      
      console.log(`✅ Export API works for ${format} format`)
    }
  })

  test('Advanced features mobile responsiveness', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Test achievements page on mobile
    await page.goto('/achievements')
    await expect(page.locator('h1')).toBeVisible()
    
    // Test analytics page on mobile
    await page.goto('/analytics')
    await expect(page.locator('h1')).toBeVisible()
    
    // Test export page on mobile
    await page.goto('/export')
    await expect(page.locator('h1')).toBeVisible()
    
    console.log('✅ Advanced features are mobile responsive')
  })

  test('Error handling in advanced features', async ({ page }) => {
    // Test invalid user ID in achievements
    const response = await page.request.post('/api/achievements', {
      data: {
        user_id: 'invalid-uuid'
      }
    })
    
    expect(response.status()).toBe(400)
    
    // Test invalid time range in analytics
    const analyticsResponse = await page.request.get('/api/analytics?timeRange=invalid')
    expect(analyticsResponse.status()).toBe(400)
    
    // Test invalid format in export
    const exportResponse = await page.request.post('/api/export', {
      data: {
        format: 'invalid'
      }
    })
    expect(exportResponse.status()).toBe(400)
    
    console.log('✅ Error handling works correctly')
  })
})
