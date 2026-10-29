import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isTeacher, loginTeacher, logoutTeacher } from '@/app/lib/auth'
import { btn } from '@/app/lib/ui'

export default async function EditLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const teacher = await isTeacher()

  async function login(formData: FormData) {
    'use server'
    const ok = await loginTeacher(String(formData.get('password') ?? ''))
    redirect(ok ? '/edit' : '/edit?error=1')
  }
  async function logout() {
    'use server'
    await logoutTeacher()
    redirect('/edit')
  }


  return (
    <main className="max-w-sm mx-auto px-4 py-24 text-gray-900 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">Teacher login</h1>
      {teacher ? (
        <div className="space-y-4">
          <p>You&apos;re logged in. Use the edit mode button in the header of any word page.</p>
          <div className="flex gap-3">
            <Link href="/" className={btn}>Back to search</Link>
            <form action={logout}><button className={btn}>Log out</button></form>
          </div>
        </div>
      ) : (
        <form action={login} className="space-y-4">
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoFocus
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2"
          />
          {error && <p className="text-sm text-red-500">Wrong password.</p>}
          <button className={btn}>Log in</button>
        </form>
      )}
    </main>
  )
}
