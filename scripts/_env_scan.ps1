$searchPaths = @(
  'C:\Program Files\supabase',
  'C:\Users\DELL\AppData\Local\npm',
  'C:\Users\DELL\AppData\Roaming\npm',
  'C:\Program Files (x86)\supabase',
  $env:LOCALAPPDATA + '\npm',
  $env:USERPROFILE + '.supabase',
  'c:\Users\DELL\Desktop\HomeInterior web\home-interior\supabase'
)
Write-Host '--- checking for supabase CLI ---'
foreach ($sp in $searchPaths) {
  $expanded = $sp
  Write-Host "path: $sp"
  if (Test-Path $expanded) {
    Write-Host "  EXISTS"
    $files = Get-ChildItem $expanded -ErrorAction SilentlyContinue | Select-Object -First 5
    if ($files) {
      $files | ForEach-Object { Write-Host "    -> $($_.Name)" }
    }
  } else {
    Write-Host "  absent"
  }
}
Write-Host ''
Write-Host '--- check for any .env files with service_role or access_token ---'
$envFiles = @('.env','.env.local','.env.development','.env.production','supabase\.env','supabase\.env.local','.supabase\config.toml')
foreach ($ef in $envFiles) {
  $full = Join-Path $PWD $ef
  if (Test-Path $full) {
    Write-Host "env file present: $ef"
    $content = Get-Content $full -Raw
    $hasSR = ($content -match 'SERVICE_RO'R' -or $content -match 'service_role')
    $hasAT = ($content -match 'ACCESS_TOKEN' -or $content -match 'access_token' -or $content -match 'SUPABASE_ACCESS')
    $hasDB = ($content -match 'DB_PASSWORD' -or $content -match 'database.password' -or $content -match 'postgres://')
    Write-Host "  has service_role: $hasSR; has access_token: $hasAT; has db url: $hasDB"
  } else {
    Write-Host "env file absent: $ef"
  }
}
Write-Host ''
Write-Host '--- package.json scripts ---'
try {
  $pkg = Get-Content 'C:\Users\DELL\Desktop\HomeInterior web\home-interior\package.json' -Raw | ConvertFrom-Json -ErrorAction Stop
  if ($pkg.scripts) {
    $pkg.scripts.PSObject.Properties | ForEach-Object { Write-Host "  $($_.Name): $($_.Value)" }
  }
} catch {
  Write-Host "Could not parse package.json: $_"
}
