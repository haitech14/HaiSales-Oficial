# Deploy Zavu (Supabase Edge Functions)
# Requiere: supabase login

$ErrorActionPreference = "Stop"
$ProjectRef = $env:SUPABASE_PROJECT_REF
if (-not $ProjectRef) {
  $ProjectRef = "yxklqaedegfqcbrwodqb"
}

Write-Host "Proyecto: $ProjectRef" -ForegroundColor Cyan

if (-not $env:ZAVUDEV_API_KEY) {
  Write-Host "Define ZAVUDEV_API_KEY en el entorno antes de continuar." -ForegroundColor Red
  exit 1
}

Write-Host "Configurando secrets..."
npx supabase secrets set --project-ref $ProjectRef `
  "ZAVUDEV_API_KEY=$env:ZAVUDEV_API_KEY" `
  "ZAVU_API_BASE_URL=https://api.zavu.dev"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Desplegando edge functions..."
npx supabase functions deploy zavu-sync --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase functions deploy zavu-send --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase functions deploy zavu-webhook --project-ref $ProjectRef --use-api --no-verify-jwt --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploy Zavu completado." -ForegroundColor Green
