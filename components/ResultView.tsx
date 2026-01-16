import React, { useState } from 'react';
import { AIReadyData } from '../types';

interface ResultViewProps {
  data: AIReadyData;
  onReset: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'json' | 'markdown'>('summary');

  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.metadata.filename.replace(/\.[^/.]+$/, "")}_ai_ready.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden flex flex-col h-[85vh]">
      {/* Header */}
      <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Analysis Complete
          </h2>
          <p className="text-slate-400 text-sm mt-1">{data.metadata.filename}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            Upload New File
          </button>
          <button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-blue-900/50 flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download AI-Ready JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 flex px-6 shrink-0">
        {[
          { id: 'summary', label: 'Summary & Tables' },
          { id: 'markdown', label: 'Markdown Content' },
          { id: 'json', label: 'Raw JSON Structure' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2">Document Summary</h3>
              <p className="text-slate-600 leading-relaxed mb-4">{data.documentAnalysis.summary}</p>
              
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Key Points</h4>
              <ul className="list-disc pl-5 space-y-1">
                {data.documentAnalysis.keyPoints.map((point, idx) => (
                  <li key={idx} className="text-slate-600 text-sm">{point}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Extracted Tables ({data.structuredContent.tables.length})</h3>
              {data.structuredContent.tables.length === 0 ? (
                <div className="text-slate-400 italic">No tables detected.</div>
              ) : (
                data.structuredContent.tables.map((table, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    {(table.title || table.description) && (
                      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                        {table.title && <p className="font-semibold text-slate-700 text-sm">{table.title}</p>}
                        {table.description && <p className="text-xs text-slate-500">{table.description}</p>}
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
                          <tr>
                            {table.headers.map((header, hIdx) => (
                              <th key={hIdx} className="px-6 py-3 font-bold whitespace-nowrap bg-slate-100">
                                {header || `Col ${hIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="bg-white border-b hover:bg-slate-50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-6 py-3 text-slate-600 border-r border-slate-100 last:border-0">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'markdown' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 max-w-4xl mx-auto">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
              {data.structuredContent.markdown}
            </pre>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-800 max-w-4xl mx-auto">
            <pre className="whitespace-pre font-mono text-xs text-green-400 overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
