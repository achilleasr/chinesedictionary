import { isTeacher, isEditing } from '@/app/lib/auth'
import { toggleEditMode } from '@/app/admin/actions'

export default async function EditToggle() {
  if (!(await isTeacher())) return null
  const editing = await isEditing()
  return (
    <form action={toggleEditMode.bind(null, !editing)}>
      <button
        className={`text-sm px-2 py-1 rounded border ${
          editing
            ? 'border-red-500 text-red-500'
            : 'border-gray-300 dark:border-gray-700 text-gray-400 hover:text-red-500'
        }`}
      >
        Edit: {editing ? 'ON' : 'OFF'}
      </button>
    </form>
  )
}
