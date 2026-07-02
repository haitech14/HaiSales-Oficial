import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/app/CrmShared";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  defaultEmpresaConfig,
  fetchEmpresaConfig,
  updateEmpresaConfig,
  type EmpresaConfig,
} from "@/lib/parametros/empresa-service";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20";

export default function ParametrosPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<EmpresaConfig>(defaultEmpresaConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    fetchEmpresaConfig(user.id)
      .then(setForm)
      .catch(() => toast.error("No se pudo cargar la configuración"))
      .finally(() => setIsLoading(false));
  }, [user?.id]);

  const updateField = <K extends keyof EmpresaConfig>(key: K, value: EmpresaConfig[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await updateEmpresaConfig(user.id, form);
      setForm(saved);
      toast.success("Configuración guardada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppPageHeader
        title="Configuración"
        subtitle="Datos de empresa, series de comprobantes, impuestos y moneda."
        actionLabel="Guardar cambios"
        onActionClick={handleSave}
      />

      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Empresa</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Razón social">
              <input
                className={inputClass}
                value={form.razonSocial}
                onChange={(e) => updateField("razonSocial", e.target.value)}
              />
            </Field>
            <Field label="RUC">
              <input className={inputClass} value={form.ruc} onChange={(e) => updateField("ruc", e.target.value)} />
            </Field>
            <Field label="Dirección fiscal">
              <input
                className={inputClass}
                value={form.direccion}
                onChange={(e) => updateField("direccion", e.target.value)}
              />
            </Field>
            <Field label="Teléfono">
              <input
                className={inputClass}
                value={form.telefono}
                onChange={(e) => updateField("telefono", e.target.value)}
              />
            </Field>
            <Field label="Correo">
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </Field>
            <Field label="Moneda">
              <select
                className={inputClass}
                value={form.moneda}
                onChange={(e) => updateField("moneda", e.target.value)}
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Facturación</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="IGV (%)">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className={inputClass}
                value={form.igvPorcentaje}
                onChange={(e) => updateField("igvPorcentaje", Number(e.target.value))}
              />
            </Field>
            <Field label="Serie factura">
              <input
                className={inputClass}
                value={form.serieFactura}
                onChange={(e) => updateField("serieFactura", e.target.value)}
              />
            </Field>
            <Field label="Serie boleta">
              <input
                className={inputClass}
                value={form.serieBoleta}
                onChange={(e) => updateField("serieBoleta", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-blue-600 hover:bg-blue-500">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar configuración
          </Button>
        </div>
      </div>
    </div>
  );
}
