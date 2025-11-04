'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  HeartIcon,
  GlobeAltIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { ArrowDownIcon } from '@heroicons/react/24/solid';

export function Hero() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20" />
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-8"
          >
            <SparklesIcon className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">
              基于 Polkadot 生态的去中心化影响力平台
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Proof of Love
            </span>
            <br />
            <span className="text-3xl sm:text-4xl lg:text-5xl text-gray-300">
              用爱心构建影响力
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            通过量化开发者的社区贡献、教育分享和爱心行为，
            搭建全球 Polkadot 生态与中文开发者之间的重要桥梁，
            让每一份贡献都能被看见、被认可、被奖励。
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <ConnectButton
                showBalance={false}
                chainStatus="none"
                accountStatus="address"
              />
            </motion.div>

            <motion.a
              href="/contribute"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-4 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              <HeartIcon className="w-5 h-5" />
              <span>开始贡献</span>
            </motion.a>
          </motion.div>

          {/* Feature Icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <CodeBracketIcon className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold">代码贡献</h3>
              <p className="text-gray-400 text-sm">
                通过开源贡献获得 PoL 代币奖励
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-white font-semibold">教育分享</h3>
              <p className="text-gray-400 text-sm">
                创作教育内容，帮助社区成长
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <GlobeAltIcon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold">跨链协作</h3>
              <p className="text-gray-400 text-sm">
                连接全球 Polkadot 开发者生态
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center space-y-2 text-gray-400"
          >
            <span className="text-sm">滚动探索更多</span>
            <ArrowDownIcon className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}