import React, { useState } from "react";
import { motion } from "framer-motion";
import { visualizeParagraph, ConceptNode, ConceptEdge } from "../../api/sessions";

interface ConceptMapProps {
  text: string;
  colorClass?: string;
}

export const ConceptMap: React.FC<ConceptMapProps> = ({ text, colorClass = "from-sky-400 to-blue-600" }) => {
  const [nodes, setNodes] = useState<ConceptNode[]>([]);
  const [edges, setEdges] = useState<ConceptEdge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const startScan = async () => {
    setLoading(true);
    setError(null);
    setHasStarted(true);
    try {
      const response = await visualizeParagraph(text);
      setNodes(response.nodes || []);
      setEdges(response.edges || []);
    } catch (err) {
      setError("Failed to generate concept map.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!hasStarted) {
    return (
      <button 
        onClick={startScan}
        className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-sky-400 backdrop-blur-md hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
      >
        Start Scanning Mission
      </button>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md w-max">
        <div className="w-5 h-5 rounded-full border-2 border-slate-600 border-t-sky-400 animate-spin" />
        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          Analyzing Paragraph...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm font-bold bg-red-500/10 p-4 rounded-2xl border border-red-500/20 w-max">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-4 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-5`} />
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8 relative z-10">
        AI Concept Map
      </h3>
      <div className="flex flex-wrap items-center gap-y-8 gap-x-4 relative z-10">
        {nodes.map((node, i) => {
          const outgoingEdges = edges.filter(e => e.source === node.id);
          
          return (
            <React.Fragment key={node.id}>
              {/* Node Card */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 200, damping: 15 }}
                className={`relative px-5 py-3 rounded-2xl bg-gradient-to-br ${colorClass} text-white font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center min-w-[120px]`}
              >
                <span className="text-lg tracking-tight">{node.label}</span>
                <span className="mt-1 text-[10px] uppercase bg-black/30 px-2 py-0.5 rounded-full tracking-widest">
                  {node.type}
                </span>
              </motion.div>
              
              {/* Edges */}
              {outgoingEdges.map((edge, j) => (
                <motion.div
                  key={`${edge.source}-${edge.target}-${j}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.15 + 0.2 }}
                  className="flex flex-col items-center px-2"
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    {edge.label}
                  </span>
                  <div className="flex items-center text-slate-500">
                    <div className="w-8 h-0.5 bg-slate-500 rounded-full" />
                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-[6px] border-t-transparent border-b-transparent border-l-slate-500 ml-[-2px]" />
                  </div>
                </motion.div>
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
