import React from 'react';

export const ProcessingView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-blue-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">Analyzing Document Structure</h3>
      <p className="text-slate-500 max-w-md text-center">
        Gemini is reading tables, extracting text, and generating an AI-optimized structure...
      </p>
    </div>
  );
};
