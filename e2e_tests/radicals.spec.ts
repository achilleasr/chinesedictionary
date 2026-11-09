import { test, expect } from '@playwright/test'

test('radicals index lists radicals and opens one', async ({ page }) => {
  await page.goto('/radicals')
  await expect(
    page.getByRole('heading', { level: 1, name: 'All radicals' })
  ).toBeVisible()

  await page.locator('a[href^="/radical/"]').first().click()
  await expect(page).toHaveURL(/\/radical\/\d+/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('radical page links back to the index', async ({ page }) => {
  await page.goto('/radical/1')
  await page.getByRole('link', { name: 'All radicals' }).click()
  await expect(page).toHaveURL(/\/radicals$/)
})

test('non-numeric radical id returns 404', async ({ page }) => {
  const res = await page.goto('/radical/abc')
  expect(res?.status()).toBe(404)
})

test('radicals index is translated with ?lang=gr', async ({ page }) => {
  await page.goto('/radicals?lang=gr')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Όλα τα ριζικά' })
  ).toBeVisible()
})
