import re

filepath = "/home/nirosh/Code/NilathraCollection/src/app/admin-new/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Locate line 6372 (0-indexed 6371)
target_line = lines[6371]
print("Target line at 6371 (0-indexed):", repr(target_line))

if ")}" in target_line:
    lines[6371] = ""
    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Successfully removed stray bracket line.")
else:
    print("Warning: target line did not match expected ')}'")
