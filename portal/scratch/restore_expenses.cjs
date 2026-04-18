const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Restore Status Badge in Expenses Form
const expenseHeaderRowBadge = `            <button onClick={cancelForm} className="btn-portal-outline">BACK TO LIST</button>`;
const restoredStatusBadge = `            {editingId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.4 }}>STATUS</span>
                <span className="portal-badge" style={{ background: statusColors[currentStatus], color: statusText[currentStatus], border: 'none', padding: '6px 16px' }}>
                  {currentStatus.toUpperCase()}
                </span>
              </div>
            )}
            <button onClick={cancelForm} className="btn-portal-outline">BACK TO LIST</button>`;

// Find the Expenses component start and then search for the badge location
const parts = content.split('/* ——— EXPENSES ——— */');
if (parts.length > 1) {
    let expensePart = parts[1];
    expensePart = expensePart.replace(expenseHeaderRowBadge, restoredStatusBadge);
    
    // 2. Restore Approval Buttons in Expenses Form
    const expenseFormSubmitBlock = `               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 16 }}>
                 <button disabled={loading || !selectedAccountId} type="submit" className="btn-portal-primary" style={{ width: '100%', height: 48 }}>
                   {loading ? 'POSTING...' : editingId ? 'UPDATE RECORD' : 'CREATE EXPENSE'}
                 </button>
               </div>`;

    const restoredButtonsBlock = `               <div style={{ display: 'grid', gridTemplateColumns: editingId && isAdmin ? '1fr 1fr' : '1fr', gap: 16, marginTop: 16 }}>
                  {editingId && isAdmin && (
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                       <button 
                         type="button"
                         onClick={() => handleBulkStatus('approved', [editingId])}
                         className="btn-batch btn-batch--approve" 
                         style={{ 
                           width: '100%', justifyContent: 'center', height: 48, borderRadius: 8,
                           border: currentStatus === 'approved' ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.05)',
                           background: currentStatus === 'approved' ? 'rgba(34,197,94,0.15)' : undefined,
                           boxShadow: currentStatus === 'approved' ? '0 0 15px rgba(34,197,94,0.1)' : 'none',
                           opacity: currentStatus === 'approved' ? 1 : 0.4
                         }}
                       >
                          APPROVE
                       </button>
                       <button 
                         type="button"
                         onClick={() => handleBulkStatus('rejected', [editingId])}
                         className="btn-batch btn-batch--reject"
                         style={{ 
                           width: '100%', justifyContent: 'center', height: 48, borderRadius: 8,
                           border: currentStatus === 'rejected' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.05)',
                           background: currentStatus === 'rejected' ? 'rgba(239,68,68,0.15)' : undefined,
                           boxShadow: currentStatus === 'rejected' ? '0 0 15px rgba(239,68,68,0.1)' : 'none',
                           opacity: currentStatus === 'rejected' ? 1 : 0.4
                         }}
                       >
                          REJECT
                       </button>
                     </div>
                  )}
                  <button disabled={loading || !selectedAccountId} type="submit" className="btn-portal-primary" style={{ width: '100%', height: 48 }}>
                    {loading ? 'POSTING...' : editingId ? 'UPDATE RECORD' : 'CREATE EXPENSE'}
                  </button>
               </div>`;
    
    expensePart = expensePart.replace(expenseFormSubmitBlock, restoredButtonsBlock);

    // 3. Restore Batch Bar for Expenses
    const expenseBatchBarPlaceholder = `{/* Batch actions removed for expenses */}`;
    const restoredBatchBar = `<AnimatePresence>
        {selectedIds.length > 0 && profile?.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="portal-batch-bar"
          >
            <div className="batch-content">
              <span className="batch-label">{selectedIds.length} DISBURSEMENTS SELECTED</span>
              <div className="batch-actions">
                <button 
                  disabled={loading}
                  onClick={() => handleBulkStatus('approved')} 
                  className="btn-batch btn-batch--approve"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  APPROVE
                </button>
                <button 
                  disabled={loading}
                  onClick={() => handleBulkStatus('rejected')} 
                  className="btn-batch btn-batch--reject"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  REJECT
                </button>
                <div className="batch-divider" />
                <button onClick={() => setSelectedIds([])} className="btn-batch-text">CANCEL</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`;

    expensePart = expensePart.replace(expenseBatchBarPlaceholder, restoredBatchBar);

    // 4. Restore Status Column and Checkboxes in Expenses Table
    const expenseTableHeader = `            <thead>
              <tr>
                <th style={{ width: 100 }}>Date</th>
                <th style={{ width: 150 }}>Category</th>
                <th>Legal Entity</th>
                <th>Verification Note</th>
                <th style={{ textAlign: 'right', width: 120 }}>Amount (INR)</th>
                <th style={{ textAlign: 'right', width: 80 }}>Actions</th>
              </tr>
            </thead>`;
    
    const restoredTableHeader = `            <thead>
              <tr>
                {profile?.role === 'admin' && (
                  <th style={{ width: 40 }}>
                    <input 
                      type="checkbox" 
                      className="portal-checkbox" 
                      checked={selectedIds.length === entries.length && entries.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th>Date</th>
                <th>Category</th>
                <th>Account</th>
                <th>Verification</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Amount (INR)</th>
                <th style={{ textAlign: 'right', paddingRight: 60 }}>Actions</th>
              </tr>
            </thead>`;

    expensePart = expensePart.replace(expenseTableHeader, restoredTableHeader);

    const expenseTabRowStart = `                <tr key={e.id} 
                  onClick={() => handleEdit(e)}
                  style={{ cursor: 'pointer' }}
                  className={selectedIds.includes(e.id) ? 'row-selected' : ''}
                >`;
    
    const restoredTabRowStart = `                <tr key={e.id} 
                  onClick={() => handleEdit(e)}
                  style={{ cursor: 'pointer' }}
                  className={selectedIds.includes(e.id) ? 'row-selected' : ''}
                >
                  {profile?.role === 'admin' && (
                    <td onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        className="portal-checkbox"
                        checked={selectedIds.includes(e.id)}
                        onChange={() => handleSelectOne(e.id)}
                      />
                    </td>
                  )}`

    expensePart = expensePart.replace(expenseTabRowStart, restoredTabRowStart);

    const expenseTabRowEnd = `<td style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 500 }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>`;
    const restoredTabRowEnd = `<td>
                    <span 
                      className="portal-badge" 
                      style={{ 
                        background: statusColors[e.status || 'submitted'],
                        color: statusText[e.status || 'submitted'],
                        borderColor: 'transparent'
                      }}
                    >
                      {e.status || 'submitted'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 500 }}>₹{Number(e.amount).toLocaleString('en-IN')}</td>`;

    expensePart = expensePart.replace(expenseTabRowEnd, restoredTabRowEnd);

    content = parts[0] + '/* ——— EXPENSES ——— */' + expensePart;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Expenses restored. Timesheets remain approval-free.');
} else {
    console.error('Expenses section marker not found!');
}
