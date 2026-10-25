base = "src/app/admin/(authenticated)/master-data/components/"
marker = '<p className="text-[10px] text-neutral-400 mt-2">Required if adding or updating payment details to ensure accuracy.</p>'
for f in ["Vendor", "Restaurant", "TransportProvider", "Hotel", "TourGuide", "Driver"]:
    p = base + f + "FormModal.tsx"
    s = open(p).read()
    assert s.count(marker) == 1, (f, s.count(marker))
    link = (
        "{formData.payment_details?.proof_url && (\n"
        "                                    <a href={formData.payment_details.proof_url} target=\"_blank\" rel=\"noreferrer\" className=\"text-xs text-brand-green font-bold hover:underline block mt-2\">View current bank slip/document</a>\n"
        "                                )}\n"
        "                                "
    )
    s = s.replace(marker, link + marker)
    open(p, "w").write(s)

p = "src/services/master-data-approvals.service.ts"
s = open(p).read()
old = "            const { entity_type, proposed_data } = approvalData;\n"
new = (
    "            const { entity_type, proof_image_url } = approvalData;\n"
    "            const proposed_data = proof_image_url && approvalData.proposed_data?.payment_details\n"
    "                ? { ...approvalData.proposed_data, payment_details: { ...approvalData.proposed_data.payment_details, proof_url: proof_image_url } }\n"
    "                : approvalData.proposed_data;\n"
)
assert old in s
open(p, "w").write(s.replace(old, new))
print("ok")
