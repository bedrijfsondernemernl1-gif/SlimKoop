import React, { useState } from 'react';

export const Accordion = ({ children, className = '' }: any) => {
  return <div className={`w-full ${className}`}>{children}</div>;
}

export const AccordionItem = ({ children, className = '' }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`border-b ${className}`} data-state={isOpen ? 'open' : 'closed'}>
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child as any, { isOpen, setIsOpen });
      })}
    </div>
  );
}

export const AccordionTrigger = ({ children, isOpen, setIsOpen, className = '' }: any) => {
  return (
    <button 
      className={`w-full text-left py-4 font-medium flex justify-between items-center ${className}`} 
      onClick={() => setIsOpen(!isOpen)}
    >
      {children}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

export const AccordionContent = ({ children, isOpen, className = '' }: any) => {
  if (!isOpen) return null;
  return <div className={`pb-4 ${className}`}>{children}</div>;
}
