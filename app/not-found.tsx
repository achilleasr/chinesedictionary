import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-7xl font-bold text-red-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-gray-400">Η σελίδα δεν βρέθηκε</p>
      <Link
        href="/"
        className="mt-8 inline-block rounded border border-gray-700 px-4 py-2 text-gray-400 hover:border-red-500 hover:text-red-500"
      >
        ← Back to search
      </Link>
    </main>
  )
}
