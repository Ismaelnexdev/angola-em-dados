import { Dashboard } from "@/components/dashboard";
import { loadDashboardData } from "@/lib/worldbank/load";

export const revalidate = 86400;

export default async function Home() {
  const data = await loadDashboardData();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12 sm:px-8 lg:py-16">
      <header className="mb-12 max-w-2xl">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-angola sm:text-6xl">
          Angola em dados
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Os indicadores públicos do Banco Mundial mais recentes, e como a
          evolução do país se compara com a dos vizinhos.
        </p>
      </header>

      <Dashboard data={data} />

      <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
        Fonte: Banco Mundial. A página verifica se há dados novos uma vez por
        dia. Os valores mais recentes de cada indicador podem ser de anos
        diferentes.
      </footer>
    </main>
  );
}