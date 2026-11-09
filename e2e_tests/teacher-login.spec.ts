import { test, expect } from '@playwright/test'

const password = process.env.TEACHER_PASSWORD

test.skip(!password, 'TEACHER_PASSWORD is not set')
// test.skip(
//   ({ browserName }) => browserName !== 'chromium',
//   'auth cookie is Secure in production builds; WebKit rejects it over http'
// )

test('wrong password shows an error and does not log in', async ({ page }) => {
  await page.goto('/edit')
  await page.getByPlaceholder('Password').fill('definitely-not-the-password')
  await page.getByRole('button', { name: 'Log in' }).click()

  await expect(page).toHaveURL(/\/edit\?error=1/)
  await expect(page.getByText('Wrong password.')).toBeVisible()

  // still logged out: no edit toggle on a word page
  await page.goto('/word/1')
  await expect(page.getByRole('button', { name: /^Edit:/ })).toHaveCount(0)
})

test('correct password logs in, enables the toggle, and logout reverses it', async ({ page }) => {
  await page.goto('/edit')
  await page.getByPlaceholder('Password').fill(password!)
  await page.getByRole('button', { name: 'Log in' }).click()
  await expect(page.getByText(/You.re logged in/)).toBeVisible()

  await page.goto('/word/1')
  await expect(page.getByRole('button', { name: 'Edit: OFF' })).toBeVisible()

  await page.goto('/edit')
  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByPlaceholder('Password')).toBeVisible() // only shown when logged out

  await page.goto('/word/1')
  await expect(page.getByRole('button', { name: /^Edit:/ })).toHaveCount(0)
})
