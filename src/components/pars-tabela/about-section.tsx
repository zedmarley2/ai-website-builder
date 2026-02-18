'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 15, suffix: '+', label: 'Yıllık Deneyim' },
  { value: 3000, suffix: '+', label: 'Tamamlanan Proje' },
  { value: 500, suffix: '+', label: 'Mutlu Müşteri' },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
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
      className="text-5xl font-extrabold text-[#1a365d] sm:text-6xl dark:text-[#d4a843]"
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
    <section
      id="hakkimizda"
      className="bg-[#f8fafc] py-24 transition-colors duration-300 dark:bg-[#0f172a]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div className="mb-16 text-center" variants={itemVariants}>
            <h2 className="text-4xl font-bold text-[#1a365d] sm:text-5xl dark:text-white">
              Hakkımızda
            </h2>
          </motion.div>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: text content */}
            <div className="space-y-6">
              <motion.p
                className="text-lg leading-relaxed text-gray-600 dark:text-gray-300"
                variants={itemVariants}
              >
                Pars Tabela olarak 15 yılı aşkın deneyimimizle Türkiye&apos;nin önde gelen tabela
                üreticilerinden biriyiz. Modern teknoloji ve geleneksel ustalığı bir araya getirerek,
                markanızı en iyi şekilde yansıtan tabela çözümleri sunuyoruz.
              </motion.p>
              <motion.p
                className="text-lg leading-relaxed text-gray-600 dark:text-gray-300"
                variants={itemVariants}
              >
                Neon tabeladan LED aydınlatmaya, kutu harften elektronik tabelalara kadar geniş ürün
                yelpazemizle her sektöre özel çözümler üretiyoruz.
              </motion.p>
              <motion.p
                className="text-lg leading-relaxed text-gray-600 dark:text-gray-300"
                variants={itemVariants}
              >
                Müşteri memnuniyetini her zaman ön planda tutarak, kaliteli malzeme ve
                profesyonel işçilik ile uzun ömürlü ürünler sunmayı hedefliyoruz.
              </motion.p>
            </div>

            {/* Right: stats grid */}
            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {STATS.map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className="rounded-xl border border-[#e2e8f0] bg-white p-8 text-center shadow-sm dark:border-[#334155] dark:bg-[#1e293b]"
                >
                  <div className="mb-2 flex justify-center">
                    <div className="h-1 w-8 rounded-full bg-[#d4a843]" />
                  </div>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="mt-3 text-base font-medium text-gray-500 dark:text-gray-400">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
