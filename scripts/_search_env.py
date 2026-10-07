import os, json, pathlib
out = {}
for p in pathlib.Path('.').rglob('*'):
    if not p.is_file():
        continue
    try:
        bytes = p.read_bytes()
    except Exception:
        continue
    try:
        text = bytes.decode('utf-8')
    except Exception:
        continue
    low = text.lower()
    if 'supabase_anon_key' in low or 'service_role_key' in low or 'next_public_supabase' in low or 'supabase_project_url' in low:
        out.setdefault('env_or_key_files', []).append(str(p).replace(os.getcwd(), ''))
    if 'allgood' in low and (os.path.basename(str(p)).startswith('_supabase') or os.path.basename(str(p)).startswith('supabase_job')):
        out.setdefault('job_like_files_with_allgood', []).append(str(p).replace(os.getcwd(), ''))
print(json.dumps(out, indent=2))
