import React from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon } from "lucide-react";

export const ImageGalleryPage = () => {
  // Assuming the user will place 5 images named image1.jpg to image5.jpg in the public folder.
  const images = [
    "/image1.jpeg",
    "/image2.jpeg",
    "/image3.jpeg",
    "/image4.jpeg",
    "/image5.jpeg",
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 rounded-[40px] p-8 md:p-12 shadow-sm border-4 border-slate-100">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 border-b-4 border-sky-100">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Image Gallery
            </h1>
          </div>
          <p className="text-lg font-bold text-slate-500 max-w-2xl">
            A beautiful collection of images. Place your images in the <code className="bg-slate-100 text-sky-600 px-2 py-1 rounded">frontend/public</code> folder.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-8">
        {images.map((src, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative aspect-[3/4] rounded-3xl overflow-hidden bg-slate-50 border-4 border-slate-100 shadow-sm hover:shadow-xl hover:border-sky-200 hover:-translate-y-2 transition-all duration-300"
          >
            {/* Fallback styling if image is missing */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 font-bold p-6 text-center group-hover:text-sky-500 transition-colors">
              <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm">Missing Image</span>
              <span className="text-xs opacity-70 mt-1 break-all">{src}</span>
            </div>
            
            {/* Actual Image - covers the fallback if it loads successfully */}
            <img 
              src={src} 
              alt={`Gallery Image ${index + 1}`}
              className="absolute inset-0 w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                // Hide broken image icon, show fallback background
                (e.target as HTMLImageElement).style.opacity = '0';
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.opacity = '1';
              }}
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-end p-6">
              <span className="text-white font-black tracking-widest uppercase text-sm drop-shadow-md">
                Image {index + 1}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
