import { useState } from 'react';
import * as XLSX from 'xlsx';

export const exportToCSV = <T extends object>(data: T[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
};

export const exportToExcel = <T extends object>(data: T[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const filterDataByRange = <T extends object>(data: T[], rangeKey: string, dateField: string = 'date') => {
  const now = new Date();
  const start = new Date();

  switch (rangeKey) {
    case 'last_week':
      start.setDate(now.getDate() - 7);
      return data.filter(d => new Date((d as any)[dateField]) >= start);
    case 'prev_month': {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return data.filter(d => {
        const dd = new Date((d as any)[dateField]);
        return dd >= prevMonthStart && dd <= prevMonthEnd;
      });
    }
    case 'last_3m':
      start.setMonth(now.getMonth() - 3);
      return data.filter(d => new Date((d as any)[dateField]) >= start);
    case 'last_6m':
      start.setMonth(now.getMonth() - 6);
      return data.filter(d => new Date((d as any)[dateField]) >= start);
    case 'last_1y':
      start.setFullYear(now.getFullYear() - 1);
      return data.filter(d => new Date((d as any)[dateField]) >= start);
    default:
      return data;
  }
};

interface ExportDropdownProps<T> {
  data: T[];
  filename: string;
  label?: string;
  dateField?: string;
}

const ExportDropdown = <T extends object>({ data, filename, label = "Export Data", dateField = "date" }: ExportDropdownProps<T>) => {
  const [open, setOpen] = useState(false);

  const ranges = [
    { label: 'Last Week', key: 'last_week' },
    { label: 'Previous Month', key: 'prev_month' },
    { label: 'Last 3 Months', key: 'last_3m' },
    { label: 'Last 6 Months', key: 'last_6m' },
    { label: 'Last 1 Year', key: 'last_1y' },
    { label: 'All Records', key: 'all' },
  ];

  const handleExport = (range: string, rangeLabel: string, format: 'csv' | 'xlsx' = 'csv') => {
    const filtered = filterDataByRange(data, range, dateField);
    const finalFilename = `${filename}_${rangeLabel.replace(/ /g, '_')}`;
    
    if (format === 'csv') {
      exportToCSV(filtered, finalFilename);
    } else {
      exportToExcel(filtered, finalFilename);
    }
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)}
        className="btn-portal-outline"
        style={{ width: 'auto' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 8, transition: 'transform 0.3s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="portal-dropdown-overlay" onClick={() => setOpen(false)} />
          <div className="portal-dropdown-menu" style={{ right: 0, left: 'auto', minWidth: 260 }}>
            <div className="portal-dropdown-header">Export Target (Csv Default)</div>
            {ranges.map(r => (
              <div key={r.key} style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <button 
                  className="portal-dropdown-item" 
                  style={{ flex: 1, borderBottom: 'none' }}
                  onClick={() => handleExport(r.key, r.label, 'csv')}
                >
                  {r.label} (CSV)
                </button>
                <button 
                  className="portal-dropdown-item" 
                  style={{ width: 60, borderBottom: 'none', borderLeft: '1px solid rgba(255,153,51,0.1)', color: 'var(--gold)', opacity: 0.6 }}
                  onClick={() => handleExport(r.key, r.label, 'xlsx')}
                >
                  XLSX
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExportDropdown;
