import React from 'react';

const PageBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0D1B3E] pointer-events-none">
      <div 
        className="absolute w-[700px] h-[700px] top-[-180px] left-[-180px] opacity-20 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,153,51,0.75) 0%, transparent 70%)',
          animation: 'blobFloat 22s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute w-[500px] h-[500px] bottom-[-100px] right-[-100px] opacity-15 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,153,51,0.45) 0%, transparent 70%)',
          animation: 'blobFloat 30s ease-in-out infinite reverse'
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] top-[40%] left-[55%] opacity-10 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(27,43,94,0.95) 0%, transparent 70%)',
          animation: 'blobFloat 38s ease-in-out infinite 6s'
        }}
      />
      <div 
        className="absolute w-[350px] h-[350px] top-[20%] right-[15%] opacity-15 blur-[90px]"
        style={{
          background: 'radial-gradient(circle, rgba(255,179,102,0.5) 0%, transparent 70%)',
          animation: 'blobFloat 26s ease-in-out infinite 3s'
        }}
      />
    </div>
  );
};

export default PageBackground;
