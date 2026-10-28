import Link from "next/link";
import { pool } from "@/app/lib/database";

type Radical = {
  id: number;
  character: string;
  meaning_gr: string | null;
  meaning_en: string | null;
  pinyin: string | null;
  stroke_count: number | null;
  variants: string | null;
};

export default async function RadicalsPage() {
  const { rows } = await pool.query<Radical>(
    "SELECT * FROM radicals ORDER BY stroke_count NULLS LAST, id"
  );

  // Group by stroke count
  const groups = new Map<number | null, Radical[]>();
  for (const r of rows) {
    if (!groups.has(r.stroke_count)) groups.set(r.stroke_count, []);
    groups.get(r.stroke_count)!.push(r);
  }

  return (
    <main className=" min-h-screen max-w-6xl bg-black px-4 pb-16 pt-6 text-slate-900 sm:px-8  dark:text-slate-100">
      <nav className="mb-6">
        <Link
          href="/"
          className="inline-block rounded py-1 font-semibold text-gray-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-white"
        >
          ← Home
        </Link>
      </nav>

      <header>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Radicals
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {rows.length} radicals, grouped by stroke count.
        </p>
      </header>

      {rows.length === 0 && (
        <p className="mt-8 text-slate-600 dark:text-slate-400">
          No radicals in the database yet.
        </p>
      )}

      {[...groups.entries()].map(([strokes, items]) => (
        <section key={strokes ?? "unknown"} className="mt-10">
          <h2 className="mb-4 flex items-baseline gap-2 border-b border-slate-300 pb-2 text-lg font-semibold dark:border-slate-700">
            {strokes === null
              ? "Stroke count unknown"
              : `${strokes} ${strokes === 1 ? "stroke" : "strokes"}`}
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              {items.length}
            </span>
          </h2>

          <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {items.map((r) => (
              <li
                key={r.id}
                className="relative flex flex-col items-center gap-0.5 rounded-lg border border-slate-300 bg-white px-2 pb-2 pt-5 text-center dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="absolute left-2 top-1.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {r.id}
                </span>
                <span
                  lang="zh"
                  className="font-serif text-3xl leading-tight"
                >
                  {r.character}
                </span>
                {r.pinyin && (
                  <span className="mt-1 font-semibold text-teal-700 dark:text-white">
                    {r.pinyin}
                  </span>
                )}
                {r.meaning_en && (
                  <span className="text-sm">{r.meaning_en}</span>
                )}
                {r.meaning_gr && (
                  <span
                    lang="el"
                    className="text-sm text-slate-600 dark:text-slate-400"
                  >
                    {r.meaning_gr}
                  </span>
                )}
                {r.variants && (
                  <span
                    lang="zh"
                    className="mt-1.5 w-full border-t border-dashed border-slate-300 pt-1.5 text-lg text-slate-600 dark:border-slate-600 dark:text-slate-400"
                  >
                    {r.variants}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
