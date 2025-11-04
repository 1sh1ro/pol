'use client';

import { motion } from 'framer-motion';
import {
  TrophyIcon,
  StarIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  CodeBracketIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

const tiers = [
  {
    title: 'Legendary Heart',
    description: '跨越技术、教育与治理的综合贡献者。适用于在多个维度持续贡献的 PoL 旗手。',
    icon: TrophyIcon,
    gradient: 'from-amber-500 to-rose-500',
    requirements: [
      'AI 综合评分 ≥ 90 且至少 3 次治理通过',
      '推动 ≥ 2 个跨链协作项目落地',
      '社区导师计划累计服务 ≥ 50 小时',
    ],
    perks: [
      '治理权重 +20%，拥有徽章专属提案通道',
      '优先参与 PoL 资助与生态活动',
      '获得链上传奇徽章 NFT（动态渲染）',
    ],
  },
  {
    title: 'Builder Heart',
    description: '在技术栈深耕或推动关键基础设施改进的核心开发者。',
    icon: CodeBracketIcon,
    gradient: 'from-purple-500 to-indigo-500',
    requirements: [
      '技术评分 ≥ 85；提交 ≥ 5 个主网提案或 PR',
      '至少 1 个开源仓库获得跨团队采用',
      '完成安全审计或关键模块测试覆盖',
    ],
    perks: [
      '技术资助优先级 +10%',
      '年度技术圆桌邀请函',
      '链上展示的 Builder NFT 徽章',
    ],
  },
  {
    title: 'Community Heart',
    description: '用教育内容、翻译和社区运营让更多人参与波卡生态。',
    icon: AcademicCapIcon,
    gradient: 'from-pink-500 to-violet-500',
    requirements: [
      '教育/社区评分 ≥ 80',
      '单月原创内容覆盖 ≥ 5,000 人次',
      '至少 2 次线下活动或黑客松主持',
    ],
    perks: [
      '品牌联合推广位、社交媒体共建',
      'PoL 学院导师计划对接',
      '社区治理投票时额外备注展示',
    ],
  },
];

const milestoneTimeline = [
  {
    title: 'AI 初审通过',
    content: '在 Contribute 中完成 DeepSeek 评审，生成可读的评分与风险提示。',
    icon: StarIcon,
  },
  {
    title: '链上登记',
    content: '通过 ContributionRegistry 记录贡献元数据、AI 评分与证据指纹。',
    icon: HeartIcon,
  },
  {
    title: '治理终审',
    content: '治理委员会基于仪表盘完成最终裁决，触发奖励或资金发放。',
    icon: GlobeAltIcon,
  },
];

export function Achievements() {
  return (
    <section className="relative py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-purple-900/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200">
            <TrophyIcon className="mr-2 h-4 w-4" /> 开放的贡献徽章体系
          </div>
          <h2 className="mt-6 text-4xl font-bold text-white">Proof of Love 成就等级</h2>
          <p className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto">
            每一枚徽章都由链上数据、AI 评分与治理决策共同背书。争取更高等级，解锁更多治理权重与生态资源。
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gray-900/70 p-8 backdrop-blur"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-20`} />
              <div className="relative">
                <div className="flex items-center gap-3 text-white">
                  <tier.icon className="h-6 w-6 text-purple-200" />
                  <h3 className="text-xl font-semibold">{tier.title}</h3>
                </div>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">{tier.description}</p>

                <div className="mt-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-100">
                  <p className="text-xs font-semibold uppercase tracking-wide">升级条件</p>
                  <ul className="mt-3 space-y-2 text-gray-100">
                    {tier.requirements.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-wide">解锁权益</p>
                  <ul className="mt-3 space-y-2 text-gray-100">
                    {tier.perks.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-20 rounded-3xl border border-purple-500/30 bg-gray-900/70 p-10"
        >
          <h3 className="text-2xl font-semibold text-white">徽章激活流程</h3>
          <p className="mt-2 text-sm text-gray-300">
            完成以下三个阶段，即可自动触发徽章铸造与治理权益升级。
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {milestoneTimeline.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-gray-700/40 bg-gray-950/60 p-6"
              >
                <div className="flex items-center gap-3 text-white">
                  <step.icon className="h-6 w-6 text-purple-200" />
                  <h4 className="text-lg font-semibold">{step.title}</h4>
                </div>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">{step.content}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

