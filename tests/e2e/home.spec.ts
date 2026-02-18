import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Create Next App/)
  })

  test('hero section is visible', async ({ page }) => {
    await page.goto('/')
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('To get started')
  })

  test('CTA buttons are present', async ({ page }) => {
    await page.goto('/')
    const deployLink = page.locator('a', { hasText: 'Deploy Now' })
    const docsLink = page.locator('a', { hasText: 'Documentation' })
    await expect(deployLink).toBeVisible()
    await expect(docsLink).toBeVisible()
  })

  test('navigation links work', async ({ page }) => {
    await page.goto('/')
    const templatesLink = page.locator('a', { hasText: 'Templates' })
    await expect(templatesLink).toBeVisible()
    await expect(templatesLink).toHaveAttribute('href', /vercel\.com\/templates/)

    const learningLink = page.locator('a', { hasText: 'Learning' })
    await expect(learningLink).toBeVisible()
    await expect(learningLink).toHaveAttribute('href', /nextjs\.org\/learn/)
  })
})
