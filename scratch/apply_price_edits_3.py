import re, sys
p = '/home/nirosh/Code/NilathraCollection/src/app/admin-new/page.tsx'
s = open(p).read()
log = []

def seg_replace(name, start, end, new, inject_after_marker=None):
    """Replace text from `start` through the end of `end` (first occurrence after start)."""
    global s
    i = s.find(start)
    if i < 0:
        log.append((name, 'START NOT FOUND')); return False
    j = s.find(end, i)
    if j < 0:
        log.append((name, 'END NOT FOUND')); return False
    j += len(end)
    seg_end = j
    s = s[:i] + new + s[j:]
    if inject_after_marker:
        k = s.find(inject_after_marker, i + len(new))
        if k < 0:
            log.append((name, 'INJECT MARKER NOT FOUND')); return False
        # find the 'contractedTotal,\n' inside the following push
        m = s.find('contractedTotal,\n', k)
        indent_start = s.rfind('\n', 0, m) + 1
        indent = s[indent_start:m]
        s = s[:m] + 'contractedTotal,\n' + indent + 'contractedNegotiated,\n' + s[m + len('contractedTotal,\n'):]
    log.append((name, 'ok'))
    return True

# 1. supplier daily_activities rows
seg_replace('da_items',
    "        let contractedTotal = da.contracted_total_price !== undefined",
    "        let chargedPrice = Number(da.charged_unit_price) || (da.quantity > 0 ? chargedTotal / da.quantity : chargedTotal);\n",
    """        // Charged = saved charged columns only (never derived from contracted).
        let chargedTotal = da.charged_total_price !== undefined && da.charged_total_price !== null && Number(da.charged_total_price) > 0
          ? Number(da.charged_total_price)
          : (Number(da.charged_unit_price) > 0 ? Number(da.charged_unit_price) * (da.quantity || 1) : 0);
        let chargedPrice = Number(da.charged_unit_price) || (da.quantity > 0 ? chargedTotal / da.quantity : chargedTotal);

        // Contracted = saved final-track value; if not negotiated yet, DISPLAY-ONLY estimate = charged x 0.9 (flagged).
        const savedContractedTotal = da.contracted_total_price !== undefined && da.contracted_total_price !== null
          ? Number(da.contracted_total_price)
          : (Number(da.contracted_price) || 0) * (da.quantity || 1);
        const resolvedContracted = PriceResolutionService.resolveContractedForDisplay(savedContractedTotal, chargedTotal);
        const contractedNegotiated = resolvedContracted.negotiated;
        let contractedTotal = resolvedContracted.value;
        let contractedPrice = contractedNegotiated
          ? (Number(da.contracted_price) || (da.quantity > 0 ? contractedTotal / da.quantity : contractedTotal))
          : (da.quantity > 0 ? contractedTotal / da.quantity : contractedTotal);
""", inject_after_marker="return {\n          dailyActivityId: da.id,")

# 2. driver assignments
seg_replace('driver_items',
    "          const contractedTotal =\n            Number(driverAss.contracted_per_day_rate",
    "          const chargedPrice = chargedTotal;\n",
    """          const savedContractedTotal =
            Number(driverAss.contracted_per_day_rate ?? driverAss.per_day_rate ?? 0) +
            Number(driverAss.contracted_accommodation_cost ?? driverAss.accommodation_cost ?? 0) +
            Number(driverAss.contracted_meal_cost ?? driverAss.meal_cost ?? 0) +
            Number(driverAss.contracted_other_allowance ?? driverAss.other_allowance ?? 0);

          // Charged = saved charged columns only (no fallback to contracted).
          const chargedTotal =
            Number(driverAss.charged_per_day_rate ?? 0) +
            Number(driverAss.charged_accommodation_cost ?? 0) +
            Number(driverAss.charged_meal_cost ?? 0) +
            Number(driverAss.charged_other_allowance ?? 0);

          const resolvedContracted = PriceResolutionService.resolveContractedForDisplay(savedContractedTotal, chargedTotal);
          const contractedNegotiated = resolvedContracted.negotiated;
          const contractedTotal = resolvedContracted.value;
          const contractedPrice = contractedTotal;
          const chargedPrice = chargedTotal;
""", inject_after_marker="supplierPLItems.push({\n            dailyActivityId: driverAss.id")

