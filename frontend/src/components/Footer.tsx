'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { HeartIcon, GlobeAltIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const footerLinks = [
  {
    title: '生态资源',
    items: [
      { label: 'Polkadot 文档', href: 'https://wiki.polkadot.network/' },
      { label: 'Substrate 开发教程', href: 'https://docs.substrate.io/' },
      { label: 'OpenGov 提案', href: 'https://polkadot.polkassembly.io/' },
    ],
  },
  {
    title: '平台指南',
    items: [
      { label: '贡献规范', href: '/docs/contribution-guide' },
      { label: '评审流程', href: '/docs/review-process' },
      { label: '代币经济', href: '/docs/token-model' },
    ],
  },
  {
    title: '社区',
    items: [
      { label: 'Telegram', href: 'https://t.me/proof_of_love' },
      { label: 'Twitter', href: 'https://twitter.com/Polkadot' },
      { label: 'GitHub', href: 'https://github.com/proof-of-love' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-purple-500/20 bg-gray-950/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Proof of Love</p>
                <p className="text-sm text-purple-200/80">Polkadot 生态贡献平台</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              通过去中心化机制连接开发者、教育者与社区治理成员，让每一份爱心贡献都能得到公平认可与激励。
            </p>
            <div className="mt-6 flex items-center space-x-3 text-xs text-gray-500">
              <GlobeAltIcon className="h-4 w-4" />
              <span>多语言支持 · 跨链协作 · 去中心化存证</span>
            </div>
          </motion.div>

          {footerLinks.map((group, index) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * (index + 1) }}
              viewport={{ once: true }}
            >
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-200">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-400">
                {group.items.map((item) => (
                  <li key={item.label}>
                    {item.href.startsWith('http') ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="transition-colors hover:text-white"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className="transition-colors hover:text-white">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-gray-800 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Proof of Love. All rights reserved.</p>
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-4 w-4" />
            <span>以教育与开源为核心的影响力网络</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/privacy" className="hover:text-gray-300">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-gray-300">
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

