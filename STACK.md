# HaiPlanner Stack

Stack usado en **haitechone** para clonar en nuevos proyectos.

## Resumen

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite 5 (SWC) |
| UI | shadcn/ui + Radix UI + Tailwind CSS 3 |
| Routing | react-router-dom v6 |
| Estado servidor | TanStack React Query v5 |
| Formularios | react-hook-form + Zod |
| Gráficos | Recharts |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Serverless | Supabase Edge Functions (Deno) |
| Deploy | Vercel (SPA) |
| PWA | vite-plugin-pwa |

## Bootstrap rápido

### Windows (PowerShell)

```powershell
.\scripts\bootstrap-stack.ps1 -ProjectName mi-app
cd mi-app
```

### Linux / macOS / Git Bash

```bash
chmod +x scripts/bootstrap-stack.sh
./scripts/bootstrap-stack.sh mi-app
cd mi-app
```

### Opciones

| Flag | Descripción |
|------|-------------|
| `-ProjectName` / 1er arg | Nombre de la carpeta del proyecto |
| `-Directory` | Carpeta padre (default: actual) |
| `-SkipSupabase` | No ejecutar `supabase init` |
| `-SkipGit` | No inicializar repositorio git |

## Después del bootstrap

1. Copiar `.env.example` → `.env` y completar credenciales Supabase.
2. Enlazar Supabase: `supabase link --project-ref <id>`
3. Aplicar migraciones: `supabase db push`
4. Desarrollo: `npm run dev` (puerto 8080)
5. Deploy Vercel: `vercel link` → configurar env → `vercel --prod`

## Variables de entorno

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable_key>
VITE_SUPABASE_PROJECT_ID=<project_id>
```

## Estructura generada

```
src/
  components/ui/       # shadcn/ui
  components/layout/   # layout de app
  pages/               # rutas
  hooks/               # hooks de datos y auth
  lib/                 # utilidades
  integrations/supabase/
supabase/
  migrations/
  functions/
```

## Dependencias principales

Ver `package.json` del proyecto o la sección de instalación en `scripts/bootstrap-stack.sh`.