# 3. driver fallback rows (no invented $15 defaults)
seg_replace('driver_fallback',
    "        let contractedTotal = 15;\n        let chargedTotal = 15;",
    "          chargedTotal = sumCharged > 0 ? sumCharged : contractedTotal;\n        }\n",
    """        // No driver assignment saved: use saved travel-activity prices only (no invented default amounts).
        let sumContracted = 0;
        let chargedTotal = 0;
        dayTravelActs.forEach(act => {
          sumContracted += Number(act.contracted_total_price ?? act.contracted_price ?? 0);
          chargedTotal += Number(act.charged_total_price ?? act.charged_unit_price ?? 0);
        });
        const resolvedContracted = PriceResolutionService.resolveContractedForDisplay(sumContracted, chargedTotal);
        const contractedNegotiated = resolvedContracted.negotiated;
        const contractedTotal = resolvedContracted.value;
""", inject_after_marker="dailyActivityId: `driver-day-${dayNum}-fallback`")

# 4. vehicle assignments
seg_replace('vehicle_items',
    "        const contractedTotal =\n          Number(vehicleAss.contracted_per_day_rate",
    "        const chargedPrice = chargedTotal;\n",
    """        const savedContractedTotal =
          Number(vehicleAss.contracted_per_day_rate ?? vehicleAss.per_day_rate ?? 0) +
          Number(vehicleAss.contracted_excess_mileage_cost ?? vehicleAss.excess_mileage_cost ?? 0) +
          Number(vehicleAss.contracted_other_allowance ?? vehicleAss.other_allowance ?? 0);

        // Charged = saved charged columns only (no fallback to contracted).
        const chargedTotal =
          Number(vehicleAss.charged_per_day_rate ?? 0) +
          Number(vehicleAss.charged_excess_mileage_cost ?? 0) +
          Number(vehicleAss.charged_other_allowance ?? 0);

        const resolvedContracted = PriceResolutionService.resolveContractedForDisplay(savedContractedTotal, chargedTotal);
        const contractedNegotiated = resolvedContracted.negotiated;
        const contractedTotal = resolvedContracted.value;
        const contractedPrice = contractedTotal;
        const chargedPrice = chargedTotal;
""", inject_after_marker="dailyActivityId: vehicleAss.id")

# 5. P&L table: label estimated contracted values
old = "Unit: ${item.contractedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({formatLkr(item.contractedPrice)})</div>\n"
if s.count(old) == 1:
    i = s.find(old)
    line_start = s.rfind('\n', 0, i) + 1
    indent = s[line_start:i]
    indent = indent[:len(indent) - len(indent.lstrip())]
    s = s.replace(old, old + indent + "{item.contractedNegotiated === false && (\n" + indent + "  <div className=\"text-[9px] text-amber-600 font-bold mt-0.5\">{NOT_NEGOTIATED_LABEL} (est. 90% of charged)</div>\n" + indent + ")}\n")
    log.append(('pl_label', 'ok'))
else:
    log.append(('pl_label', 'count=%d' % s.count(old)))

# 6. import
if "price-resolution.service" not in s:
    s = re.sub(r"^import ", "import { PriceResolutionService, NOT_NEGOTIATED_LABEL } from '@/services/price-resolution.service';\nimport ", s, count=1, flags=re.M)
    log.append(('import', 'ok'))

for l in log: print(l)
if any(l[1] != 'ok' for l in log):
    print('PROBLEM - not writing'); sys.exit(1)
open(p, 'w').write(s)
print('written')
