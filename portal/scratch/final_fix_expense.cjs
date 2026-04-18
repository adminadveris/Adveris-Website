const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The unique marker for the Expense Submit button
const expenseSubmitMarker = "{loading ? 'POSTING...' : editingId ? 'UPDATE RECORD' : 'CREATE EXPENSE'}";

// The buttons to restore
const restoredButtons = `                  {editingId && isAdmin && (
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
                  )}\n`;

if (content.includes(expenseSubmitMarker)) {
    // 1. Ensure the grid is correct (dual column if buttons exist)
    content = content.replace(
        /gridTemplateColumns: '1fr', gap: 16, marginTop: 16 \}\}/g,
        "gridTemplateColumns: editingId && isAdmin ? '1fr 1fr' : '1fr', gap: 16, marginTop: 16 }}"
    );

    // 2. Insert buttons before the button element containing the marker
    const lines = content.split('\n');
    let targetIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(expenseSubmitMarker)) {
            // Find the start of the <button tag for this line
            for (let j = i; j >= 0; j--) {
                if (lines[j].includes('<button')) {
                    targetIndex = j;
                    break;
                }
            }
            break;
        }
    }

    if (targetIndex !== -1) {
        lines.splice(targetIndex, 0, restoredButtons);
        content = lines.join('\n');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Expense form buttons sytematically restored.');
    } else {
        console.log('Could not find button start tag.');
    }
} else {
    console.error('Marker not found!');
}
