import Link from 'next/link'
import DictionarySearch from './components/DictionarySearch'
import { dict, langQs, LangToggle, parseLang } from '@/app/lib/i18n'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>
}) {
  const { lang: langParam } = await searchParams
  const lang = parseLang(langParam)
  const t = dict[lang]
  const qs = langQs(lang)

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link href={`/words${qs}`} className="text-sm text-gray-400 hover:text-red-500">
          {t.browseIndex}
        </Link>
        <LangToggle path="/" lang={lang} />
      </div>
      <div className="max-w-2xl mx-auto my-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          中文词典
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Chinese · Greek · English
        </p>
      </div>
      <DictionarySearch
        lang={lang}
        placeholder={t.searchPlaceholder}
        noResultsText={t.noResults}
      />
    </main>
  )
}
