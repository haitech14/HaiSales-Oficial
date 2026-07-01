# HaiSales

Plataforma de ventas construida con el stack **haitechone**.

## Inicio rápido

```powershell
copy .env.example .env
# Completar credenciales Supabase en .env
npm run dev
```

La app corre en [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Stack

Ver [STACK.md](./STACK.md) para el detalle completo de tecnologías y cómo clonar este stack en nuevos proyectos.

## Supabase

Proyecto enlazado: `xxslymzzreeelnlzzvqv`

```bash
# 1. Iniciar sesión en Supabase CLI (una vez)
npx supabase login

# 2. Enlazar proyecto remoto
npm run supabase:link

# 3. Aplicar migraciones (tablas: profiles, clientes, productos, ventas, venta_items)
npm run supabase:push

# 4. Regenerar tipos TypeScript desde la BD remota
npm run supabase:types
```

Variables en `.env` (ya configuradas localmente):

```env
VITE_SUPABASE_URL=https://xxslymzzreeelnlzzvqv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=xxslymzzreeelnlzzvqv
```

## Deploy (Vercel)

```bash
vercel link
vercel --prod
```

Configura las variables `VITE_SUPABASE_*` en el dashboard de Vercel.
