import re

with open("src/app/admin/(authenticated)/planner/steps/FinanceAndBookingStep.tsx", "r") as f:
    content = f.read()

# Replace state variables
content = content.replace('    const [activePOId, setActivePOId] = useState<string | null>(null);\n    const [isSyncing, setIsSyncing] = useState(false);', 
'''    const [activePOId, setActivePOId] = useState<string | null>(null);
    const [editingPO, setEditingPO] = useState<DBPurchaseOrder | null>(null);
    const [isSavingPO, setIsSavingPO] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);''')

# Insert helper functions before updatePOStatus
helpers_str = '''
    const openPODrawer = (poId: string, poObj?: any) => {
        setActivePOId(poId);
        if (poObj) {
            setEditingPO(JSON.parse(JSON.stringify(poObj)));
        } else {
            const po = dbPOs.find(p => p.id === poId);
            if (po) setEditingPO(JSON.parse(JSON.stringify(po)));
        }
    };

    const closePODrawer = () => {
        setActivePOId(null);
        setEditingPO(null);
    };

    const saveEditedPO = async () => {
        if (!editingPO) return;
        setIsSavingPO(true);
        try {
            await savePurchaseOrderAction(editingPO, editingPO.items || []);
            await loadPOs();
            alert("Purchase Order Saved Successfully.");
        } catch (error) {
            console.error("Failed to save PO", error);
            alert("Failed to save Purchase Order.");
        } finally {
            setIsSavingPO(false);
        }
    };

    const updateLocalPOStatus = async (newStatus: POStatus) => {
        if (!editingPO) return;
        const updated = { ...editingPO, status: newStatus };
        setEditingPO(updated);
        setIsSavingPO(true);
        try {
            await savePurchaseOrderAction(updated, updated.items || []);
            await loadPOs();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsSavingPO(false);
        }
    };
'''

content = content.replace('    const updatePOStatus = async (po: DBPurchaseOrder, newStatus: POStatus) => {', helpers_str + '\n    const updatePOStatus = async (po: DBPurchaseOrder, newStatus: POStatus) => {')


create_manual_po = '''            await savePurchaseOrderAction(newPO, []);
            await loadPOs();
            openPODrawer(newPO.id, newPO);
            setIsCreatingManual(false);'''

content = content.replace('''            await savePurchaseOrderAction(newPO, []);
            await loadPOs();
            setActivePOId(newPO.id);
            setIsCreatingManual(false);''', create_manual_po)


delete_po = '''        try {
            await deletePurchaseOrderAction(id);
            await loadPOs();
            if (activePOId === id) closePODrawer();
        } catch (error) {'''

content = content.replace('''        try {
            await deletePurchaseOrderAction(id);
            await loadPOs();
            if (activePOId === id) setActivePOId(null);
        } catch (error) {''', delete_po)


local_add_items = '''
    const addLocalPOItem = () => {
        setEditingPO(prev => {
            if (!prev) return null;
            const newItem: Partial<DBPurchaseOrderItem> = {
                id: crypto.randomUUID(),
                description: 'New Service Item',
                unit_price: 0,
                quantity: 1,
                total_price: 0
            };
            const updatedItems = [...(prev.items || []), newItem];
            const newTotal = updatedItems.reduce((sum, i: any) => sum + (i.total_price || 0), 0);
            return { ...prev, items: updatedItems as DBPurchaseOrderItem[], total_amount: newTotal, subtotal: newTotal };
        });
    };

    const deleteLocalPOItem = (itemId: string) => {
        setEditingPO(prev => {
            if (!prev) return null;
            const updatedItems = (prev.items || []).filter(item => item.id !== itemId);
            const newTotal = updatedItems.reduce((sum, i) => sum + (i.total_price || 0), 0);
            return { ...prev, items: updatedItems, total_amount: newTotal, subtotal: newTotal };
        });
    };

    const updateLocalPOItem = (itemId: string, updates: Partial<DBPurchaseOrderItem>) => {
        setEditingPO(prev => {
            if (!prev) return null;
            const updatedItems = (prev.items || []).map(item => {
                if (item.id === itemId) {
                    const refreshed = { ...item, ...updates };
                    refreshed.total_price = (refreshed.unit_price || 0) * (refreshed.quantity || 1);
                    return refreshed;
                }
                return item;
            });
            const newTotal = updatedItems.reduce((sum, i) => sum + (i.total_price || 0), 0);
            return { ...prev, items: updatedItems, total_amount: newTotal, subtotal: newTotal };
        });
    };
'''

content = content.replace('    const activePO = useMemo(() => dbPOs.find(po => po.id === activePOId), [dbPOs, activePOId]);', local_add_items + '\n    const activePO = useMemo(() => dbPOs.find(po => po.id === activePOId), [dbPOs, activePOId]);')

