import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { REGISTER_LOGIN_PATH } from "@/lib/auth-routes";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatPlanPrice,
  getBillingLabel,
  getCurrencyPrefix,
  getPlanBySlug,
  parseBillingCycle,
  parseCurrency,
  pricingPlans,
} from "@/lib/pricing/plans";

const inputClass =
  "h-11 rounded-[10px] border-slate-200 bg-white text-sm focus-visible:ring-blue-600/25";

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const planSlug = searchParams.get("plan");
  const billingCycle = parseBillingCycle(searchParams.get("cycle"));
  const currency = parseCurrency(searchParams.get("currency"));
  const plan = getPlanBySlug(planSlug);
  const [isProcessing, setIsProcessing] = useState(false);

  const price = useMemo(() => {
    if (!plan) return "0.00";
    return formatPlanPrice(plan, billingCycle, currency);
  }, [plan, billingCycle, currency]);

  const currencyPrefix = getCurrencyPrefix(currency);

  if (!plan) {
    return <Navigate to="/#planes" replace />;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Pago registrado. Te contactaremos para activar tu plan.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <HaiSalesLogo href="/" imageClassName="h-8 max-w-[150px]" />
          <Link
            to="/#planes"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a planes
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Checkout de pago</h1>
          <p className="mt-2 text-sm text-slate-500">
            Completa tus datos para activar el plan {plan.name}.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company">Razón social / Empresa</Label>
                <Input id="company" required className={inputClass} placeholder="Mi Empresa S.A.C." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" required className={inputClass} placeholder="Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input id="email" type="email" required className={inputClass} placeholder="ventas@empresa.pe" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="ruc">RUC</Label>
                <Input id="ruc" required className={inputClass} placeholder="20123456789" maxLength={11} />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <CreditCard className="h-4 w-4 text-blue-600" />
                Datos de pago
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="card">Número de tarjeta</Label>
                  <Input id="card" required className={inputClass} placeholder="4111 1111 1111 1111" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Vencimiento</Label>
                  <Input id="expiry" required className={inputClass} placeholder="MM/AA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input id="cvc" required className={inputClass} placeholder="123" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isProcessing}
              className="h-11 w-full rounded-[10px] bg-blue-600 text-sm font-semibold hover:bg-blue-500"
            >
              {isProcessing ? "Procesando pago..." : `Pagar ${currencySuffix} ${price}`}
            </Button>

            <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              Pago seguro con cifrado SSL
            </p>
          </form>
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Resumen del pedido</h2>
          <div className="mt-4 space-y-3 border-b border-slate-100 pb-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Plan</span>
              <span className="font-semibold text-slate-900">{plan.name}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Facturación</span>
              <span className="font-medium text-slate-800">{getBillingLabel(billingCycle)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">Moneda</span>
              <span className="font-medium text-slate-800">{currency === "pen" ? "Soles (PEN)" : "Dólares (USD)"}</span>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between">
            <span className="text-sm text-slate-500">Total mensual · IGV incluido</span>
            <span className="text-2xl font-bold text-slate-900">
              {currencyPrefix} {price}
            </span>
          </div>

          <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
            {plan.features.slice(0, 6).map((feature) => (
              <li key={feature.label} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>
                  {feature.label}
                  {feature.subItems && feature.subItems.length > 0 && (
                    <span className="text-slate-400"> ({feature.subItems.join(", ")})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-slate-400">
            ¿Prefieres probar antes?{" "}
            <Link to={REGISTER_LOGIN_PATH} className="font-medium text-blue-600 hover:text-blue-500">
              Probar gratis 14 días
            </Link>
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Otros planes disponibles:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pricingPlans
                .filter((item) => item.slug !== plan.slug)
                .map((item) => (
                  <Link
                    key={item.slug}
                    to={`/checkout?plan=${item.slug}&cycle=${billingCycle}&currency=${currency}`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-500"
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
