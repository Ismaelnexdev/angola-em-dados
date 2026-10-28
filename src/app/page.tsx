import { fetchIndicator } from "@/lib/worldbank/client";
import { INDICATORS } from "@/lib/worldbank/indicators";
import { latestPoint } from "@/lib/worldbank/series";

export const revalidate = 86400;

interface Row {
  label: string;
  year: number | null;
  value: number | null;
  error: string | null;
}

export default async function Home() {
  const rows: Row[] = await Promise.all(
    INDICATORS.map(async (indicator): Promise<Row> => {
      try {
        const [angola] = await fetchIndicator(indicator.id, ["AGO"]);
        const latest = angola ? latestPoint(angola) : null;
        return {
          label: indicator.label,
          year: latest?.year ?? null,
          value: latest?.value ?? null,
          error: null,
        };
      } catch (error) {
        return {
          label: indicator.label,
          year: null,
          value: null,
          error: error instanceof Error ? error.message : "Erro desconhecido",
        };
      }
    }),
  );

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Verificação dos dados (provisória)</h1>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Indicador</th>
            <th className="py-2">Ano</th>
            <th className="py-2">Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b">
              <td className="py-2">{row.label}</td>
              <td className="py-2">{row.year ?? "—"}</td>
              <td className="py-2">
                {row.error
                  ? row.error
                  : row.value === null
                    ? "sem dados"
                    : row.value.toLocaleString("pt-PT")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}