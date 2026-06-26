import sys

filepath = "/home/nirosh/Code/NilathraCollection/src/app/admin-new/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Let's define the exact target block of code to search for
target_start = "                                {blockQuotes.length === 0 ? ("
target_end = "                          );\n                        });"

start_idx = content.find(target_start)
end_idx = content.find(target_end)

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end block in content.")
    sys.exit(1)

print("Found start_idx:", start_idx, "end_idx:", end_idx)

# Let's verify the section being replaced
section_to_replace = content[start_idx:end_idx]
print("Section to replace starts with:\n", section_to_replace[:300])
print("Section to replace ends with:\n", section_to_replace[-300:])

replacement = """                                {blockQuotes.length === 0 ? (
                                  <p className="text-[11px] text-neutral-400 italic">No alternative hotel bids or RFQs dispatch logs found for this stay block.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {blockQuotes.map((blockQuote) => {
                                      const quote = blockQuote.quotation;
                                      if (!quote) return null;
                                      const isSelected = hotel?.id === quote.vendor_id;

                                      return (
                                        <div key={blockQuote.id} className={`p-4 rounded-2xl border flex flex-col gap-3 transition-all bg-white ${
                                          isSelected ? 'border-emerald-805/30 bg-emerald-50/5 ring-1 ring-emerald-805/10' : 'border-neutral-200'
                                        }`}>
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-neutral-800">{quote.vendor_name}</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                                  isSelected ? 'bg-emerald-805 text-white' :
                                                  quote.status === 'Replied' ? 'bg-amber-100 text-amber-800' :
                                                  'bg-neutral-100 text-neutral-600'
                                                }`}>
                                                  {isSelected ? 'Active / Selected' : quote.status}
                                                </span>
                                              </div>
                                              {quote.replied_date && (
                                                <p className="text-[9px] text-neutral-405 mt-0.5">
                                                  Replied: {new Date(quote.replied_date).toLocaleDateString()}
                                                </p>
                                              )}
                                              {quote.notes && (
                                                <p className="text-[10px] text-neutral-500 mt-1 italic">"{quote.notes}"</p>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                              {quote.quoted_price !== undefined && quote.quoted_price !== null && (
                                                <span className="text-xs font-bold text-emerald-805">${quote.quoted_price}</span>
                                              )}

                                              {/* Action Buttons */}
                                              {!isSelected && (
                                                <button
                                                  onClick={() => handleSelectBlockCandidateHotel(block, quote)}
                                                  disabled={isLockedByOther || block.has_finalized}
                                                  className="px-3 py-1.5 bg-emerald-805 hover:bg-emerald-900 text-white rounded-xl text-[10px] font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                                >
                                                  Select Hotel
                                                </button>
                                              )}
                                              <button
                                                onClick={() => openEditRfqModal(blockQuote)}
                                                disabled={isLockedByOther || block.has_finalized}
                                                className="px-2.5 py-1.5 border border-neutral-205 hover:bg-neutral-55 text-neutral-655 rounded-xl text-[10px] font-bold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                              >
                                                Edit
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Unified RFQ/RFP Email Dispatch Logs for this Block */}
                                {(() => {
                                  const blockRfqEmails = rfqEmails.filter(e => e.po_block_id === block.id);
                                  const blockRfpEmails = rfpEmails.filter(e => e.po_block_id === block.id);
                                  const combinedBlockEmails = [
                                    ...blockRfqEmails.map(e => ({ ...e, logType: 'RFQ' as const })),
                                    ...blockRfpEmails.map(e => ({ ...e, logType: 'RFP' as const }))
                                  ].sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());

                                  if (combinedBlockEmails.length === 0) return null;

                                  return (
                                    <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                                      <h6 className="text-[11px] font-bold text-neutral-605 uppercase tracking-wider flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-neutral-500" />
                                        RFQ & RFP Email Dispatch History ({combinedBlockEmails.length})
                                      </h6>
                                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                        {combinedBlockEmails.map((emailLog) => {
                                          const emailId = emailLog.id;
                                          const isEmailBodyExpanded = expandedEmailId === emailId;
                                          return (
                                            <div key={emailId} className="border border-neutral-200 rounded-xl p-3 bg-neutral-50/50 shadow-sm space-y-2">
                                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${
                                                    emailLog.logType === 'RFQ' 
                                                      ? 'bg-emerald-805/10 text-emerald-805 border border-emerald-805/20' 
                                                      : 'bg-amber-650/10 text-amber-707 border border-amber-650/20'
                                                  }`}>
                                                    {emailLog.logType === 'RFQ' ? 'RFQ' : 'RFP / PO'}
                                                  </span>
                                                  <span className="text-[9px] font-mono text-neutral-400">
                                                    {new Date(emailLog.sent_at).toLocaleString()}
                                                  </span>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => setExpandedEmailId(isEmailBodyExpanded ? null : emailId)}
                                                  className="text-[9px] text-emerald-850 font-bold hover:underline"
                                                >
                                                  {isEmailBodyExpanded ? 'Hide Details' : 'Show Details'}
                                                </button>
                                              </div>

                                              <div className="text-[10px] space-y-0.5 text-neutral-600">
                                                <div><span className="font-semibold text-neutral-400">To:</span> <span className="font-mono">{emailLog.recipient_email}</span></div>
                                                <div><span className="font-semibold text-neutral-400">Subject:</span> <span className="font-bold text-neutral-707">{emailLog.subject}</span></div>
                                              </div>

                                              {isEmailBodyExpanded && (
                                                <div className="mt-2 pt-2 border-t border-neutral-150">
                                                  <div 
                                                    className="text-[10px] text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-150 overflow-x-auto max-h-[200px] font-sans prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: emailLog.body_html }}
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
"""

new_content = content[:start_idx] + replacement + content[end_idx:]

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement written successfully!")
