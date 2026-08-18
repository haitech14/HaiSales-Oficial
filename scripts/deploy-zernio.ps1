# Deploy Zernio (Supabase Edge Functions)
# Requiere: supabase login y ZERNIO_API_KEY en .env o en el entorno

$ErrorActionPreference = "Stop"
$ProjectRef = $env:SUPABASE_PROJECT_REF
if (-not $ProjectRef) {
  $ProjectRef = "yxklqaedegfqcbrwodqb"
}

if (-not $env:ZERNIO_API_KEY) {
  $envLine = Select-String -Path ".env" -Pattern '^ZERNIO_API_KEY=(.+)$' -ErrorAction SilentlyContinue
  if ($envLine) {
    $env:ZERNIO_API_KEY = $envLine.Matches.Groups[1].Value.Trim()
  }
}

if (-not $env:ZERNIO_API_KEY) {
  Write-Host "Define ZERNIO_API_KEY en .env o en el entorno antes de continuar." -ForegroundColor Red
  exit 1
}

Write-Host "Proyecto: $ProjectRef" -ForegroundColor Cyan

Write-Host "Configurando secrets..."
npx supabase secrets set --project-ref $ProjectRef "ZERNIO_API_KEY=$env:ZERNIO_API_KEY"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Desplegando edge functions..."
npx supabase functions deploy zernio-inbox-sync --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase functions deploy zernio-send --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase functions deploy inbox-messages-sync --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploy Zernio completado." -ForegroundColor Green
