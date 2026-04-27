import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ConceptNode, ConceptEdge } from "../api/sessions";

type Props = {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
};

export const ConceptMap = ({ nodes, edges }: Props) => {
  if (!nodes || nodes.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 lg:p-12 mt-12 bg-gradient-to-b from-sky-50 to-white rounded-[3rem] border-4 border-sky-100 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Sparkles className="w-32 h-32 text-sky-500" />
      </div>

      <div className="text-center mb-10">
        <h3 className="text-2xl font-black text-sky-800 uppercase tracking-widest flex items-center justify-center gap-3">
          <Sparkles className="w-6 h-6 text-sky-500" />
          Story Map
          <Sparkles className="w-6 h-6 text-sky-500" />
        </h3>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 relative z-10">
        {nodes.map((node, i) => {
          const edge = edges.find(e => e.source === node.id);
          
          let colorClass = 'bg-white text-slate-700 border-slate-200';
          if (node.type.includes('character') || node.type.includes('person')) {
             colorClass = 'bg-amber-100 text-amber-800 border-amber-300';
          } else if (node.type.includes('action') || node.type.includes('event')) {
             colorClass = 'bg-rose-100 text-rose-800 border-rose-300';
          } else if (node.type.includes('object') || node.type.includes('thing')) {
             colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
          } else if (node.type.includes('setting') || node.type.includes('place')) {
             colorClass = 'bg-purple-100 text-purple-800 border-purple-300';
          }

          return (
            <div key={node.id} className="flex items-center gap-6">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: i * 0.15 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`px-8 py-5 rounded-[2rem] border-4 border-b-8 shadow-xl text-3xl font-black ${colorClass}`}
              >
                <div className="text-[10px] opacity-60 uppercase tracking-[0.2em] mb-2 font-bold">{node.type}</div>
                {node.label}
              </motion.div>
              
              {edge && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (i * 0.15) + 0.2 }}
                  className="flex flex-col items-center gap-2 text-sky-400 font-bold"
                >
                  <span className="bg-white border-2 border-sky-100 shadow-sm px-4 py-2 rounded-full text-sm uppercase tracking-wider">{edge.label}</span>
                  <ArrowRight className="w-8 h-8" />
                </motion.div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  );
};
