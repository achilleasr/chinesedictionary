export default function HighlightedText({
  text,
  target,
}: {
  text: string
  target: string
}) {
  if (!target) return <>{text}</>
  const parts = text.split(target)

  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span className="text-red-500 font-semibold">{target}</span>
          )}
        </span>
      ))}
    </>
  )
}
