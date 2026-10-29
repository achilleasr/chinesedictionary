import Link from "next/link";
import { pool } from "@/app/lib/database";
import { dict, langQs, LangToggle, parseLang } from "@/app/lib/i18n";
import { page, topBar, backLink, heading, card } from "@/app/lib/ui";

type Radical = {
  id: number;
  character: string;
  meaning_gr: string | null;
  meaning_en: string | null;
  pinyin: string | null;
  stroke_count: number | null;
  variants: string | null;
};

export default async function RadicalsPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang: langParam } = await searchParams;
  const lang = parseLang(langParam);
  const t = dict[lang];
  const qs = langQs(lang);

  const { rows } = await pool.query<Radical>(
    "SELECT * FROM radicals ORDER BY stroke_count NULLS LAST, id"
  );

  const groups = new Map<number | null, Radical[]>();
  for (const r of rows) {
    if (!groups.has(r.stroke_count)) groups.set(r.stroke_count, []);
    groups.get(r.stroke_count)!.push(r);
  }

  return (
    <main className={page}>
      <div className={topBar}>
        <Link href={`/${qs}`} className={backLink}>
          {t.backSearch}
        </Link>
        <LangToggle path="/radicals" lang={lang} />
      </div>

      <header className="mt-6">
        <h1 className="text-4xl font-bold">{t.allRadicals}</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{rows.length}</p>
      </header>

      {rows.length === 0 && (
        <p className="mt-8 text-gray-500 dark:text-gray-400">
          No radicals in the database yet.
        </p>
      )}

      {[...groups.entries()].map(([strokes, items]) => (
        <section key={strokes ?? "unknown"} className="mt-10">
          <h2 className={`${heading} flex items-baseline gap-2`}>
            {strokes === null ? "?" : `${strokes} ${t.strokes}`}
            <span className="normal-case tracking-normal">{items.length}</span>
          </h2>

          <ul className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
            {items.map((r) => {
              const meaning =
                lang === "gr"
                  ? r.meaning_gr || r.meaning_en
                  : r.meaning_en || r.meaning_gr;
              return (
                <li key={r.id}>
                  <Link href={`/radical/${r.id}${qs}`} className={`${card} h-full`}>
                    <span className="block text-left text-[10px] tabular-nums text-gray-400">
                      R{r.id}
                    </span>
                    <span lang="zh" className="block text-2xl leading-tight">
                      {r.character}
                    </span>
                    {r.pinyin && (
                      <span className="block text-sm text-gray-500 dark:text-gray-400">
                        {r.pinyin}
                      </span>
                    )}
                    {meaning && (
                      <span className="block text-xs text-gray-400">{meaning}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
