import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-latex';
import 'prismjs/themes/prism-tomorrow.css';
import { motion } from 'motion/react';
import { Copy, Check, Trash2, Maximize2, Minimize2, Download, FileText, Sparkles, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COMMON_COMMANDS = [
  { label: '\\frac{}{}', value: '\\frac{numerator}{denominator}' },
  { label: '\\sqrt{}', value: '\\sqrt{x}' },
  { label: '\\sum_{}^{}', value: '\\sum_{i=1}^{n}' },
  { label: '\\int_{}^{}', value: '\\int_{a}^{b}' },
  { label: '\\alpha', value: '\\alpha' },
  { label: '\\beta', value: '\\beta' },
  { label: '\\gamma', value: '\\gamma' },
  { label: '\\delta', value: '\\delta' },
  { label: '\\theta', value: '\\theta' },
  { label: '\\pi', value: '\\pi' },
  { label: '\\infty', value: '\\infty' },
  { label: '\\pm', value: '\\pm' },
  { label: '\\times', value: '\\times' },
  { label: '\\div', value: '\\div' },
  { label: '\\neq', value: '\\neq' },
  { label: '\\leq', value: '\\leq' },
  { label: '\\geq', value: '\\geq' },
  { label: '\\rightarrow', value: '\\rightarrow' },
  { label: '\\Rightarrow', value: '\\Rightarrow' },
  { label: '\\partial', value: '\\partial' },
  { label: '\\nabla', value: '\\nabla' },
];

export const LatexEditor = () => {
  const [code, setCode] = useState('% Start typing your LaTeX here...\nE = mc^2\n\n\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertCommand = (command: string) => {
    const before = code.substring(0, cursorPos);
    const after = code.substring(cursorPos);
    setCode(before + command + after);
    setShowSuggestions(false);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "neuroask_latex.tex";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a', // Match the surface color
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save("neuroask_latex.pdf");
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col gap-6 transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[200] bg-surface p-8" : "h-full"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold">Neural LaTeX Editor</h2>
            <p className="text-xs text-on-surface/40 uppercase tracking-widest font-bold">Precision Document Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all text-primary hover:text-primary/80 disabled:opacity-50"
            title="Export as PDF"
          >
            <FileDown className={cn("w-5 h-5", isExporting && "animate-pulse")} />
          </button>
          <button 
            onClick={handleDownload}
            className="p-2.5 rounded-xl bg-on-surface/5 hover:bg-on-surface/10 transition-all text-on-surface/60 hover:text-on-surface"
            title="Download .tex"
          >
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={handleCopy}
            className="p-2.5 rounded-xl bg-on-surface/5 hover:bg-on-surface/10 transition-all text-on-surface/60 hover:text-on-surface"
            title="Copy to Clipboard"
          >
            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2.5 rounded-xl bg-on-surface/5 hover:bg-on-surface/10 transition-all text-on-surface/60 hover:text-on-surface"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setCode('')}
            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-all text-red-500/60 hover:text-red-500"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Editor Pane */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40">Source Code</span>
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary hover:opacity-80 transition-opacity"
            >
              {showSuggestions ? 'Hide Commands' : 'Show Commands'}
            </button>
          </div>
          
          <div className="relative flex-1 min-h-0 glass-card rounded-3xl overflow-hidden flex flex-col border-on-surface/5 focus-within:border-primary/30 transition-colors">
            {showSuggestions && (
              <div className="absolute top-0 left-0 right-0 z-10 bg-surface/95 backdrop-blur-md border-b border-on-surface/5 p-4 flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                {COMMON_COMMANDS.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => insertCommand(cmd.value)}
                    className="px-3 py-1.5 rounded-lg bg-on-surface/5 hover:bg-primary/10 hover:text-primary transition-all text-xs font-mono"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 font-mono text-sm">
              <Editor
                value={code}
                onValueChange={code => setCode(code)}
                highlight={code => Prism.highlight(code, Prism.languages.latex, 'latex')}
                padding={10}
                onKeyUp={(e: any) => setCursorPos(e.target.selectionStart)}
                onClick={(e: any) => setCursorPos(e.target.selectionStart)}
                className="min-h-full outline-none text-on-surface/80"
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              />
            </div>
          </div>
        </div>

        {/* Preview Pane */}
        <div className="flex flex-col gap-4 min-h-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface/40 px-2">Live Preview</span>
          <div 
            ref={previewRef}
            className="flex-1 min-h-0 glass-card rounded-3xl p-8 overflow-y-auto custom-scrollbar bg-white/5 flex flex-col items-center justify-center text-center"
          >
            <div className="w-full max-w-full overflow-x-auto py-8">
              {code.trim() ? (
                <div className="space-y-8 text-on-surface">
                  {code.split('\n\n').map((block, i) => {
                    if (block.trim().startsWith('%')) return null;
                    try {
                      return (
                        <div key={i} className="py-4">
                          <BlockMath math={block.trim()} />
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div key={i} className="text-red-500/60 text-xs font-mono p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                          Error rendering block {i + 1}: Check LaTeX syntax
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-on-surface/20">
                  <FileText className="w-16 h-16" />
                  <p className="text-sm font-medium">Rendered output will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
