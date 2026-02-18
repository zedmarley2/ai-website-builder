'use client';

import { motion } from 'framer-motion';

interface Service {
  icon: string;
  title: string;
  description: string;
  color: string;
}

const SERVICES: Service[] = [
  {
    icon: '💡',
    title: 'Neon Tabela',
    description:
      'Klasik ve modern neon tabelalar ile markanızı ön plana çıkarın. El yapımı cam neon tüpler ile benzersiz tasarımlar.',
    color: '#00f0ff',
  },
  {
    icon: '💡',
    title: 'LED Tabela',
    description:
      'Enerji tasarruflu LED tabelalar ile 7/24 görünürlük sağlayın. Uzun ömürlü ve bakım gerektirmeyen çözümler.',
    color: '#39ff14',
  },
  {
    icon: '📺',
    title: 'Elektronik Tabela',
    description:
      'Dijital ekranlar ve programlanabilir LED paneller ile dinamik içerik gösterin. Uzaktan yönetim imkanı.',
    color: '#ff006e',
  },
  {
    icon: '🔤',
    title: 'Kutu Harf',
    description:
      'Işıklı ve ışıksız kutu harf uygulamaları. Paslanmaz çelik, alüminyum ve akrilik seçenekleri.',
    color: '#00f0ff',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' as const },
  }),
};

export function ServicesSection() {
  return (
    <section id="hizmetlerimiz" className="bg-gray-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2
            className="text-4xl font-bold text-[#00f0ff] sm:text-5xl"
            style={{
              textShadow: '0 0 7px #00f0ff, 0 0 10px #00f0ff, 0 0 21px #00f0ff',
            }}
          >
            Hizmetlerimiz
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Markanızı parlatacak profesyonel tabela çözümleri
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              className="group rounded-2xl border border-gray-800 bg-gray-900/50 p-6 transition-all duration-300 hover:border-transparent"
              style={{
                ['--glow-color' as string]: service.color,
              }}
              whileHover={{
                boxShadow: `0 0 20px ${service.color}40, 0 0 40px ${service.color}20`,
                borderColor: service.color,
              }}
            >
              <div className="mb-4 text-4xl">{service.icon}</div>
              <h3
                className="mb-3 text-xl font-bold"
                style={{
                  color: service.color,
                  textShadow: `0 0 7px ${service.color}, 0 0 10px ${service.color}`,
                }}
              >
                {service.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
