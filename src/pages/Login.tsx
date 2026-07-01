import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Eye,
  EyeOff,
  LineChart,
  Lock,
  Mail,
  Shield,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/lib/authErrors";
import { cn } from "@/lib/utils";

const promoFeatures = [
  {
    icon: Zap,
    title: "Información centralizada",
    description: "Clientes, cotizaciones y facturas siempre actualizados.",
  },
  {
    icon: Shield,
    title: "Seguridad y confianza",
    description: "Tus datos protegidos con los más altos estándares.",
  },
  {
    icon: BarChart3,
    title: "Decisiones inteligentes",
    description: "Reportes en tiempo real para impulsar tus ventas.",
  },
];

function LoginPromoPanel() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-[#070d1a] lg:flex lg:w-[54%] xl:w-[55%]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.18) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-[120px]" />

      <div className="relative z-10 flex h-full flex-col px-10 py-8 xl:px-14 xl:py-10">
        <HaiSalesLogo variant="light" href="/" />

        <div className="mt-10 flex flex-1 flex-col justify-center xl:mt-14">
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg shadow-black/20">
            <LineChart className="h-6 w-6 text-blue-600" strokeWidth={2} />
          </span>

          <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-tight text-white xl:text-[2.35rem] xl:leading-[1.15]">
            Ventas claras en{" "}
            <span className="text-blue-500">tiempo real</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400 sm:text-[15px]">
            Visualiza tu pipeline, oportunidades e ingresos desde cualquier dispositivo.
          </p>

          <div className="relative mt-8 xl:mt-10">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-blue-500/10 blur-3xl" />
            <img
              src="/mockups.png"
              alt="Vista previa de HaiSales en escritorio y móvil"
              className="relative z-10 mx-auto w-full max-w-[620px]"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/[0.08] pt-8 xl:gap-8">
          {promoFeatures.map((feature) => (
            <div key={feature.title}>
              <feature.icon className="h-5 w-5 text-blue-400" strokeWidth={1.75} />
              <p className="mt-3 text-sm font-semibold text-white">{feature.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function LoginFormPanel() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Sesión iniciada correctamente");
      navigate("/app/dashboard");
    } catch (error) {
      toast.error(formatSupabaseError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-[#f4f6f9] px-4 py-10 sm:px-6 lg:px-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex justify-center lg:hidden">
          <HaiSalesLogo variant="dark" href="/" />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-8 shadow-[0_8px_40px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9">
          <div className="flex justify-center">
            <HaiSalesLogo variant="dark" href="/" />
          </div>

          <div className="mt-6 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-[1.35rem]">
              Inicia sesión en HaiSales
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Gestiona tus ventas, clientes y facturas desde una sola plataforma.
            </p>
          </div>

          <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 rounded-lg border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400 focus-visible:ring-blue-600/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11 rounded-lg border-slate-200 bg-white pl-10 pr-11 text-sm placeholder:text-slate-400 focus-visible:ring-blue-600/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                />
                <span className="text-sm text-slate-600">Recordarme</span>
              </label>
              <a href="#" className="text-sm font-medium text-blue-600 transition hover:text-blue-500">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500",
              )}
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{" "}
            <a href="/#contacto" className="font-semibold text-blue-600 transition hover:text-blue-500">
              Prueba gratis 14 días
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <div className="flex min-h-screen">
      <LoginPromoPanel />
      <LoginFormPanel />
    </div>
  );
}
