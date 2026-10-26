import re
from pathlib import Path

src = Path("worker/seed-frcrce.sql").read_text(encoding="utf-8")

lines = []
for line in src.splitlines():
    line = re.sub(r'([a-f0-9]{2})0000000-', r'\g<1>000000-', line)
    if line.startswith("INSERT INTO profiles") or line.startswith("INSERT INTO venues"):
        line = re.sub(r',\s*0\);', ', FALSE);', line)
        line = re.sub(r',\s*1\);', ', TRUE);', line)
    lines.append(line)
text = "\n".join(lines)

# Convert strftime to Postgres intervals
def repl_strftime(m):
    s = m.group(1)
    m_day = re.search(r'([+-]?\d+(?:\.\d+)?)\s*days', s)
    m_min = re.search(r'([+-]?\d+(?:\.\d+)?)\s*minutes', s)
    m_hour = re.search(r'([+-]?\d+(?:\.\d+)?)\s*hours', s)
    days = int(round(float(m_day.group(1)))) if m_day else 0
    mins = int(round(float(m_min.group(1)))) if m_min else 0
    hours = int(round(float(m_hour.group(1)))) if m_hour else 0
    if 'start of day' in s:
        return f"date_trunc('day', now() + interval '{days} days') + interval '{mins} minutes'"
    elif m_hour or m_day:
        return f"now() + interval '{days} days' + interval '{hours} hours'"
    return "now()"

text = re.sub(r"strftime\('%Y-%m-%dT%H:%M:%fZ',([^)]+)\)", repl_strftime, text)

# Write to backend/seed/seed.sql
out_path = Path("backend/seed/seed.sql")
out_path.write_text(text, encoding="utf-8")
print(f"Converted successfully to {out_path}. Lines: {len(text.splitlines())}")
