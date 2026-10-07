$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
$verbose = $env:CLINE_VERBOSE -eq '1'
$out = supabase --version 2>&1
Write-Host "supabase CLI version line: $out[0]"
if ($verbose) {
  Write-Host "--- supabase help (first 6 lines) ---"
  supabase --help 2>&1 | Select-Object -First 6 | ForEach-Object { Write-Host $_ }
}
Write-Host "--- config.toml check ---"
$cfgPath = Join-Path $PWD 'supabase' 'config.toml'
Write-Host "config.toml exists: $(Test-Path $cfgPath)"
if (Test-Path $cfgPath) {
  $cfg = Get-Content $cfgPath -Raw
  Write-Host "config.toml first 500 chars:"
  Write-Host $cfg.Substring(0, [Math]::Min(500, $cfg.Length))
}
Write-Host "--- remote project status ---"
$linkOut = supabase link 2>&1
$linkOut | ForEach-Object { Write-Host $_ }
Write-Host "--- env var names (values suppressed) ---"
$envVars = @('SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','SUPABASE_DB_PASSWORD','SUPABASE_ACCESS_TOKEN','SUPABASE_PROJECT_ID')
foreach ($v in $envVars) {
  $val = [System.Environment]::GetEnvironmentVariable($v, 'Process')
  $present = [bool]$val
  Write-Host "$v present=$present value_length=$($val?.Length)"
}
