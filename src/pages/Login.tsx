import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Lock,
  Mail,
  Shield,
  ShoppingCart,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { HaiSalesLogo } from "@/components/landing/HaiSalesLogo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatSupabaseError } from "@/lib/authErrors";
import { isRegisterLoginSearch } from "@/lib/auth-routes";
import { prefetchAppRoutes } from "@/lib/prefetch-app-routes";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register";

const features = [
  {
    icon: ShoppingCart,
    title: "Gestión de Ventas",
    description: "Controla todo el ciclo de ventas",
  },
  {
    icon: User,
    title: "CRM Completo",
    description: "Gestiona clientes y leads",
  },
  {
    icon: BarChart3,
    title: "Reportes Avanzados",
    description: "Toma decisiones basadas en datos",
  },
  {
    icon: Shield,
    title: "Seguro y Confiable",
    description: "Tus datos siempre protegidos",
  },
];

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function LoginPromoPanel() {
  return (
    <aside className="relative hidden min-h-screen flex-col justify-center lg:flex lg:w-[54%] xl:w-[56%]">
      <div className="relative z-10 flex w-full max-w-[600px] flex-col px-10 py-12 lg:ml-12 lg:pl-24 lg:pr-6 xl:ml-16 xl:pl-28 xl:pr-8">
        <HaiSalesLogo
          href="/"
          imageClassName="h-11 w-auto max-w-[260px] object-contain object-left brightness-110"
        />
        <p className="mt-2 text-sm text-slate-300">
          Desarrollado por <span className="font-semibold text-white">HAITECH</span> | ERP
        </p>

        <div className="mt-10">
          <h1 className="max-w-[560px] font-bold tracking-tight text-white">
            <span className="block text-[2rem] leading-[1.2] sm:text-[2.35rem] xl:text-[2.55rem]">
              Gestiona tu negocio de
            </span>
            <span className="mt-2 block text-[2rem] leading-[1.2] sm:text-[2.35rem] xl:text-[2.55rem]">
              manera y{" "}
              <span className="text-[2.2rem] leading-[1.12] text-[#0b7cff] sm:text-[2.6rem] xl:text-[2.85rem]">
                inteligente
              </span>
            </span>
            <span className="mt-2 block text-[2.2rem] leading-[1.12] text-[#0b7cff] sm:text-[2.6rem] xl:text-[2.85rem]">
              eficiente
            </span>
          </h1>

          <p className="mt-5 max-w-[520px] text-base leading-relaxed text-slate-300 sm:text-[17px]">
            Plataforma ERP y CRM completa para optimizar ventas, inventario, clientes y más.
          </p>
        </div>

        <ul className="mt-10 w-full max-w-[480px] space-y-4">
          {features.map((feature) => (
            <li key={feature.title} className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b7cff]/15 ring-1 ring-[#0b7cff]/30">
                <feature.icon className="h-5 w-5 text-[#3b9eff]" strokeWidth={1.75} />
              </span>
              <div className="pt-0.5">
                <p className="text-base font-semibold leading-tight text-white sm:text-[17px]">
                  {feature.title}
                </p>
                <p className="mt-1.5 text-sm leading-snug text-slate-400 sm:text-[15px]">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-10 flex items-center gap-2 text-sm text-slate-300 sm:text-[15px]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3b9eff]" strokeWidth={2} />
          Utilizado por cientos de empresas en todo el Perú
        </p>
      </div>
    </aside>
  );
}

function LoginFormPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() =>
    isRegisterLoginSearch(searchParams.toString()) ? "register" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Sesión iniciada correctamente");
        prefetchAppRoutes();
        navigate("/app/dashboard");
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success("Cuenta creada. Configura tu empresa para continuar.");
        navigate("/app/dashboard");
        return;
      }

      toast.success("Cuenta creada. Revisa tu correo para confirmar el registro.");
      setMode("login");
    } catch (error) {
      toast.error(formatSupabaseError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/app/dashboard` },
      });
      if (error) toast.error(error.message);
    } catch (error) {
      toast.error(formatSupabaseError(error));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center px-5 py-10 sm:px-8 lg:w-[46%] lg:max-w-none lg:px-10 lg:pr-12 xl:pr-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <HaiSalesLogo
            href="/"
            className="justify-center"
            imageClassName="h-10 w-auto max-w-[220px] object-contain object-center"
          />
          <p className="mt-2 text-center text-xs text-slate-600">
            Desarrollado por <span className="font-semibold text-slate-800">HAITECH</span> | ERP
          </p>
        </div>

        <div className="rounded-[20px] border border-white/70 bg-white/95 px-7 py-8 shadow-[0_20px_50px_rgba(15,23,42,0.14)] backdrop-blur-sm sm:px-8 sm:py-9">
          <div className="text-center">
            <h2 className="text-[1.85rem] font-bold leading-tight text-slate-900 sm:text-[2rem]">Bienvenido</h2>
            <p className="mt-2 text-[15px] text-slate-500 sm:text-base">Accede a tu cuenta o crea una nueva</p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-[#eef1f5] p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={cn(
                "rounded-[10px] py-2.5 text-[13px] font-semibold transition",
                mode === "login"
                  ? "bg-[#0b7cff] text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:text-slate-900",
              )}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={cn(
                "rounded-[10px] py-2.5 text-[13px] font-semibold transition",
                mode === "register"
                  ? "bg-[#0b7cff] text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:text-slate-900",
              )}
            >
              Registrarse
            </button>
          </div>

          <form className="mt-6 space-y-[1.15rem]" onSubmit={handleSubmit}>
            <div className="space-y-1.5 text-left">
              <Label htmlFor="email" className="text-[13px] font-medium text-slate-800">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="ventas@haitech.pe"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 rounded-[10px] border-transparent bg-[#eef2f8] pl-10 text-[13px] text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="password" className="text-[13px] font-medium text-slate-800">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  className="h-11 rounded-[10px] border-transparent bg-[#eef2f8] pl-10 text-[13px] text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-blue-500/20"
                />
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="h-4 w-4 border-slate-300 data-[state=checked]:border-[#0b7cff] data-[state=checked]:bg-[#0b7cff]"
                  />
                  <span className="text-[13px] text-slate-600">Recordarme</span>
                </label>
                <button
                  type="button"
                  className="text-[13px] font-medium text-[#0b7cff] transition hover:text-blue-500"
                  onClick={() => toast.info("Próximamente: recuperación de contraseña")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-11 w-full rounded-[10px] bg-[#0b7cff] text-[14px] font-semibold text-white shadow-none hover:bg-[#0066e0]"
            >
              {isSubmitting
                ? mode === "login"
                  ? "Iniciando sesión..."
                  : "Creando cuenta..."
                : mode === "login"
                  ? "Iniciar Sesión"
                  : "Crear cuenta"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                o continúa con
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isGoogleLoading}
            onClick={handleGoogleSignIn}
            className="h-11 w-full rounded-[10px] border-slate-200 bg-white text-[13px] font-medium text-slate-700 shadow-none hover:bg-slate-50"
          >
            <GoogleIcon className="mr-2.5 h-[18px] w-[18px]" />
            {isGoogleLoading ? "Redirigiendo..." : "Continuar con Google"}
          </Button>
        </div>

        <p className="mt-7 text-center text-[12px] text-slate-500">
          © 2025 HaiSales ERP. Todos los derechos reservados.
        </p>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#04101f]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/fondologin.jpg')" }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#04101f_0%,#041528e6_20%,#041528cc_34%,#04152880_44%,transparent_62%)]"
        aria-hidden="true"
      />

      <Link
        to="/"
        className="absolute left-5 top-5 z-20 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:bg-white/10 hover:text-white lg:left-8 lg:top-8"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Atrás
      </Link>

      <div className="relative z-10 flex min-h-screen w-full">
        <LoginPromoPanel />
        <LoginFormPanel />
      </div>
    </div>
  );
}
