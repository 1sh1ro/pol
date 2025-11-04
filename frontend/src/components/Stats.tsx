'use client';

import { motion } from 'framer-motion';

const stats = [
  {
    label: '累计贡献',
    value: '5,240+',
    description: '来自全球 Polkadot & EVM 社区的有效贡献记录',
  },
  {
    label: '治理提案通过率',
    value: '78%',
    description: '在社区投票中通过的提案比例',
  },
  {
    label: '教育内容播放量',
    value: '1M+',
    description: '面向中文开发者的教育资料累计播放',
  },
  {
    label: '跨链协作项目',
    value: '62',
    description: '正在进行的跨链协作与资助项目',
  },
];

export function Stats() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-64 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">生态影响力数据</h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            我们通过链上数据与社区行为量化贡献价值，持续验证 Proof of Love 平台的影响力增长。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gray-900/70 backdrop-blur-sm p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 opacity-0 transition-opacity duration-300 hover:opacity-100" />
              <div className="relative">
                <h3 className="text-sm font-medium uppercase tracking-widest text-purple-200">
                  {stat.label}
                </h3>
                <p className="mt-4 text-4xl font-bold text-white">{stat.value}</p>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

