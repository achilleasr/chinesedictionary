import { test, expect } from '@playwright/test'

test('non-numeric word id returns 404', async ({ page }) => {
  const res = await page.goto('/word/abc')
  expect(res?.status()).toBe(404)
})

test('out-of-range radical id returns 404, not 500', async ({ page }) => {
  const res = await page.goto('/radical/999999')
  expect(res?.status()).toBe(404)
})

test('unknown word id returns 404', async ({ page }) => {
  const res = await page.goto('/word/999999999')
  expect(res?.status()).toBe(404)
})
