# Bootstrap haitechone stack: React + Vite + shadcn + Supabase + Vercel
param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectName,

    [string]$Directory = ".",

    [switch]$SkipSupabase,
    [switch]$SkipGit
)

$ErrorActionPreference = "Stop"

$ProjectPath = Join-Path (Resolve-Path $Directory) $ProjectName

if (Test-Path $ProjectPath) {
    Write-Error "Ya existe: $ProjectPath"
}

Write-Host "==> Creando proyecto Vite (react-swc-ts)..." -ForegroundColor Cyan
npm create vite@5 $ProjectName -- --template react-swc-ts
Set-Location $ProjectPath

Write-Host "==> Instalando dependencias base..." -ForegroundColor Cyan
npm install

Write-Host "==> Instalando stack haitechone..." -ForegroundColor Cyan
npm install `
  react@^18.3.1 react-dom@^18.3.1 `
  @hookform/resolvers `
  @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio `
  @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible `
  @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu `
  @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar `
  @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress `
  @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select `
  @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot `
  @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast `
  @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip `
  @supabase/supabase-js @tanstack/react-query `
  class-variance-authority clsx cmdk date-fns embla-carousel-react input-otp `
  jspdf jspdf-autotable lucide-react next-themes react-day-picker react-hook-form `
  react-resizable-panels react-router-dom@^6.30.1 recharts sonner tailwind-merge `
  tailwindcss-animate vaul vite-plugin-pwa zod

npm install -D @tailwindcss/typography autoprefixer postcss tailwindcss@3.4.17 @vitejs/plugin-react-swc@^3.11.0 vite@^5.4.19

Write-Host "==> Inicializando Tailwind..." -ForegroundColor Cyan
npx tailwindcss@3.4.17 init -p

Write-Host "==> Inicializando shadcn/ui..." -ForegroundColor Cyan
npx shadcn@latest init -y -d

Write-Host "==> Instalando componentes shadcn base..." -ForegroundColor Cyan
npx shadcn@latest add -y button card input label dialog dropdown-menu `
  select tabs toast sonner tooltip avatar badge separator sheet sidebar

Write-Host "==> Creando estructura de carpetas..." -ForegroundColor Cyan
@(
    "src/components/layout",
    "src/components/landing",
    "src/hooks",
    "src/lib",
    "src/pages",
    "src/integrations/supabase",
    "src/types",
    "src/assets",
    "supabase/migrations",
    "supabase/functions",
    "scripts"
) | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

Write-Host "==> Escribiendo archivos de configuración..." -ForegroundColor Cyan

@'
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
'@ | Set-Content -Path vercel.json -Encoding UTF8

@'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id
'@ | Set-Content -Path .env.example -Encoding UTF8

@'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
'@ | Set-Content -Path components.json -Encoding UTF8

@"
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    open: "http://127.0.0.1:8080/",
  },
  plugins: [
    react(),
    VitePWA({
      devOptions: { enabled: false },
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico"],
      manifest: {
        name: "$ProjectName",
        short_name: "$ProjectName",
        description: "Aplicacion $ProjectName",
        theme_color: "#0F766E",
        background_color: "#0f172a",
        display: "standalone",
        icons: [{ src: "favicon.ico", sizes: "64x64", type: "image/x-icon" }],
      },
      workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg}"] },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
"@ | Set-Content -Path vite.config.ts -Encoding UTF8

@'
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
'@ | Set-Content -Path src/integrations/supabase/client.ts -Encoding UTF8

@'
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
'@ | Set-Content -Path src/integrations/supabase/types.ts -Encoding UTF8

@'
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
'@ | Set-Content -Path src/hooks/useAuth.tsx -Encoding UTF8

@"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

const queryClient = new QueryClient();

function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">$ProjectName</h1>
        <p className="text-muted-foreground">Stack listo. Configura Supabase en .env</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
"@ | Set-Content -Path src/App.tsx -Encoding UTF8

$gitignore = Get-Content .gitignore -Raw -ErrorAction SilentlyContinue
if ($gitignore -notmatch "(?m)^\.env$") {
    Add-Content .gitignore "`n.env`n.vercel`n"
}

if (-not $SkipGit) {
    Write-Host "==> Inicializando git..." -ForegroundColor Cyan
    git init -b main
    git add .
    git commit -m "Bootstrap haitechone stack"
}

if (-not $SkipSupabase) {
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        Write-Host "==> Inicializando Supabase..." -ForegroundColor Cyan
        supabase init
    } else {
        Write-Host "==> Supabase CLI no encontrado. Ejecuta manualmente: supabase init" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Proyecto creado en: $ProjectPath" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:"
Write-Host "  cd $ProjectName"
Write-Host "  copy .env.example .env"
Write-Host "  # Editar .env con credenciales Supabase"
Write-Host "  npm run dev"
Write-Host "  supabase link --project-ref <id> && supabase db push"
Write-Host "  vercel link && vercel --prod"
