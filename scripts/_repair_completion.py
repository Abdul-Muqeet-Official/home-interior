from pathlib import Path

p = Path('supabase/migrations/20240920_remote_completion.sql')
sql = p.read_text(encoding='utf-8')
lines = sql.splitlines(keepends=True)

# 1) Remove malformed first line if it is just 'C' with no SQL.
if lines[:1] != []:
    first = lines[0].rstrip('\n')
    if first != 'C':
        print('NOTE: first line is not bare C; leaving it as-is:', repr(first[:80]))
    else:
        lines = lines[1:]
        print('Removed bare C first line.')

# 2) Detect + remove duplicate redundant migration header that follows
#    the initial docstring (the block roughly between the SET line and
#    section 1).
#    We look for lines that begin with:
#       supabase/migrations/20240920_remote_completion.sql\n   (possibly commented)
#    right after the first docstring block.

def strip_trailing_newline_block(lines):
    out = []
    i = 0
    n = len(lines)
    while i < n:
        line = lines[i]
        if not line.strip().startswith('-- supabase/migrations/20240920_remote_completion.sql'):
            out.append(line)
            i += 1
            continue
        # found a candidate duplicate-doc header line; consume the contiguous
        # commented block that follows it until we hit a non-comment blank-ish separator.
        j = i + 1
        while j < n and lines[j].strip().startswith('--'):
            j += 1
        # If the whole block is just the duplicate doc header (nothing but comment
        # lines and possibly a blank), drop it. Otherwise keep it.
        block_lines = lines[i:j]
        non_comment_in_block = [ln for ln in block_lines if not ln.strip().startswith('--')]
        if non_comment_in_block:
            out.append(line)
            i += 1
        else:
            print('Removed duplicate doc header block starting near line', i+1)
            i = j
    return out

lines = strip_trailing_newline_block(lines)

# 3) Trim trailing blank lines but keep one final newline if there is content.
while lines and lines[-1].strip() == '':
    lines.pop()
if lines:
    if not lines[-1].endswith('\n'):
        lines[-1] = lines[-1] + '\n'
    else:
        # ensure file ends with exactly one newline after content
        pass

p.write_text(''.join(lines), encoding='utf-8')
print('Rewrote file. Total lines now:', len(lines))
print('Tail sample:', repr(''.join(lines[-3:]).replace('\n','\\n')))
