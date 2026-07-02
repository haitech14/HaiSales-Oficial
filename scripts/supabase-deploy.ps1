# Ejecutar tras: supabase login
Write-Host "Enlazando proyecto Supabase..."
npm run supabase:link
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Aplicando migraciones..."
npm run supabase:push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Regenerando tipos TypeScript..."
npm run supabase:types
exit $LASTEXITCODE
