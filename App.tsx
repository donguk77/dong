import React, { useState, useRef } from 'react';
import { ProcessingStatus, AIReadyData } from './types';
import { processPdfForAI } from './services/geminiService';
import { ProcessingView } from './components/ProcessingView';
import { ResultView } from './components/ResultView';

const App: React.FC = () => {
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [data, setData] = useState<AIReadyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setStatus(ProcessingStatus.PROCESSING);
    setError(null);

    try {
      const result = await processPdfForAI(file);
      setData(result);
      setStatus(ProcessingStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setStatus(ProcessingStatus.ERROR);
      setError(err.message || "An unexpected error occurred while processing the PDF.");
    }
  };

  const handleReset = () => {
    setStatus(ProcessingStatus.IDLE);
    setData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation / Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Docu<span className="text-blue-600">Structure</span> AI</span>
            </div>
            <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Powered by Gemini 2.0 Flash
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {status === ProcessingStatus.IDLE && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                Make your PDFs <br/>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  AI-Readable
                </span>
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed">
                Upload complex PDF documents with tables, forms, and dense text. 
                We'll extract, structure, and convert them into clean JSON optimized for LLM ingestion.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <label 
                htmlFor="file-upload" 
                className="group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <div className="mb-4 p-4 bg-blue-50 text-blue-500 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="mb-2 text-sm text-slate-700 font-medium">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">PDF documents only (Max 10MB)</p>
                </div>
                <input 
                  id="file-upload" 
                  ref={fileInputRef}
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
          </div>
        )}

        {status === ProcessingStatus.PROCESSING && (
           <ProcessingView />
        )}

        {status === ProcessingStatus.ERROR && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 max-w-lg w-full text-center shadow-sm">
              <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold mb-2">Processing Failed</h3>
              <p className="mb-6">{error}</p>
              <button 
                onClick={handleReset}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg shadow-red-900/20"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {status === ProcessingStatus.SUCCESS && data && (
          <ResultView data={data} onReset={handleReset} />
        )}

      </main>
    </div>
  );
};

export default App;
