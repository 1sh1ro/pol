'use client';

import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  CodeBracketIcon,
  UserGroupIcon,
  TrophyIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: '贡献证明系统',
    description: '通过智能合约自动记录和验证开发者的社区贡献，包括代码、教育内容、翻译等。',
    icon: CodeBracketIcon,
    color: 'from-purple-500 to-purple-600',
  },
  {
    name: '教育内容奖励',
    description: '鼓励开发者创作高质量的教育内容，帮助更多人了解 Polkadot 生态技术。',
    icon: AcademicCapIcon,
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'NFT 成就徽章',
    description: '通过可验证的 NFT 徽章展示个人成就和里程碑，建立可信赖的开发者身份。',
    icon: TrophyIcon,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    name: '去中心化治理',
    description: '基于 PoL 代币的社区治理机制，让贡献者直接参与平台发展方向决策。',
    icon: DocumentTextIcon,
    color: 'from-green-500 to-green-600',
  },
  {
    name: '跨链集成',
    description: '充分利用 Polkadot 的跨链能力，连接不同生态的开发者和资源。',
    icon: GlobeAltIcon,
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    name: '经济激励机制',
    description: '将社区贡献转化为实际经济价值，创造可持续的生态发展模式。',
    icon: CurrencyDollarIcon,
    color: 'from-pink-500 to-pink-600',
  },
];

export function Features() {
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            核心功能特性
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            基于 Polkadot 的强大技术能力，我们构建了一套完整的
            去中心化影响力生态系统
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.1,
                viewport: { once: true }
              }}
              whileHover={{
                y: -5,
                transition: { duration: 0.3 }
              }}
              className="group relative"
            >
              <div className="relative h-full p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-all duration-300">
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`inline-flex p-3 bg-gradient-to-br ${feature.color} rounded-xl mb-6`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.name}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute -inset-px bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-3">
            <SparklesIcon className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-medium">
              采用最新的 REVM 技术栈，与以太坊工具完全兼容
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}