# Ejecutar tras: supabase login
# Alternativa CI/CD: $env:SUPABASE_ACCESS_TOKEN = "tu-token"
if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Host "AVISO: Sin SUPABASE_ACCESS_TOKEN. Ejecuta 'supabase login' si link falla." -ForegroundColor Yellow
}
Write-Host "Enlazando proyecto Supabase..."
npm run supabase:link
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Aplicando migraciones..."
npm run supabase:push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Regenerando tipos TypeScript..."
npm run supabase:types
exit $LASTEXITCODE
