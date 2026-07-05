import { useState } from "react";
import { Building2, Copy, CreditCard, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { checkoutPaymentConfig } from "@/lib/pricing/checkout-payment";
import {
  formatCurrencyAmountRounded,
  getBillingLabel,
  getCurrencyPrefix,
  getPlanAnnualTotal,
  getPlanDisplayPrice,
  type BillingCycle,
  type Currency,
  type PricingPlan,
} from "@/lib/pricing/plans";
import { cn } from "@/lib/utils";

type PaymentMethod = "mercado_pago" | "yape_plin" | "transferencia";

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  icon: typeof CreditCard;
}[] = [
  { id: "mercado_pago", label: "Mercado Pago", shortLabel: "Mercado Pago", icon: CreditCard },
  { id: "yape_plin", label: "Yape / Plin", shortLabel: "Yape/Plin", icon: Smartphone },
  { id: "transferencia", label: "Transferencia", shortLabel: "Transferencia", icon: Building2 },
];

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
  } catch {
    toast.error("No se pudo copiar al portapapeles");
  }
}

function CopyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void copyToClipboard(value, label)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-800"
        aria-label={`Copiar ${label}`}
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

export function CheckoutModal({
  open,
  onOpenChange,
  plan,
  billingCycle,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PricingPlan | null;
  billingCycle: BillingCycle;
  currency: Currency;
}) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mercado_pago");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    onOpenChange(false);
    setPaymentMethod("mercado_pago");
    setIsProcessing(false);
  };

  if (!plan) return null;

  const currencyPrefix = getCurrencyPrefix(currency);
  const displayPrice = getPlanDisplayPrice(plan, billingCycle, currency);
  const annualTotal = getPlanAnnualTotal(plan, currency);
  const isAnnual = billingCycle === "annual";
  const amountLabel = isAnnual
    ? `${currencyPrefix} ${formatCurrencyAmountRounded(annualTotal, currency)}`
    : `${currencyPrefix} ${formatCurrencyAmountRounded(displayPrice, currency)}`;

  const handleConfirm = () => {
    setIsProcessing(true);

    if (paymentMethod === "mercado_pago") {
      window.open(checkoutPaymentConfig.mercadoPagoCheckoutUrl, "_blank", "noopener,noreferrer");
      toast.success("Redirigiendo a Mercado Pago para completar tu pago.");
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      setIsProcessing(false);
      toast.success(
        paymentMethod === "yape_plin"
          ? "Envía el voucher a ventas@haitech.pe para activar tu plan."
          : "Registramos tu solicitud. Te contactaremos al confirmar la transferencia.",
      );
      handleClose();
    }, 800);
  };

  const confirmLabel = (() => {
    switch (paymentMethod) {
      case "mercado_pago":
        return "Pagar con Mercado Pago";
      case "yape_plin":
        return "Ya realicé el pago";
      case "transferencia":
        return "Confirmar transferencia";
      default: {
        const _exhaustive: never = paymentMethod;
        return _exhaustive;
      }
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[520px] gap-0 overflow-y-auto rounded-2xl border-slate-200 p-0 shadow-xl [&>button:last-child]:hidden">
        <div className="border-b border-slate-100 px-6 pb-4 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">Checkout</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-slate-500">
                Completa tu pago para activar el plan {plan.name}.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{getBillingLabel(billingCycle)} · IGV incluido</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-900">{amountLabel}</p>
                {isAnnual && (
                  <p className="text-[11px] text-slate-500">
                    {currencyPrefix} {formatCurrencyAmountRounded(displayPrice, currency)} / mes
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Método de pago</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition",
                  paymentMethod === method.id
                    ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <method.icon className="h-4 w-4" strokeWidth={1.75} />
                <span className="text-[11px] font-semibold leading-tight sm:text-xs">{method.shortLabel}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
            {paymentMethod === "mercado_pago" && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009ee3]/10">
                    <CreditCard className="h-5 w-5 text-[#009ee3]" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Mercado Pago</p>
                    <p className="text-xs text-slate-500">Tarjeta, débito o saldo Mercado Pago</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  Serás redirigido a Mercado Pago para pagar de forma segura. Al finalizar, activaremos tu plan
                  automáticamente.
                </p>
              </div>
            )}

            {paymentMethod === "yape_plin" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Realiza el pago por <strong className="text-slate-800">Yape</strong> o{" "}
                  <strong className="text-slate-800">Plin</strong> al número indicado y envía el voucher a{" "}
                  <strong className="text-slate-800">{checkoutPaymentConfig.supportEmail}</strong>.
                </p>
                <CopyField label="Yape" value={checkoutPaymentConfig.yapePhone} />
                <CopyField label="Plin" value={checkoutPaymentConfig.plinPhone} />
                <CopyField label="Monto a pagar" value={amountLabel} />
              </div>
            )}

            {paymentMethod === "transferencia" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Transfiere el monto indicado y envía el comprobante a{" "}
                  <strong className="text-slate-800">{checkoutPaymentConfig.supportEmail}</strong>.
                </p>
                <CopyField label="Titular" value={checkoutPaymentConfig.bank.holder} />
                <CopyField label="Banco" value={checkoutPaymentConfig.bank.bankName} />
                <CopyField label="Cuenta" value={checkoutPaymentConfig.bank.accountNumber} />
                <CopyField label="CCI" value={checkoutPaymentConfig.bank.cci} />
                <CopyField label="Monto a pagar" value={amountLabel} />
              </div>
            )}
          </div>

          <Button
            type="button"
            disabled={isProcessing}
            onClick={handleConfirm}
            className="mt-5 h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-500"
          >
            {isProcessing ? "Procesando..." : confirmLabel}
          </Button>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            Al confirmar aceptas los términos del plan seleccionado.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
