'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'react-query';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi';
import { contributionRegistryAbi } from '@/lib/abis/contributionRegistry';

type ContributionType = 'code' | 'education' | 'governance' | 'community' | 'other';

interface FormState {
  title: string;
  contributionType: ContributionType;
  summary: string;
  impact: string;
  evidence: string;
  contributor: string;
}

interface StructuredEvaluation {
  verdict?: 'accept' | 'needs_review' | 'reject' | string;
  score?: {
    technical?: number;
    community?: number;
    governance?: number;
    overall?: number;
  };
  confidence?: string;
  summary?: string;
  strengths?: string[];
  risks?: string[];
  recommendations?: string[];
}

interface JudgeResponse {
  ok: boolean;
  content: string;
  structured: StructuredEvaluation | null;
}

const contributionTypeOptions: Array<{ value: ContributionType; label: string }> = [
  { value: 'code', label: '代码贡献 / 技术实现' },
  { value: 'education', label: '教育内容 / 翻译' },
  { value: 'governance', label: '治理提案 / 策略' },
  { value: 'community', label: '社区活动 / 宣传' },
  { value: 'other', label: '其他类型贡献' },
];

export function Contribute() {
  const [form, setForm] = useState<FormState>({
    title: '',
    contributionType: 'code',
    summary: '',
    impact: '',
    evidence: '',
    contributor: '',
  });
  const [evaluation, setEvaluation] = useState<JudgeResponse | null>(null);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | null>(null);
  const [isSubmittingOnChain, setIsSubmittingOnChain] = useState(false);
  const [lastContributionId, setLastContributionId] = useState<number | null>(null);

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const contributionRegistryAddress = CONTRACT_ADDRESSES.CONTRIBUTION_REGISTRY;
  const registryConfigured = useMemo(
    () => contributionRegistryAddress && contributionRegistryAddress !== '0x...',
    [contributionRegistryAddress]
  );

  const truncatedRegistryAddress = useMemo(() => {
    if (!registryConfigured) return '';
    return `${contributionRegistryAddress.slice(0, 6)}…${contributionRegistryAddress.slice(-4)}`;
  }, [registryConfigured, contributionRegistryAddress]);

  const expectedContributionIdRef = useRef<number | null>(null);
  const waitToastRef = useRef<string | undefined>();

  const { data: nextContributionId } = useReadContract({
    address: registryConfigured
      ? (contributionRegistryAddress as `0x${string}`)
      : undefined,
    abi: contributionRegistryAbi,
    functionName: 'nextContributionId',
    query: {
      enabled: registryConfigured,
    },
  });

  const {
    isLoading: isTxLoading,
    isSuccess: isTxSuccess,
    isError: isTxError,
  } = useWaitForTransactionReceipt({
    hash: pendingTxHash ?? undefined,
    query: {
      enabled: Boolean(pendingTxHash),
    },
  });

  const mutation = useMutation(async (payload: FormState) => {
    const response = await fetch('/api/contributions/judge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: payload.title,
        contributionType: payload.contributionType,
        summary: payload.summary,
        impact: payload.impact,
        contributor: payload.contributor,
        evidenceLinks: payload.evidence
          .split('\n')
          .map((link) => link.trim())
          .filter(Boolean),
      }),
    });

    const data = (await response.json()) as JudgeResponse & { error?: string };

    if (!response.ok) {
      throw new Error(data.error || 'AI 评审请求失败');
    }

    return data;
  });

  useEffect(() => {
    if (!pendingTxHash) {
      if (waitToastRef.current) {
        toast.dismiss(waitToastRef.current);
        waitToastRef.current = undefined;
      }
      return;
    }

    if (isTxLoading) {
      if (!waitToastRef.current) {
        waitToastRef.current = toast.loading('链上确认中…');
      }
      return;
    }

    if (isTxSuccess) {
      if (waitToastRef.current) {
        toast.success('链上登记成功', { id: waitToastRef.current });
      } else {
        toast.success('链上登记成功');
      }
      setPendingTxHash(null);
      waitToastRef.current = undefined;
      if (expectedContributionIdRef.current !== null) {
        setLastContributionId(expectedContributionIdRef.current);
      }
      expectedContributionIdRef.current = null;
      return;
    }

    if (isTxError) {
      if (waitToastRef.current) {
        toast.error('链上交易失败', { id: waitToastRef.current });
      } else {
        toast.error('链上交易失败');
      }
      setPendingTxHash(null);
      waitToastRef.current = undefined;
      expectedContributionIdRef.current = null;
    }
  }, [pendingTxHash, isTxLoading, isTxSuccess, isTxError]);

  const verdictMeta = useMemo(() => {
    if (!evaluation?.structured?.verdict) {
      return null;
    }

    switch (evaluation.structured.verdict) {
      case 'accept':
        return {
          label: '建议通过',
          className: 'bg-green-500/10 text-green-300 border border-green-500/40',
        };
      case 'needs_review':
        return {
          label: '需要人工复核',
          className: 'bg-amber-500/10 text-amber-300 border border-amber-500/40',
        };
      case 'reject':
        return {
          label: '建议驳回',
          className: 'bg-rose-500/10 text-rose-300 border border-rose-500/40',
        };
      default:
        return {
          label: evaluation.structured.verdict,
          className: 'bg-purple-500/10 text-purple-200 border border-purple-500/40',
        };
    }
  }, [evaluation?.structured?.verdict]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.summary.trim()) {
      toast.error('请填写贡献摘要');
      return;
    }

    try {
      const result = await mutation.mutateAsync(form);
      setEvaluation(result);
      toast.success('已生成 AI 评审结果');
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : '提交失败，请稍后再试');
    }
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isOnChainActionDisabled = useMemo(
    () => !evaluation || !registryConfigured || isSubmittingOnChain || Boolean(pendingTxHash),
    [evaluation, registryConfigured, isSubmittingOnChain, pendingTxHash]
  );

  const mapVerdictToEnum = (verdict?: string | null) => {
    const normalized = verdict?.toLowerCase().replace(/\s+/g, '_');
    if (normalized === 'accept') return 1;
    if (normalized === 'reject') return 3;
    if (normalized === 'needs_review' || normalized === 'needs-review') return 2;
    return evaluation?.structured ? 2 : 0;
  };

  const toUint16Score = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return BigInt(0);
    }

    const clamped = Math.min(100, Math.max(0, value));
    return BigInt(Math.round(clamped * 10));
  };

  const computeOverallScore = (score: StructuredEvaluation['score']) => {
    if (!score) return BigInt(0);
    if (typeof score.overall === 'number') {
      return toUint16Score(score.overall);
    }

    const values = [score.technical, score.community, score.governance].filter(
      (item): item is number => typeof item === 'number' && !Number.isNaN(item)
    );

    if (!values.length) {
      return BigInt(0);
    }

    const average = values.reduce((acc, item) => acc + item, 0) / values.length;
    return toUint16Score(average);
  };

  const handleRegisterOnChain = async () => {
    if (!evaluation) {
      toast.error('请先生成 AI 评审结果');
      return;
    }

    if (!registryConfigured) {
      toast.error('尚未配置贡献登记合约地址');
      return;
    }

    if (!isConnected) {
      toast.error('请先连接支持的 EVM 钱包');
      return;
    }

    const structured = evaluation.structured;
    const verdictEnum = mapVerdictToEnum(structured?.verdict);
    const evidenceLinks = form.evidence
      .split('\n')
      .map((link) => link.trim())
      .filter(Boolean);

    const metadataPayload = {
      title: form.title || '未命名贡献',
      contributionType: form.contributionType,
      summary: form.summary,
      impact: form.impact,
      evidenceLinks,
      submitter: form.contributor || address || 'anonymous',
      aiGeneratedAt: new Date().toISOString(),
    };

    const toastId = toast.loading('链上登记交易签名中…');
    setIsSubmittingOnChain(true);

    try {
      const anticipatedId = nextContributionId ? Number(nextContributionId) : null;
      expectedContributionIdRef.current = anticipatedId;

      const txHash = await writeContractAsync({
        address: contributionRegistryAddress as `0x${string}`,
        abi: contributionRegistryAbi,
        functionName: 'submitContribution',
        args: [
          form.title || '未命名贡献',
          JSON.stringify(metadataPayload),
          structured ? JSON.stringify(structured) : evaluation.content,
          BigInt(verdictEnum),
          toUint16Score(structured?.score?.technical),
          toUint16Score(structured?.score?.community),
          toUint16Score(structured?.score?.governance),
          computeOverallScore(structured?.score),
        ],
      });

      setPendingTxHash(txHash);
      toast.success('交易已发送，等待链上确认', { id: toastId });
    } catch (error) {
      expectedContributionIdRef.current = null;
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : '链上提交失败，请稍后重试',
        { id: toastId }
      );
    } finally {
      setIsSubmittingOnChain(false);
    }
  };

  return (
    <section className="relative py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(76,29,149,0.25),_transparent_65%)]" />
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-purple-500/20 bg-gray-900/70 p-8 shadow-xl backdrop-blur"
          >
            <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200">
              <SparklesIcon className="h-4 w-4" />
              <span>AI 辅助评审 · DeepSeek</span>
            </div>
            <h2 className="text-3xl font-bold text-white">
              提交你的贡献，先让 AI 给出初步评审
            </h2>
            <p className="mt-4 text-base text-gray-300 leading-relaxed">
              DeepSeek 模型会根据 PoL 贡献规范，从技术含量、社区影响、治理价值、安全与合规风险等维度给出建议评分，并提供改进建议。
              最终结果仍由治理委员会或社区投票确认。
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-200">贡献标题</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    placeholder="例如：XCM 教程系列 / Polkadot 工具库 PR"
                    className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200">贡献者 / 团队</label>
                  <input
                    type="text"
                    value={form.contributor}
                    onChange={(event) => handleChange('contributor', event.target.value)}
                    placeholder="可选，填写昵称、组织或钱包地址"
                    className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200">贡献类型</label>
                <select
                  value={form.contributionType}
                  onChange={(event) => handleChange('contributionType', event.target.value as ContributionType)}
                  className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-100 focus:border-purple-500 focus:outline-none"
                >
                  {contributionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200">贡献摘要</label>
                <textarea
                  value={form.summary}
                  onChange={(event) => handleChange('summary', event.target.value)}
                  placeholder="描述核心工作内容、关键技术或社区贡献点，控制在 200-400 字"
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200">预期影响与成果</label>
                <textarea
                  value={form.impact}
                  onChange={(event) => handleChange('impact', event.target.value)}
                  placeholder="说明对社区的影响、覆盖人群、技术指标或治理价值"
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200">证据链接（每行一个）</label>
                <textarea
                  value={form.evidence}
                  onChange={(event) => handleChange('evidence', event.target.value)}
                  placeholder="GitHub PR、教程链接、治理提案、截图等公开凭证"
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: mutation.isLoading ? 1 : 1.02 }}
                type="submit"
                disabled={mutation.isLoading}
                className="group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                <PaperAirplaneIcon className="mr-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                {mutation.isLoading ? '模型评审中…' : '提交 AI 预评审'}
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true }}
            className="flex h-full flex-col gap-6"
          >
            <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-purple-600/10 p-6 backdrop-blur">
              <div className="flex items-center space-x-3">
                <ShieldCheckIcon className="h-6 w-6 text-emerald-300" />
                <div>
                  <h3 className="text-lg font-semibold text-white">三层评审流程</h3>
                  <p className="text-sm text-emerald-100/80">
                    1) 链上/仓库自动校验 · 2) DeepSeek AI 初审 · 3) 人类治理层终审。
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-gray-900/70 p-6 backdrop-blur">
              <div className="flex items-center space-x-3">
                <LightBulbIcon className="h-6 w-6 text-purple-300" />
                <h3 className="text-lg font-semibold text-white">提示词建议</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li>· 精确描述你完成的工作与使用的技术栈。</li>
                <li>· 罗列社区反馈或数据指标，便于模型衡量影响力。</li>
                <li>· 附上公开可验证的链接，方便后续人工复核。</li>
              </ul>
            </div>

            {evaluation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex-1 overflow-hidden rounded-3xl border border-purple-500/30 bg-gray-900/80 p-6 backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">模型评审结果</h3>
                  {verdictMeta && (
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verdictMeta.className}`}>
                      {verdictMeta.label}
                    </span>
                  )}
                </div>

                {evaluation.structured?.score && (
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <ScoreCard label="技术质量" value={evaluation.structured.score.technical} />
                    <ScoreCard label="社区影响" value={evaluation.structured.score.community} />
                    <ScoreCard label="治理价值" value={evaluation.structured.score.governance} />
                    <ScoreCard label="综合评分" value={evaluation.structured.score.overall} highlight />
                  </div>
                )}

                {evaluation.structured?.summary && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-200">评审概述</h4>
                    <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                      {evaluation.structured.summary}
                    </p>
                  </div>
                )}

                {evaluation.structured?.strengths?.length ? (
                  <BulletList title="亮点" items={evaluation.structured.strengths} tone="positive" />
                ) : null}

                {evaluation.structured?.risks?.length ? (
                  <BulletList title="风险" items={evaluation.structured.risks} tone="warning" />
                ) : null}

                {evaluation.structured?.recommendations?.length ? (
                  <BulletList title="改进建议" items={evaluation.structured.recommendations} tone="neutral" />
                ) : null}

                {!evaluation.structured && (
                  <div className="mt-6 rounded-2xl border border-purple-500/20 bg-gray-950/60 p-4">
                    <p className="text-sm text-gray-200 whitespace-pre-line">
                      {evaluation.content}
                    </p>
                  </div>
                )}

                {evaluation.structured?.confidence && (
                  <p className="mt-6 text-xs text-gray-500">
                    模型置信度：{evaluation.structured.confidence}
                    ，请结合人工判断与链上验证结果再做最终决议。
                  </p>
                )}

                <div className="mt-6 rounded-2xl border border-purple-500/20 bg-gray-950/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: isOnChainActionDisabled ? 1 : 1.02 }}
                      type="button"
                      onClick={handleRegisterOnChain}
                      disabled={isOnChainActionDisabled}
                      className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ShieldCheckIcon className="mr-2 h-5 w-5" />
                      {pendingTxHash ? '等待链上确认…' : '提交链上登记'}
                    </motion.button>

                    <div className="text-xs text-gray-400 space-y-1">
                      {registryConfigured ? (
                        <p>
                          合约地址：
                          <span className="font-mono text-purple-200">{truncatedRegistryAddress}</span>
                        </p>
                      ) : (
                        <p className="text-amber-300">尚未配置 ContributionRegistry 合约地址</p>
                      )}
                      {lastContributionId !== null && (
                        <p>
                          最近登记编号：
                          <span className="font-mono text-purple-200">#{lastContributionId}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {pendingTxHash && (
                    <p className="mt-3 text-xs text-purple-200">
                      当前交易哈希：
                      <span className="font-mono">
                        {pendingTxHash.slice(0, 10)}…{pendingTxHash.slice(-6)}
                      </span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface ScoreCardProps {
  label: string;
  value?: number;
  highlight?: boolean;
}

function ScoreCard({ label, value, highlight }: ScoreCardProps) {
  if (typeof value !== 'number') return null;

  return (
    <div
      className={`rounded-2xl border border-purple-500/20 bg-gray-950/60 p-4 ${
        highlight ? 'border-purple-400/40 bg-purple-500/10' : ''
      }`}
    >
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value.toFixed(1)}</p>
    </div>
  );
}

interface BulletListProps {
  title: string;
  items?: string[];
  tone?: 'positive' | 'warning' | 'neutral';
}

const toneStyles: Record<NonNullable<BulletListProps['tone']>, string> = {
  positive: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100',
  warning: 'border-amber-500/20 bg-amber-500/5 text-amber-100',
  neutral: 'border-purple-500/20 bg-purple-500/5 text-purple-100',
};

function BulletList({ title, items, tone = 'neutral' }: BulletListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`mt-6 rounded-2xl border p-4 text-sm ${toneStyles[tone]}`}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-white/80">
        {title}
      </h4>
      <ul className="mt-3 space-y-2 text-white/90">
        {items.map((item) => (
          <li key={item} className="leading-relaxed">
            · {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

