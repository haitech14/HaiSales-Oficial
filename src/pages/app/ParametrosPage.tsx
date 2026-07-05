import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AppPageHeader } from "@/components/app/CrmShared";
import { CurrencyMultiSelect } from "@/components/parametros/CurrencyMultiSelect";
import { EmpresaLogoUpload } from "@/components/parametros/EmpresaLogoUpload";
import { PhonePrefixInput } from "@/components/parametros/PhonePrefixInput";
import { SedesEditor } from "@/components/parametros/SedesEditor";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useInvalidateEmpresaConfig } from "@/hooks/useEmpresaConfig";
import {
  PAIS_OPTIONS,
  TIPO_CONTRIBUYENTE_OPTIONS,
  ZONA_HORARIA_OPTIONS,
} from "@/lib/parametros/empresa-config-data";
import {
  defaultEmpresaConfig,
  fetchEmpresaConfig,
  updateEmpresaConfig,
  type EmpresaConfig,
} from "@/lib/parametros/empresa-service";

function Field({ label, children }: { label: string; children: ReactNode }) {
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
  const invalidateEmpresaConfig = useInvalidateEmpresaConfig();
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
      const saved = await updateEmpresaConfig(user.id, {
        ...form,
        setupCompleted: true,
      });
      setForm(saved);
      invalidateEmpresaConfig();
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
          <h2 className="text-base font-semibold text-slate-900">Datos fiscales</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Razón social">
                <input
                  className={inputClass}
                  value={form.razonSocial}
                  onChange={(e) => updateField("razonSocial", e.target.value)}
                />
              </Field>
              <Field label="Nombre comercial">
                <input
                  className={inputClass}
                  value={form.nombreComercial}
                  onChange={(e) => updateField("nombreComercial", e.target.value)}
                  placeholder="Ej. Mi Marca"
                />
              </Field>
              <Field label="RUC">
                <input className={inputClass} value={form.ruc} onChange={(e) => updateField("ruc", e.target.value)} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dirección fiscal">
                <input
                  className={inputClass}
                  value={form.direccion}
                  onChange={(e) => updateField("direccion", e.target.value)}
                />
              </Field>
              <Field label="Ciudad">
                <input
                  className={inputClass}
                  value={form.ciudad}
                  onChange={(e) => updateField("ciudad", e.target.value)}
                />
              </Field>
              <Field label="Teléfono">
                <PhonePrefixInput
                  prefix={form.telefonoPrefijo}
                  phone={form.telefono}
                  onPrefixChange={(value) => updateField("telefonoPrefijo", value)}
                  onPhoneChange={(value) => updateField("telefono", value)}
                  inputClassName="h-10 rounded-lg border border-slate-200 bg-white"
                />
              </Field>
              <Field label="País">
                <select
                  className={inputClass}
                  value={form.pais}
                  onChange={(e) => updateField("pais", e.target.value)}
                >
                  {PAIS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Correo">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Logo de la empresa">
                  <EmpresaLogoUpload
                    userId={user?.id}
                    value={form.logoUrl}
                    onChange={(logoUrl) => updateField("logoUrl", logoUrl)}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Sucursales">
                  <SedesEditor
                    sedes={form.sedes}
                    onChange={(sedes) => updateField("sedes", sedes)}
                    inputClassName="h-10 rounded-lg border border-slate-200 bg-white"
                  />
                </Field>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Impuestos y facturación</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Tipo de contribuyente">
              <select
                className={inputClass}
                value={form.tipoContribuyente}
                onChange={(e) => updateField("tipoContribuyente", e.target.value)}
              >
                <option value="">Seleccionar tipo</option>
                {TIPO_CONTRIBUYENTE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Zona horaria">
              <select
                className={inputClass}
                value={form.zonaHoraria}
                onChange={(e) => updateField("zonaHoraria", e.target.value)}
              >
                {ZONA_HORARIA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
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
            <div className="sm:col-span-2 lg:col-span-1">
              <Field label="Monedas">
                <CurrencyMultiSelect
                  value={form.monedas}
                  onChange={(monedas) => updateField("monedas", monedas)}
                  className="rounded-lg border border-slate-200 bg-white"
                />
              </Field>
            </div>
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
            <Field label="Serie nota de crédito">
              <input
                className={inputClass}
                value={form.serieNotaCredito}
                onChange={(e) => updateField("serieNotaCredito", e.target.value)}
              />
            </Field>
            <Field label="Serie nota de venta">
              <input
                className={inputClass}
                value={form.serieNotaVenta}
                onChange={(e) => updateField("serieNotaVenta", e.target.value)}
              />
            </Field>
            <Field label="Serie nota de débito">
              <input
                className={inputClass}
                value={form.serieNotaDebito}
                onChange={(e) => updateField("serieNotaDebito", e.target.value)}
              />
            </Field>
            <Field label="Serie guía de remisión">
              <input
                className={inputClass}
                value={form.serieGuiaRemision}
                onChange={(e) => updateField("serieGuiaRemision", e.target.value)}
              />
            </Field>
            <Field label="Serie proforma">
              <input
                className={inputClass}
                value={form.serieProforma}
                onChange={(e) => updateField("serieProforma", e.target.value)}
              />
            </Field>
            <Field label="Serie de orden de compra">
              <input
                className={inputClass}
                value={form.serieOrdenCompra}
                onChange={(e) => updateField("serieOrdenCompra", e.target.value)}
              />
            </Field>
            <Field label="Serie de orden de pedido">
              <input
                className={inputClass}
                value={form.serieOrdenPedido}
                onChange={(e) => updateField("serieOrdenPedido", e.target.value)}
              />
            </Field>
            <Field label="Serie de orden de servicio">
              <input
                className={inputClass}
                value={form.serieOrdenServicio}
                onChange={(e) => updateField("serieOrdenServicio", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Equipo contable</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del contador">
              <input
                className={inputClass}
                value={form.contadorNombre}
                onChange={(e) => updateField("contadorNombre", e.target.value)}
              />
            </Field>
            <Field label="Correo del contador">
              <input
                type="email"
                className={inputClass}
                value={form.contadorEmail}
                onChange={(e) => updateField("contadorEmail", e.target.value)}
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
