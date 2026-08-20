# Deploy HaiStore sync (Supabase Edge Function)
# Requiere: supabase login + service role keys de HaiStore y Soporte

$ErrorActionPreference = "Stop"
$ProjectRef = $env:SUPABASE_PROJECT_REF
if (-not $ProjectRef) {
  $ProjectRef = "yxklqaedegfqcbrwodqb"
}

Write-Host "Proyecto HaiSales: $ProjectRef" -ForegroundColor Cyan

$storeKey = $env:HAITECH_STORE_SERVICE_ROLE_KEY
if (-not $storeKey) {
  $storeKey = $env:VITE_HAITECH_STORE_SUPABASE_KEY
}
$soporteKey = $env:HAITECH_SOPORTE_SERVICE_ROLE_KEY
if (-not $soporteKey) {
  $soporteKey = $env:VITE_HAITECH_SOPORTE_SUPABASE_KEY
}

if (-not $storeKey -or -not $soporteKey) {
  Write-Host "Define HAITECH_STORE_SERVICE_ROLE_KEY y HAITECH_SOPORTE_SERVICE_ROLE_KEY (o las VITE_* como fallback)." -ForegroundColor Red
  exit 1
}

$storeUrl = $env:HAITECH_STORE_SUPABASE_URL
if (-not $storeUrl) { $storeUrl = "https://onxmvzfdtiattwporeor.supabase.co" }
$soporteUrl = $env:HAITECH_SOPORTE_SUPABASE_URL
if (-not $soporteUrl) { $soporteUrl = "https://auhvnkckmaesyiaaculz.supabase.co" }
$usd = $env:HAITECH_USD_TO_PEN
if (-not $usd) { $usd = "3.75" }

Write-Host "Configurando secrets..."
npx supabase secrets set --project-ref $ProjectRef `
  "HAITECH_STORE_SUPABASE_URL=$storeUrl" `
  "HAITECH_STORE_SERVICE_ROLE_KEY=$storeKey" `
  "HAITECH_SOPORTE_SUPABASE_URL=$soporteUrl" `
  "HAITECH_SOPORTE_SERVICE_ROLE_KEY=$soporteKey" `
  "HAITECH_USD_TO_PEN=$usd"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Desplegando haitech-sync..."
npx supabase functions deploy haitech-sync --project-ref $ProjectRef --use-api --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploy HaiStore sync completado." -ForegroundColor Green
