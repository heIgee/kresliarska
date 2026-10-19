import { useApiHealth } from "@/hooks/use-api-health";

const STATUS_LABEL = {
  loading: "Checking API…",
  ok: "API online",
  down: "API unreachable",
} as const;

export const App = () => {
  const status = useApiHealth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2">
      <h1 className="font-semibold text-3xl">Kresliarska</h1>
      <p className="text-neutral-500 text-sm">{STATUS_LABEL[status]}</p>
    </main>
  );
};
