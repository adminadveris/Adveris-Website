import React, { useState, useEffect, useRef } from 'react';

interface Option {
  id: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Search...",
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="portal-form-label">{label}</label>}

      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${isOpen ? 'var(--saffron)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 8,
          padding: '12px 16px',
          color: selectedOption ? 'white' : 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(255,153,51,0.1)' : 'none'
        }}
      >
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', opacity: 0.5 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'rgba(30, 30, 30, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          animation: 'fadeInScale 0.15s ease-out'
        }}>
          {/* Search Input */}
          <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ position: 'relative' }}>
              <input
                autoFocus
                type="text"
                placeholder="Type to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '8px 12px 8px 32px',
                  color: 'white',
                  fontSize: '0.8rem',
                  outline: 'none'
                }}
              />
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,153,51,0.5)" strokeWidth="2"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
              >
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: 4 }}>
            {filteredOptions.length > 0 ? filteredOptions.map(option => (
              <div
                key={option.id}
                onClick={() => handleSelect(option)}
                className="select-option-hover"
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: value === option.id ? 'rgba(255,153,51,0.1)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ fontSize: '0.88rem', color: value === option.id ? 'var(--saffron)' : 'white', fontWeight: value === option.id ? 600 : 400 }}>
                  {option.label}
                </div>
                {option.sublabel && (
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    {option.sublabel}
                  </div>
                )}
              </div>
            )) : (
              <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 8 }}>
                  No active mandates found
                </p>
                <p style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--saffron)', opacity: 0.6 }}>
                  Please verify search term or create a new request
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Global Style for hover (if not using CSS modules) */}
      <style>{`
        .select-option-hover:hover {
          background: rgba(255,255,255,0.05) !important;
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SearchableSelect;
