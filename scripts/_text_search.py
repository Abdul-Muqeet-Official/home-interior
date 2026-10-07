import os, sys, json, pathlib
cwd = os.getcwd()
root = pathlib.Path(cwd)
report = {}
for p in root.rglob('*'):
    if p.is_file():
        try:
            bytes = p.read_bytes()
        except Exception as e:
            continue
        try:
            text = bytes.decode('utf-8')
        except Exception:
            continue
        if 'SUPABASE_ANON_KEY' in text:
            report.setdefault('files_containing_SUPABASE_ANON_KEY', []).append(str(p).replace(cwd, ''))
        if 'SUPABASE_SERVICE_ROLE_KEY' in text:
            report.setdefault('files_containing_SUPABASE_SERVICE_ROLE_KEY', []).append(str(p).replace(cwd, ''))
        if 'SUPABASE_URL' in text or 'NEXT_PUBLIC_SUPABASE' in text:
            report.setdefault('files_containing_SUPABASE_URL_or_NEXT_PUBLIC', []).append(str(p).replace(cwd, ''))
out = {}
for k, v in report.items():
    out[k] = sorted(set(v))
print(json.dumps(out, indent=2))
