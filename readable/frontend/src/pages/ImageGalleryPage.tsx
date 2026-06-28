import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";

export const ImageGalleryPage = () => {
  const images = [
    "/image1.jpeg",
    "/image2.jpeg",
    "/image3.jpeg",
    "/image4.jpeg",
    "/image5.jpeg",
  ];

  return (
    <div className="space-y-8">
      <Link
        to="/dashboard#lessons"
        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Lessons
      </Link>

      <section className="surface-panel overflow-hidden rounded-[2rem] p-6 md:p-8">
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-slate-200/70 pb-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-700">
              <ImageIcon className="h-4 w-4" />
              Lesson 3
            </p>
            <h1 className="text-5xl font-black tracking-tight text-slate-950">Gallery</h1>
          </div>
          <p className="max-w-lg text-lg font-semibold leading-8 text-slate-500">
            Look closely at each picture, notice details, and describe what you see.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((src, index) => (
            <motion.figure
              key={src}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="group overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={src}
                  alt={`Gallery lesson image ${index + 1}`}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-black uppercase tracking-widest text-slate-500">
                  Image {index + 1}
                </span>
                <span className="h-2 w-8 rounded-full bg-gradient-to-r from-orange-400 to-rose-400" />
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </section>
    </div>
  );
};
