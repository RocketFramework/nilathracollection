import re
base = "src/app/admin/(authenticated)/master-data/components/"
# file, save action, variable passed, type cast
targets = [
    ("VendorFormModal.tsx", "saveVendorAction", "formData", "Vendor"),
    ("RestaurantFormModal.tsx", "saveRestaurantAction", "formData", "Restaurant"),
    ("TransportProviderFormModal.tsx", "saveTransportProviderAction", "formData", "TransportProvider"),
    ("HotelFormModal.tsx", "saveHotelAction", "submissionData", "Hotel"),
    ("TourGuideFormModal.tsx", "saveTourGuideAction", "formData", "TourGuide"),
    ("DriverFormModal.tsx", "saveDriverAction", "formData", "Driver"),
]
for fname, action, var, typ in targets:
    p = base + fname
    s = open(p).read()
    # import
    s, n = re.subn(r"(import \{[^}]*?)\b" + action + r"\b", r"\1" + action + ", uploadPaymentProofAction", s, count=1)
    assert n == 1, fname
    pat = re.compile(r"(\n[ ]*)const (res|response) = await " + action + r"\(" + var + r" as " + typ + r"\);")
    m = pat.search(s)
    assert m, fname
    ind = m.group(1)
    block = (
        f"{ind}let payloadWithProof: any = {var};"
        f"{ind}if (proofImage) {{"
        f"{ind}    const proofFd = new FormData();"
        f"{ind}    proofFd.append(\"file\", proofImage);"
        f"{ind}    const proofRes = await uploadPaymentProofAction(proofFd);"
        f"{ind}    if (proofRes.error || !proofRes.url) throw new Error(proofRes.error || \"Failed to upload bank slip\");"
        f"{ind}    payloadWithProof = {{ ...{var}, payment_details: {{ ...({var}.payment_details || {{}}), proof_url: proofRes.url }} }};"
        f"{ind}}}"
    )
    new_call = f"{ind}const {m.group(2)} = await {action}(payloadWithProof as {typ});"
    s = s[:m.start()] + block + new_call + s[m.end():]
    open(p, "w").write(s)
    print("patched", fname)