invoice_local = '''
    const generateInvoiceLocal = async (po: DBPurchaseOrder) => {
        if (po.invoices && po.invoices.length > 0) {
            alert("A supplier invoice already exists for this PO.");
            return;
        }
        setIsSavingPO(true);
        try {
            await savePurchaseOrderAction(po, po.items || []);
            const newInvoice: Partial<DBSupplierInvoice> = {
                purchase_order_id: po.id,
                invoice_number: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                amount: po.total_amount,
                status: 'Pending',
                invoice_date: new Date().toISOString().split('T')[0],
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            };
            await saveSupplierInvoiceAction(newInvoice);
            setEditingPO(prev => prev ? { ...prev, invoices: [...(prev.invoices || []), newInvoice as any] } : null);
            await loadPOs();
        } catch (error) {
            console.error("Failed to generate invoice", error);
        } finally {
            setIsSavingPO(false);
        }
    };

    const updateInvoiceStatusLocal = async (invoice: DBSupplierInvoice, newStatus: DBSupplierInvoice['status']) => {
        try {
            await saveSupplierInvoiceAction({ ...invoice, status: newStatus });
            setEditingPO(prev => {
                if (!prev) return null;
                const updatedInvoices = (prev.invoices || []).map(i => i.id === invoice.id ? { ...i, status: newStatus } : i);
                return { ...prev, invoices: updatedInvoices };
            });
            await loadPOs();
        } catch (error) {
            console.error("Failed to update invoice status", error);
        }
    };
'''

content = content.replace('    const updateInvoiceStatus = async (invoice: DBSupplierInvoice, newStatus: DBSupplierInvoice[\'status\']) => {', invoice_local + '\n    const updateInvoiceStatus = async (invoice: DBSupplierInvoice, newStatus: DBSupplierInvoice[\'status\']) => {')

content = content.replace('onClick={(e) => { e.stopPropagation(); setActivePOId(activePOId === po.id ? null : po.id); }}', 'onClick={(e) => { e.stopPropagation(); if (activePOId === po.id) closePODrawer(); else openPODrawer(po.id); }}')


drawer_start = content.find("{/* PO Detail Side Drawer */}")
drawer_end = content.find("{/* Legacy Cost Breakdown (Optional - and Selling Price Control) */}")

drawer_content = content[drawer_start:drawer_end]

drawer_content = drawer_content.replace("{activePOId && (", "{activePOId && editingPO && (")
drawer_content = drawer_content.replace("setActivePOId(null)", "closePODrawer()")

drawer_content = drawer_content.replace("activePO?", "editingPO?")
drawer_content = drawer_content.replace("activePO.", "editingPO.")
drawer_content = drawer_content.replace("!activePO ", "!editingPO ")
drawer_content = drawer_content.replace("activePO &&", "editingPO &&")

drawer_content = re.sub(
    r'onChange=\{\(e\) => editingPO && savePurchaseOrderAction\(\{ \.\.\.editingPO, ([a-zA-Z0-9_]+): ([^}]+) \}, editingPO\.items \|\| \[\]\)\.then\(\(\) => loadPOs\(\)\)\}',
    r'onChange={(e) => setEditingPO(prev => prev ? { ...prev, \1: \2 } : null)}',
    drawer_content
)

drawer_content = re.sub(
    r'updatePOStatus\(editingPO, (\'[^\']+\')\)',
    r'updateLocalPOStatus(\1)',
    drawer_content
)

drawer_content = drawer_content.replace("generateInvoice(editingPO)", "generateInvoiceLocal(editingPO)")

drawer_content = drawer_content.replace("updateInvoiceStatus(inv, e.target.value as any)", "updateInvoiceStatusLocal(inv, e.target.value as any)")

drawer_content = drawer_content.replace("addPOItem(editingPO)", "addLocalPOItem()")
drawer_content = drawer_content.replace("deletePOItem(editingPO, item.id)", "deleteLocalPOItem(item.id)")
drawer_content = drawer_content.replace("updatePOItem(editingPO, item.id,", "updateLocalPOItem(item.id,")

drawer_content = drawer_content.replace("savePurchaseOrderAction({ ...editingPO, ...updates }, editingPO.items || []).then(() => loadPOs());", "setEditingPO(prev => prev ? { ...prev, ...updates } : null);")

drawer_content = drawer_content.replace("setPreviewPO(editingPO)", "setPreviewPO(editingPO as any)") # just in case type is mismatched

button_html = """                            <div className="p-8 border-t bg-neutral-50 flex items-center justify-between">
                                <button
                                    onClick={saveEditedPO}
                                    disabled={isSavingPO}
                                    className="px-8 py-3 bg-brand-gold text-white font-bold rounded-2xl hover:bg-yellow-600 transition-all flex items-center gap-2 shadow-lg"
                                >
                                    {isSavingPO ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                                    {isSavingPO ? 'Saving...' : 'Save PO Changes'}
                                </button>
                                <div className="flex flex-col text-right">"""

drawer_content = drawer_content.replace("""                            <div className="p-8 border-t bg-neutral-50 flex items-center justify-between">
                                <div className="flex flex-col">""", button_html)

new_content = content[:drawer_start] + drawer_content + content[drawer_end:]

with open("src/app/admin/(authenticated)/planner/steps/FinanceAndBookingStep.tsx", "w") as f:
    f.write(new_content)

