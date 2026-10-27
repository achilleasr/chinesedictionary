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
    "SELECT * FROM radicals ORDER BY id"
  );

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Radical</th>
          <th>Pinyin</th>
          <th>EN</th>
          <th>GR</th>
          <th>Strokes</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.id}</td>
            <td>{r.character}</td>
            <td>{r.pinyin}</td>
            <td>{r.meaning_en}</td>
            <td>{r.meaning_gr}</td>
            <td>{r.stroke_count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
