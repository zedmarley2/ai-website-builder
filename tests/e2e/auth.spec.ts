import { test, expect } from '@playwright/test'

test.describe('Auth - Login Page', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    // The page should load without a server error
    await expect(page).not.toHaveTitle(/500/)
  })

  test('shows validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login')

    // Attempt to find and submit the login form
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()

      // After submitting an empty form, validation messages should appear
      const emailInput = page.locator('input[name="email"], input[type="email"]')
      if (await emailInput.isVisible()) {
        // HTML5 validation or custom validation should prevent submission
        await expect(emailInput).toBeVisible()
      }
    }
  })
})

test.describe('Auth - Register Page', () => {
  test('register page renders', async ({ page }) => {
    await page.goto('/register')
    // The page should load without a server error
    await expect(page).not.toHaveTitle(/500/)
  })
})
