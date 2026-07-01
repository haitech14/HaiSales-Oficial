#!/usr/bin/env bash
# Bootstrap haitechone stack: React + Vite + shadcn + Supabase + Vercel
set -euo pipefail

PROJECT_NAME="${1:-}"
PARENT_DIR="${2:-.}"
SKIP_SUPABASE=false
SKIP_GIT=false

usage() {
  cat <<'EOF'
Uso: ./scripts/bootstrap-stack.sh <nombre-proyecto> [directorio-padre]

Opciones de entorno:
  SKIP_SUPABASE=1   No ejecutar supabase init
  SKIP_GIT=1        No inicializar git

Ejemplo:
  ./scripts/bootstrap-stack.sh mi-app
  ./scripts/bootstrap-stack.sh mi-app ~/proyectos
EOF
}

if [[ -z "$PROJECT_NAME" ]]; then
  usage
  exit 1
fi

[[ "${SKIP_SUPABASE:-}" == "1" ]] && SKIP_SUPABASE=true
[[ "${SKIP_GIT:-}" == "1" ]] && SKIP_GIT=true

PROJECT_PATH="$(cd "$PARENT_DIR" && pwd)/$PROJECT_NAME"

if [[ -d "$PROJECT_PATH" ]]; then
  echo "Error: ya existe $PROJECT_PATH"
  exit 1
fi

echo "==> Creando proyecto Vite (react-swc-ts)..."
npm create vite@5 "$PROJECT_NAME" -- --template react-swc-ts
cd "$PROJECT_PATH"

echo "==> Instalando dependencias base..."
npm install

echo "==> Instalando stack haitechone..."
npm install \
  react@^18.3.1 react-dom@^18.3.1 \
  @hookform/resolvers \
  @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio \
  @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible \
  @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar \
  @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress \
  @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select \
  @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-slot \
  @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast \
  @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip \
  @supabase/supabase-js @tanstack/react-query \
  class-variance-authority clsx cmdk date-fns embla-carousel-react input-otp \
  jspdf jspdf-autotable lucide-react next-themes react-day-picker react-hook-form \
  react-resizable-panels react-router-dom@^6.30.1 recharts sonner tailwind-merge \
  tailwindcss-animate vaul vite-plugin-pwa zod

npm install -D \
  @tailwindcss/typography autoprefixer postcss tailwindcss@3.4.17 @vitejs/plugin-react-swc@^3.11.0 vite@^5.4.19

echo "==> Inicializando Tailwind..."
npx tailwindcss@3.4.17 init -p

echo "==> Inicializando shadcn/ui..."
npx shadcn@latest init -y -d

echo "==> Instalando componentes shadcn base..."
npx shadcn@latest add -y button card input label dialog dropdown-menu \
  select tabs toast sonner tooltip avatar badge separator sheet sidebar

echo "==> Creando estructura de carpetas..."
mkdir -p src/components/layout src/components/landing src/hooks src/lib \
  src/pages src/integrations/supabase src/types src/assets \
  supabase/migrations supabase/functions scripts

echo "==> Escribiendo archivos de configuración..."

cat > vercel.json <<'EOF'
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
EOF

cat > .env.example <<'EOF'
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id
EOF

cat > components.json <<'EOF'
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
EOF

cat > vite.config.ts <<EOF
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
        name: "$PROJECT_NAME",
        short_name: "$PROJECT_NAME",
        description: "Aplicacion $PROJECT_NAME",
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
EOF

cat > src/integrations/supabase/client.ts <<'EOF'
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
EOF

cat > src/integrations/supabase/types.ts <<'EOF'
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
EOF

cat > src/hooks/useAuth.tsx <<'EOF'
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
EOF

cat > src/App.tsx <<EOF
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
        <h1 className="text-3xl font-bold">$PROJECT_NAME</h1>
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
EOF

# Actualizar .gitignore
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
  printf '\n.env\n.vercel\n' >> .gitignore
fi

if [[ "$SKIP_GIT" == false ]]; then
  echo "==> Inicializando git..."
  git init -b main
  git add .
  git commit -m "Bootstrap haitechone stack"
fi

if [[ "$SKIP_SUPABASE" == false ]] && command -v supabase &>/dev/null; then
  echo "==> Inicializando Supabase..."
  supabase init
else
  echo "==> Supabase CLI no encontrado o omitido. Ejecuta manualmente: supabase init"
fi

echo ""
echo "✓ Proyecto creado en: $PROJECT_PATH"
echo ""
echo "Próximos pasos:"
echo "  cd $PROJECT_NAME"
echo "  cp .env.example .env"
echo "  # Editar .env con credenciales Supabase"
echo "  npm run dev"
echo "  supabase link --project-ref <id> && supabase db push"
echo "  vercel link && vercel --prod"
