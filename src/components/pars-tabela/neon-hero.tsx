'use client';

import { motion } from 'framer-motion';

const neonTextStyle = {
  textShadow:
    '0 0 7px #00f0ff, 0 0 10px #00f0ff, 0 0 21px #00f0ff, 0 0 42px #00f0ff, 0 0 82px #00f0ff, 0 0 92px #00f0ff',
};

const neonPinkStyle = {
  textShadow: '0 0 7px #ff006e, 0 0 10px #ff006e, 0 0 21px #ff006e, 0 0 42px #ff006e',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' as const } },
};

export function NeonHero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950"
    >
      {/* Neon flicker keyframes */}
      <style>{`
        @keyframes neonFlicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            opacity: 1;
            text-shadow: 0 0 7px #00f0ff, 0 0 10px #00f0ff, 0 0 21px #00f0ff, 0 0 42px #00f0ff, 0 0 82px #00f0ff;
          }
          20%, 24%, 55% {
            opacity: 0.8;
            text-shadow: none;
          }
        }
        @keyframes gridPulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.06; }
        }
      `}</style>

      {/* Animated grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,240,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'gridPulse 4s ease-in-out infinite',
        }}
      />

      {/* Radial glow behind title */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00f0ff]/5 blur-3xl" />

      <motion.div
        className="relative z-10 px-4 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="mb-6 text-6xl font-extrabold tracking-tight text-[#00f0ff] sm:text-7xl lg:text-8xl"
          style={{ ...neonTextStyle, animation: 'neonFlicker 3s infinite alternate' }}
          variants={itemVariants}
        >
          Pars Tabela
        </motion.h1>

        <motion.p
          className="mb-4 text-2xl font-semibold text-[#ff006e] sm:text-3xl"
          style={neonPinkStyle}
          variants={itemVariants}
        >
          Işığınızla Fark Yaratın
        </motion.p>

        <motion.p className="mb-10 text-lg text-gray-400 sm:text-xl" variants={itemVariants}>
          Profesyonel Neon &amp; LED Tabela Çözümleri
        </motion.p>

        <motion.div variants={itemVariants}>
          <a
            href="#hizmetlerimiz"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#hizmetlerimiz')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-block rounded-full border-2 border-[#00f0ff] px-8 py-3 text-lg font-semibold text-[#00f0ff] transition-all duration-300 hover:bg-[#00f0ff]/10"
            style={{
              boxShadow: '0 0 15px rgba(0,240,255,0.3), inset 0 0 15px rgba(0,240,255,0.1)',
            }}
          >
            Hizmetlerimizi Keşfedin
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
