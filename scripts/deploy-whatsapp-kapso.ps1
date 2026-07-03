# Deploy WhatsApp Kapso (Supabase)
# Requiere: supabase login y proyecto ACTIVO (no pausado)

$ErrorActionPreference = "Stop"
$ProjectRef = $env:SUPABASE_PROJECT_REF
if (-not $ProjectRef) {
  $ProjectRef = "zjpsmffghtybljazmrgh"
}

Write-Host "Proyecto: $ProjectRef" -ForegroundColor Cyan

Write-Host "Aplicando migraciones..."
npx supabase link --project-ref $ProjectRef --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase db push --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $env:KAPSO_API_KEY) {
  Write-Host "Define KAPSO_API_KEY en el entorno antes de continuar." -ForegroundColor Red
  exit 1
}

if (-not $env:WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
  $env:WHATSAPP_WEBHOOK_VERIFY_TOKEN = "f32ede06e17ff2b8d7e9a5e874bf78c3ba4a301fd909c9a69e5e9a80d3b6e958"
}
if (-not $env:DEFAULT_WHATSAPP_PHONE_NUMBER_ID) {
  $env:DEFAULT_WHATSAPP_PHONE_NUMBER_ID = "597907523413541"
}

Write-Host "Configurando secrets..."
npx supabase secrets set --project-ref $ProjectRef `
  "KAPSO_API_KEY=$env:KAPSO_API_KEY" `
  "KAPSO_API_BASE_URL=https://api.kapso.ai" `
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN=$env:WHATSAPP_WEBHOOK_VERIFY_TOKEN" `
  "DEFAULT_WHATSAPP_PHONE_NUMBER_ID=$env:DEFAULT_WHATSAPP_PHONE_NUMBER_ID"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Desplegando edge functions..."
npx supabase functions deploy whatsapp-webhook --project-ref $ProjectRef --no-verify-jwt --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase functions deploy whatsapp-send --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npx supabase functions deploy kapso-whatsapp-sync --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploy completado." -ForegroundColor Green
