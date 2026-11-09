import { test, expect, type Page } from '@playwright/test'
import { createHmac } from 'crypto'

const WORD_ID = 1 // used by the read-only tests
const BASE = 'http://localhost:3000'
const secret = process.env.AUTH_SECRET

// One word per browser, so parallel runs never touch the same row.
// Each id must exist in the test database and have at least one meaning.
const EDIT_WORD_IDS = { chromium: 1, firefox: 2, webkit: 3 } as const

const teacherCookie = () => ({
  name: 'auth',
  value: createHmac('sha256', secret!).update('teacher').digest('hex'),
  url: BASE,
})

test.skip(!secret, 'AUTH_SECRET is not set')

// Types into the first English textarea and saves. Retries until the editor
// has hydrated and the Save button actually becomes enabled.
async function saveEnglish(page: Page, text: string) {
  const english = page.locator('textarea').first()
  const save = page.getByRole('button', { name: 'Save', exact: true })

  await expect(async () => {
    await english.fill('')
    await english.fill(text)
    await expect(save).toBeEnabled({ timeout: 2000 })
  }).toPass({ timeout: 20_000 })

  await save.click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
}

test.describe('anonymous visitors', () => {
  test('do not see the edit toggle', async ({ page }) => {
    await page.goto(`/word/${WORD_ID}`)
    await expect(page.getByRole('button', { name: /^Edit:/ })).toHaveCount(0)
  })

  test('cannot get the editor by setting editmode alone', async ({ page, context }) => {
    await context.addCookies([{ name: 'editmode', value: '1', url: BASE }])
    await page.goto(`/word/${WORD_ID}`)
    await expect(page.locator('textarea')).toHaveCount(0)
  })
})

test.describe('teacher mode', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([teacherCookie()])
  })

  test('toggle turns edit mode on and shows the editor', async ({ page }) => {
    await page.goto(`/word/${WORD_ID}`)
    await page.getByRole('button', { name: 'Edit: OFF' }).click()
    await expect(page.getByRole('button', { name: 'Edit: ON' })).toBeVisible()
    await expect(page.locator('textarea').first()).toBeVisible()
  })
})

test.describe('teacher saving', () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([teacherCookie()])
  })

  test('editing a meaning persists after reload', async ({ page, browserName }) => {
    test.setTimeout(90_000)
    const wordId = EDIT_WORD_IDS[browserName]

    await page.goto(`/word/${wordId}`)
    await page.getByRole('button', { name: 'Edit: OFF' }).click()

    const english = page.locator('textarea').first()
    await expect(english).toBeVisible()
    const original = await english.inputValue()
    const edited = `${original} (e2e ${browserName})`

    try {
      await saveEnglish(page, edited)

      await page.reload()
      await expect(page.locator('textarea').first()).toHaveValue(edited)
    } finally {
      // only restore if the database still holds the edited text
      if ((await english.inputValue()) !== original) {
        await saveEnglish(page, original)
      }
    }
  })
})
