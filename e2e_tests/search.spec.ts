import { test, expect } from '@playwright/test'

// Change this to a word that exists in your database
const QUERY = '水'

test('search finds a word and opens its page', async ({ page }) => {
  await page.goto('/')
  const box = page.getByPlaceholder(/Search hanzi/)
  const wordLink = page
    .locator('a[href^="/word/"]')
    .filter({ has: page.getByText(QUERY, { exact: true }) })
    .first()

  await expect(async () => {
    await box.fill('')
    await box.fill(QUERY)
    await expect(wordLink).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 20_000 })

  await wordLink.click()
  await expect(page).toHaveURL(/\/word\/\d+/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(QUERY)
})

test('shows a message when nothing matches', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  const box = page.getByPlaceholder(/Search hanzi/)

  // retry until the page has hydrated and the search request really fires
  await expect(async () => {
    const searched = page.waitForResponse(
      (r) => r.url().includes('/api/search') && r.ok(),
      { timeout: 5000 }
    )
    await box.fill('')
    await box.fill('zzzzqqqq')
    await searched
  }).toPass({ timeout: 30_000 })

  await expect(page.getByText('No results')).toBeVisible()
})

test('an exact hanzi match is ranked first', async ({ request }) => {
  const res = await request.get('/api/search?q=水')
  const { words } = await res.json()
  expect(words[0].hanzi).toBe('水')
})

test('?lang=gr switches the interface to Greek', async ({ page }) => {
  await page.goto('/?lang=gr')
  await expect(page.getByPlaceholder(/Αναζήτηση/)).toBeVisible()
})
