import { Plus } from "lucide-react";

type ModuleFabProps = {
  label?: string;
  onClick: () => void;
};

export function ModuleFab({ label = "NUEVO", onClick }: ModuleFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-3 text-sm font-bold tracking-wide text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-500"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
      {label}
    </button>
  );
}
