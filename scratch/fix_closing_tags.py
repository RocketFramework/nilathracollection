import re

filepath = "/home/nirosh/Code/NilathraCollection/src/app/admin-new/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Let's inspect the file around lines 6370 to 6375 (0-indexed 6369 to 6374)
print("Before correction:")
for i in range(6368, 6376):
    print(i, repr(lines[i]))

# Update lines
lines[6371] = "                                            </div>\n"
lines[6372] = "                                          </div>\n"
lines[6373] = "                                        </div>\n"
lines[6374] = "                                      );\n"

print("After correction:")
for i in range(6368, 6376):
    print(i, repr(lines[i]))

with open(filepath, "w", encoding="utf-8") as f:
    f.writelines(lines)
