import DictionarySearch from './components/DictionarySearch'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <Link href="/index" className="text-sm text-gray-400 hover:text-red-500">
        Browse full index →
      </Link>
      <div className="max-w-2xl mx-auto mb-10 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          中文词典
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Chinese · Greek · English
        </p>
      </div>
      <DictionarySearch />
    </main>
  )
}
