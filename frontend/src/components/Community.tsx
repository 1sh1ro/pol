'use client';

import { motion } from 'framer-motion';
import { UserGroupIcon, SparklesIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';

const testimonials = [
  {
    name: 'Alice · Substrate 开发者',
    statement:
      '通过 Proof of Love，我的跨链教学教程获得了生态基金的资助，也找到了新的协作者。平台的贡献评估极大提升了透明度。',
  },
  {
    name: 'Bob · 波卡社区志愿者',
    statement:
      'PoL 的治理面板与贡献记录帮助我们在提案讨论前快速了解背景，DeepSeek 助手给出的评估结论也很可靠。',
  },
  {
    name: 'Carol · 教育内容创作者',
    statement:
      '我提交的每个内容都能被快速审核并得到改进建议，PoL 让中文开发者的努力被更多人看到。',
  },
];

export function Community() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-purple-900/40 to-transparent" />
        <div className="absolute -inset-y-10 inset-x-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.35),_transparent_65%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 text-sm font-medium text-purple-200">
            <UserGroupIcon className="mr-2 h-4 w-4" />
            社区共建
          </div>
          <h2 className="mt-6 text-4xl font-bold text-white">贡献者怎么说</h2>
          <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
            我们正在构建一个跨链、跨语言的协作网络，每一次贡献都能得到尊重与反馈。
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl border border-gray-700/40 bg-gray-900/60 p-8 backdrop-blur"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-purple-600/10" />
              <div className="relative">
                <ChatBubbleOvalLeftEllipsisIcon className="h-8 w-8 text-purple-400" />
                <p className="mt-6 text-base text-gray-200 leading-relaxed">
                  {testimonial.statement}
                </p>
                <p className="mt-6 text-sm font-semibold text-purple-300">
                  {testimonial.name}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-600/40 via-pink-600/40 to-blue-600/40 p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-3">加入 PoL Bounty & Mentorship 计划</h3>
                <p className="text-gray-100/80 max-w-2xl">
                  获得导师指导、资助机会和独家社区活动。模型助手会帮助你准备申请材料，社区评委给出最后裁决。
                </p>
              </div>
              <a
                href="https://t.me/proof_of_love"
                className="inline-flex items-center justify-center rounded-full bg-white/90 px-6 py-3 text-sm font-semibold text-purple-700 transition hover:bg-white"
                target="_blank"
                rel="noreferrer"
              >
                <SparklesIcon className="mr-2 h-5 w-5" /> 立即加入社区
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

