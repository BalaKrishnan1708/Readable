import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Rocket } from "lucide-react";
import { ConceptMap } from "../components/Lesson/ConceptMap";

const planets = [
  {
    id: "sun",
    name: "Sun",
    image: "/planets/sun.jpeg",
    description: "The Sun is a big, bright star at the center of our solar system. It gives us light and heat, making life possible on Earth. The Sun doesn't have any moons because it's a star, not a planet.",
    color: "from-yellow-400 to-orange-600"
  },
  {
    id: "mercury",
    name: "Mercury",
    image: "/planets/mercury.jpeg",
    description: "Closest planet to the Sun. Small and rocky, like a hot, grayish ball. No moons orbit Mercury.",
    color: "from-gray-400 to-gray-600"
  },
  {
    id: "venus",
    name: "Venus",
    image: "/planets/venus.jpeg",
    description: "Second planet from the Sun. Similar in size to Earth, often called Earth's \"sister planet.\" Thick atmosphere traps heat, making it super hot. No moons orbit Venus.",
    color: "from-orange-200 to-yellow-500"
  },
  {
    id: "earth",
    name: "Earth",
    image: "/planets/earth.jpeg",
    description: "Our home planet, third from the Sun. Has oceans, forests, mountains, and living things. One moon called \"Moon\" or \"Luna.\"",
    color: "from-blue-400 to-green-500"
  },
  {
    id: "moon",
    name: "Moon",
    image: "/planets/moon.jpeg",
    description: "Earth's natural satellite, the only moon we have. Looks like a big, round rock in the sky. Orbits around Earth, showing different phases like full moon, half moon, crescent moon.",
    color: "from-slate-300 to-slate-500"
  },
  {
    id: "mars",
    name: "Mars",
    image: "/planets/mars.jpeg",
    description: "Fourth planet from the Sun. Reddish due to rusty iron on its surface. Two small moons named Phobos and Deimos.",
    color: "from-red-500 to-orange-700"
  },
  {
    id: "jupiter",
    name: "Jupiter",
    image: "/planets/jupiter.jpeg",
    description: "Largest planet, fifth from the Sun. Giant gas ball with colorful stripes and the Great Red Spot storm. 79 known moons, including Io, Europa, Ganymede, and Callisto.",
    color: "from-orange-300 to-brown-500"
  },
  {
    id: "saturn",
    name: "Saturn",
    image: "/planets/saturn.jpeg",
    description: "Famous for beautiful rings, sixth from the Sun. Gas planet with unique rings. 83 confirmed moons, including Titan.",
    color: "from-yellow-200 to-orange-400"
  },
  {
    id: "uranus",
    name: "Uranus",
    image: "/planets/uranus.jpeg",
    description: "Seventh planet, bluish-green, spins on its side. 27 known moons, like Titania and Oberon.",
    color: "from-cyan-300 to-blue-400"
  },
  {
    id: "neptune",
    name: "Neptune",
    image: "/planets/neptune.jpeg",
    description: "Eighth planet, bluish, strong winds. 14 confirmed moons, including Triton.",
    color: "from-blue-500 to-indigo-700"
  }
];

export const PlanetLessonPage = () => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black text-white font-sans selection:bg-sky-500/30">
      {/* Immersive Starry Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Layer 1: Tiny Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_20px_30px,#fff,rgba(0,0,0,0))] bg-[length:200px_200px] opacity-30" />
        {/* Layer 2: Medium Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(2px_2px_at_50px_100px,#fff,rgba(0,0,0,0))] bg-[length:350px_350px] opacity-40 animate-pulse" />
        {/* Layer 3: Distant Nebula Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(30,58,138,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(88,28,135,0.15),transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-10 py-20">
        <Link to="/dashboard" className="inline-flex items-center gap-3 text-slate-400 hover:text-white transition-all mb-16 font-black uppercase tracking-widest text-xs group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Return to Dashboard
        </Link>

        <header className="mb-32 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-3xl bg-white/5 border border-white/10 mb-8 backdrop-blur-xl"
          >
            <Rocket className="w-10 h-10 text-sky-400" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500"
          >
            Solar Voyage
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-bold"
          >
            Explore the wonders of our celestial neighborhood!
          </motion.p>
        </header>

        <div className="space-y-48">
          {planets.map((planet, index) => (
            <motion.section
              key={planet.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-16 md:gap-32`}
            >
              <div className="flex-1 relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${planet.color} blur-[140px] opacity-25`} />
                <motion.img
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  src={planet.image}
                  alt={planet.name}
                  className="w-full max-w-[450px] mx-auto relative z-10 drop-shadow-[0_0_80px_rgba(255,255,255,0.15)]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/450x450/000/fff?text=" + planet.name;
                  }}
                />
              </div>
              <div className="flex-1 space-y-8">
                <h2 className={`text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r ${planet.color} tracking-tight`}>
                  {planet.name}
                </h2>
                <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ x: "-100%" }}
                    whileInView={{ x: "0%" }}
                    className={`h-full w-full bg-gradient-to-r ${planet.color}`} 
                   />
                </div>
                <p className="text-2xl md:text-3xl leading-relaxed text-slate-200 font-bold tracking-tight">
                  {planet.description}
                </p>
                <div className="pt-6">
                  <ConceptMap text={planet.description} colorClass={planet.color} />
                </div>
              </div>
            </motion.section>
          ))}
        </div>

        <footer className="mt-60 text-center border-t border-white/10 pt-32 pb-20">
          <p className="text-slate-500 font-black uppercase tracking-widest mb-10">Mission Status: Complete</p>
          <Link to="/dashboard" className="btn-3d inline-block rounded-[2rem] bg-white px-16 py-6 text-2xl font-black text-black hover:bg-sky-400 hover:text-white transition-all transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            End Voyage
          </Link>
        </footer>
      </div>
    </div>
  );
};
