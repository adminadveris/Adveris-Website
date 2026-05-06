import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="portal-pagination-bar">
      <div className="pagination-telemetry">
        Showing <span className="telemetry-focus">{startIdx}-{endIdx}</span> Of <span className="telemetry-focus">{totalItems}</span> Records
      </div>

      <div className="pagination-controls">
        <div className="page-size-selector">
          <span className="selector-label">Rows</span>
          <select 
            value={pageSize} 
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="portal-select-minimal"
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div className="page-nav-buttons">
          <button 
            disabled={currentPage === 1} 
            onClick={() => onPageChange(currentPage - 1)}
            className="nav-btn"
            title="Previous Page"
          >
            ←
          </button>
          
          <div className="page-indicator">
            {currentPage} <span style={{ opacity: 0.2 }}>/</span> {totalPages || 1}
          </div>

          <button 
            disabled={currentPage >= totalPages} 
            onClick={() => onPageChange(currentPage + 1)}
            className="nav-btn"
            title="Next Page"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
