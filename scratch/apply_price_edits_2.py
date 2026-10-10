import re, sys
p = '/home/nirosh/Code/NilathraCollection/src/app/admin-new/page.tsx'
s = open(p).read()
counts = {}

def sub(name, pattern, repl, expected, flags=0):
    global s
    new, n = re.subn(pattern, repl, s, flags=flags)
    counts[name] = (n, expected)
    if n == expected:
        s = new

# 1. Builder (basic track) must not write contracted from master data: restaurant + activity vendor selection (both copies of the handler)
sub('rest_contracted', r"contractedPrice: b\.contractedPrice \?\? contractedPrice,", "contractedPrice: b.contractedPrice,", 1)
sub('rest_contracted_dup', r"contractedPrice: b\.contractedPrice \?\? contractedRate,", "contractedPrice: b.contractedPrice,", 3)
sub('rest_unused_a', r"[ \t]*const contractedPrice = restaurant\.lunch_rate_per_head \|\| 25;\n", "", 1)
sub('rest_unused_b', r"[ \t]*const contractedRate = restaurant\.lunch_rate_per_head \|\| 25;\n", "", 1)

# 2. Meal tile in builder: only set the charged price
sub('meal_tile', r"(mealType: meal\.label,\n)[ \t]*contractedPrice: contractedRate,\n", r"\1", 1)

# 3. Driver block in builder: no contracted from master day_rate; charged markup from app_settings (driver markup), not hard-coded 1.1
sub('driver_block',
    r"contractedPrice: v\.day_rate \|\| 0,\n([ \t]*)agreedPrice: \(v\.day_rate \|\| 0\) \* 1\.1 // fallback markup",
    r"agreedPrice: (v.day_rate || 0) * (1 + ((appSettings?.diver_markup !== undefined ? Number(appSettings.diver_markup) : (Number(appSettings?.driver_markup) || 0)) / 100)) // charged = master rate + app_settings driver markup",
    1)

# 4. Builder hotel drawer: room/block carry only the charged price (pricePerNight); no contracted stamped from the rate card
sub('hotel_room_contracted', r"contractedPrice: contractedPrice,\n([ \t]*)pricePerNight: agreedUnitPrice,", r"pricePerNight: agreedUnitPrice,", 2)
sub('hotel_block_contracted', r"[ \t]*contractedPrice: avgContracted > 0 \? avgContracted : b\.contractedPrice,\n", "", 1)
sub('room_edit_contracted', r"[ \t]*targetRoom\.contractedPrice = value !== '' \? Number\(value\) : 0;\n", "", 1)

# 5. PO -> block restore must not use contracted as the charged price
sub('po_restore_charged', r"agreedPrice: po\.contracted_price \|\| po\.charged_unit_price \|\| 0,", "agreedPrice: po.charged_unit_price || 0,", 1)

for k, v in counts.items():
    print(k, v)
bad = {k: v for k, v in counts.items() if v[0] != v[1]}
if bad:
    print('MISMATCH - not writing', bad); sys.exit(1)
open(p, 'w').write(s)
print('written')
