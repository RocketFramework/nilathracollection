import re, sys
p = '/home/nirosh/Code/NilathraCollection/src/app/admin-new/page.tsx'
s = open(p).read()
orig = s
counts = {}

def sub(name, pattern, repl, expected, flags=re.S):
    global s
    new, n = re.subn(pattern, repl, s, flags=flags)
    counts[name] = (n, expected)
    if n == expected:
        s = new

# (a) new driver assignment: contracted stays empty until negotiated (final track)
sub('driver_new_contracted',
    r"contracted_per_day_rate: baseRate,\n(\s*)contracted_accommodation_cost: 0,",
    r"contracted_per_day_rate: 0, // not negotiated yet (final track sets this)\n\1contracted_accommodation_cost: 0,", 1)

# (b) preserve every saved field for OTHER drivers; no cross-fallback
sub('other_drivers_payload',
    r"contracted_per_day_rate: Number\(dAss\.contracted_per_day_rate \?\? dAss\.per_day_rate \?\? 0\),\n(\s*)charged_per_day_rate: Number\(dAss\.charged_per_day_rate \?\? dAss\.per_day_rate \?\? 0\),",
    r"contracted_per_day_rate: Number(dAss.contracted_per_day_rate ?? dAss.per_day_rate ?? 0),\n\1contracted_accommodation_cost: Number(dAss.contracted_accommodation_cost ?? 0),\n\1contracted_meal_cost: Number(dAss.contracted_meal_cost ?? 0),\n\1contracted_other_allowance: Number(dAss.contracted_other_allowance ?? 0),\n\1charged_per_day_rate: Number(dAss.charged_per_day_rate ?? 0),\n\1charged_accommodation_cost: Number(dAss.charged_accommodation_cost ?? 0),\n\1charged_meal_cost: Number(dAss.charged_meal_cost ?? 0),\n\1charged_other_allowance: Number(dAss.charged_other_allowance ?? 0),", 1)

# (c) driver-selection load: charged must not fall back to contracted
sub('driver_load_charged',
    r"Number\(row\.charged_per_day_rate \?\? row\.contracted_per_day_rate \?\? row\.per_day_rate \?\? 0\) \+\n(\s*)Number\(row\.charged_accommodation_cost \?\? row\.contracted_accommodation_cost \?\? row\.accommodation_cost \?\? 0\) \+\n\s*Number\(row\.charged_meal_cost \?\? row\.contracted_meal_cost \?\? row\.meal_cost \?\? 0\) \+\n\s*Number\(row\.charged_other_allowance \?\? row\.contracted_other_allowance \?\? row\.other_allowance \?\? 0\);",
    r"Number(row.charged_per_day_rate ?? 0) +\n\1Number(row.charged_accommodation_cost ?? 0) +\n\1Number(row.charged_meal_cost ?? 0) +\n\1Number(row.charged_other_allowance ?? 0);", 1)

# (d) final-track rate inputs: editing the contracted (negotiated) rate must NOT touch charged
sub('rate_input_charged_copy_a',
    r"contractedPrice: contracted,\n(\s*)chargedPrice: contracted\n", r"contractedPrice: contracted\n", 2, flags=0)
sub('rate_input_charged_copy_b',
    r"contractedPrice: contracted,\n(\s*)chargedPrice: contracted,\n", r"contractedPrice: contracted,\n", 1, flags=0)

for k, v in counts.items():
    print(k, v)
if any(n != e for n, e in counts.values()):
    print('MISMATCH - not writing'); sys.exit(1)
open(p, 'w').write(s)
print('written')
