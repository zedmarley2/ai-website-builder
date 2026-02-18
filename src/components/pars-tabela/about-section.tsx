'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface Stat {
  value: number;
  suffix: string;
  label: string;
  color: string;
}

const STATS: Stat[] = [
  { value: 15, suffix: '+', label: 'Yıllık Deneyim', color: '#00f0ff' },
  { value: 3000, suffix: '+', label: 'Tamamlanan Proje', color: '#ff006e' },
  { value: 500, suffix: '+', label: 'Mutlu Müşteri', color: '#39ff14' },
];

function AnimatedCounter({ value, suffix, color }: { value: number; suffix: string; color: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span
      ref={ref}
      className="text-5xl font-extrabold sm:text-6xl"
      style={{
        color,
        textShadow: `0 0 7px ${color}, 0 0 10px ${color}, 0 0 21px ${color}`,
      }}
    >
      {count.toLocaleString('tr-TR')}
      {suffix}
    </span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function AboutSection() {
  return (
    <section id="hakkimizda" className="bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div className="mb-16 text-center" variants={itemVariants}>
            <h2
              className="text-4xl font-bold text-[#00f0ff] sm:text-5xl"
              style={{
                textShadow: '0 0 7px #00f0ff, 0 0 10px #00f0ff, 0 0 21px #00f0ff',
              }}
            >
              Hakkımızda
            </h2>
          </motion.div>

          <div className="mx-auto mb-20 max-w-3xl space-y-6 text-center">
            <motion.p className="text-lg leading-relaxed text-gray-300" variants={itemVariants}>
              Pars Tabela olarak 15 yılı aşkın deneyimimizle Türkiye&apos;nin önde gelen tabela
              üreticilerinden biriyiz. Modern teknoloji ve geleneksel ustalığı bir araya getirerek,
              markanızı en iyi şekilde yansıtan tabela çözümleri sunuyoruz.
            </motion.p>
            <motion.p className="text-lg leading-relaxed text-gray-300" variants={itemVariants}>
              Neon tabeladan LED aydınlatmaya, kutu harften elektronik tabelalara kadar geniş ürün
              yelpazemizle her sektöre özel çözümler üretiyoruz.
            </motion.p>
          </div>

          {/* Stats */}
          <div className="grid gap-8 sm:grid-cols-3">
            {STATS.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="rounded-2xl border border-gray-800 bg-gray-900/50 p-8 text-center"
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} color={stat.color} />
                <p className="mt-3 text-base font-medium text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
