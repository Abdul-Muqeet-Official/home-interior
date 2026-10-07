Get-ChildItem -Recurse -Path 'supabase\migrations' | ForEach-Object {
    $lines = [System.IO.File]::ReadAllLines($_.FullName)
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $l = $lines[$i].Trim()
        if ($l -match '^(CREATE TABLE IF NOT EXISTS|CREATE OR REPLACE|CREATE POLICY|CREATE TRIGGER|CREATE FUNCTION|CREATE UNIQUE INDEX|CREATE INDEX|CREATE TABLE|ALTER TABLE|CREATE SCHEMA|GRANT|REVOKE|INSERT INTO|DELETE FROM|UPDATE|SELECT setval|DELETE FROM|INSERT INTO)' -and $l -match 'storage\.(buckets|objects|bucket_policy_members)') {
            Write-Host "$([math]::Min($_.FullName.Length, 120)): line $($i+1): $l"
        }
    }
}
