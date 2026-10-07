import json, os, sys

env = os.environ

payload = {}
payload['SUPABASE_PROJECT_URL_present'] = bool(env.get('SUPABASE_PROJECT_URL') or env.get('NEXT_PUBLIC_SUPABASE_URL'))
payload['SUPABASE_ANON_KEY_present'] = bool(env.get('SUPABASE_ANON_KEY') or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
payload['SUPABASE_SERVICE_ROLE_KEY_present'] = bool(env.get('SUPABASE_SERVICE_ROLE_KEY'))
payload['SUPABASE_DB_PASSWORD_present'] = bool(env.get('SUPABASE_DB_PASSWORD'))
payload['SUPABASE_ACCESS_TOKEN_present'] = bool(env.get('SUPABASE_ACCESS_TOKEN'))
payload['SUPABASE_CLI_found'] = os.path.exists(os.path.join(os.getcwd(), 'node_modules', '.bin', 'supabase'))

print('env key presence:')
for k in ['SUPABASE_PROJECT_URL_present','SUPABASE_ANON_KEY_present','SUPABASE_SERVICE_ROLE_KEY_present','SUPABASE_DB_PASSWORD_present','SUPABASE_ACCESS_TOKEN_present','SUPABASE_CLI_found']:
    print(f'  {k}: {payload[k]}')
