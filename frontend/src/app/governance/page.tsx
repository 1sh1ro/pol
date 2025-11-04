'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { contributionRegistryAbi } from '@/lib/abis/contributionRegistry';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type Address = `0x${string}`;

interface ContributionMetadata {
  title?: string;
  contributionType?: string;
  summary?: string;
  impact?: string;
  evidenceLinks?: string[];
  submitter?: string;
  aiGeneratedAt?: string;
}

interface AIReport {
  verdict?: string;
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

interface ParsedContribution {
  id: number;
  submitter: Address;
  title: string;
  aiVerdict: number;
  finalVerdict: number;
  score: {
    technical: number;
    community: number;
    governance: number;
    overall: number;
  };
  submittedAt: number;
  finalizedAt: number;
  finalApprover: Address;
  proposalId: number;
  notes: string;
  metadata: ContributionMetadata | null;
  aiReport: AIReport | null;
  aiReportRaw: string;
}

const VERDICT_STYLES: Record<number, { label: string; badge: string; tone: 'pending' | 'positive' | 'warning' | 'negative' }> = {
  0: {
    label: '待治理终审',
    badge: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    tone: 'pending',
  },
  1: {
    label: '已通过',
    badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    tone: 'positive',
  },
  2: {
    label: '需要人工复核',
    badge: 'border-purple-500/40 bg-purple-500/10 text-purple-200',
    tone: 'warning',
  },
  3: {
    label: '已驳回',
    badge: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
    tone: 'negative',
  },
};

const AI_VERDICT_LABEL: Record<number, string> = {
  0: '待模型判定',
  1: '建议通过',
  2: '建议复核',
  3: '建议驳回',
};

const DECISION_BUTTONS = [
  {
    verdict: 1,
    label: '通过贡献',
    tone: 'positive' as const,
    icon: CheckCircleIcon,
  },
  {
    verdict: 2,
    label: '退回复核',
    tone: 'warning' as const,
    icon: ExclamationTriangleIcon,
  },
  {
    verdict: 3,
    label: '驳回贡献',
    tone: 'negative' as const,
    icon: XCircleIcon,
  },
];

const toneButtonStyles: Record<'positive' | 'warning' | 'negative', string> = {
  positive: 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/30',
  warning: 'bg-amber-500/20 border border-amber-500/40 text-amber-100 hover:bg-amber-500/30',
  negative: 'bg-rose-500/20 border border-rose-500/40 text-rose-100 hover:bg-rose-500/30',
};

const shortenAddress = (value?: string) => {
  if (!value) return '--';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

const safeParseJSON = <T,>(value?: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('JSON parse error', error);
    return null;
  }
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') return Number(value);
  return Number(value ?? 0);
};

const decodeScore = (rawScore: any) => {
  return {
    technical: toNumber(rawScore?.technical ?? rawScore?.[0] ?? 0) / 10,
    community: toNumber(rawScore?.community ?? rawScore?.[1] ?? 0) / 10,
    governance: toNumber(rawScore?.governance ?? rawScore?.[2] ?? 0) / 10,
    overall: toNumber(rawScore?.overall ?? rawScore?.[3] ?? 0) / 10,
  };
};

const parseContribution = (raw: any): ParsedContribution => {
  let metadata = safeParseJSON<ContributionMetadata>(raw?.metadataURI);
  const aiReport = safeParseJSON<AIReport>(raw?.aiReport);
  const score = decodeScore(raw?.score);

  if (metadata?.evidenceLinks && !Array.isArray(metadata.evidenceLinks)) {
    metadata = {
      ...metadata,
      evidenceLinks: [String(metadata.evidenceLinks)],
    };
  }

  const title = raw?.title && raw.title.length > 0
    ? raw.title
    : metadata?.title || '未命名贡献';

  return {
    id: Number(raw?.id ?? raw?.[0] ?? 0),
    submitter: (raw?.submitter ?? raw?.[1] ?? '0x0000000000000000000000000000000000000000') as Address,
    title,
    aiVerdict: Number(raw?.aiVerdict ?? raw?.[5] ?? 0),
    finalVerdict: Number(raw?.finalVerdict ?? raw?.[8] ?? 0),
    score,
    submittedAt: Number(raw?.submittedAt ?? raw?.[7] ?? 0),
    finalizedAt: Number(raw?.finalizedAt ?? raw?.[10] ?? 0),
    finalApprover: (raw?.finalApprover ?? raw?.[9] ?? '0x0000000000000000000000000000000000000000') as Address,
    proposalId: Number(raw?.proposalId ?? raw?.[11] ?? 0),
    notes: raw?.notes ?? raw?.[12] ?? '',
    metadata,
    aiReport,
    aiReportRaw: raw?.aiReport ?? '',
  };
};

export default function GovernancePage() {
  const [notesMap, setNotesMap] = useState<Record<number, string>>({});
  const [proposalMap, setProposalMap] = useState<Record<number, string>>({});
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | null>(null);
  const [activeDecisionId, setActiveDecisionId] = useState<number | null>(null);

  const waitToastRef = useRef<string | undefined>();

  const registryAddress = CONTRACT_ADDRESSES.CONTRIBUTION_REGISTRY;
  const registryConfigured = registryAddress && registryAddress !== '0x...';

  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const {
    data: rawContributions,
    refetch: refetchContributions,
  } = useReadContract({
    address: registryConfigured ? (registryAddress as Address) : undefined,
    abi: contributionRegistryAbi,
    functionName: 'getContributions',
    args: [BigInt(0), BigInt(50)],
    query: {
      enabled: registryConfigured,
      refetchInterval: 15000,
    },
  });

  const { data: ownerAddress } = useReadContract({
    address: registryConfigured ? (registryAddress as Address) : undefined,
    abi: contributionRegistryAbi,
    functionName: 'owner',
    query: {
      enabled: registryConfigured,
    },
  });

  const { data: governanceExecutor } = useReadContract({
    address: registryConfigured ? (registryAddress as Address) : undefined,
    abi: contributionRegistryAbi,
    functionName: 'governanceExecutor',
    query: {
      enabled: registryConfigured,
    },
  });

  const contributions = useMemo<ParsedContribution[]>(() => {
    if (!rawContributions) return [];
    const list = (rawContributions as any[]).map(parseContribution);
    return list.sort((a, b) => b.submittedAt - a.submittedAt);
  }, [rawContributions]);

  const ownerDisplay = typeof ownerAddress === 'string' ? ownerAddress : '';
  const executorDisplay = typeof governanceExecutor === 'string' ? governanceExecutor : '';

  const canDecide = useMemo(() => {
    if (!isConnected || !address) return false;
    const normalizedWallet = address.toLowerCase();
    const normalizedOwner = ownerDisplay.toLowerCase();
    const normalizedExecutor = executorDisplay.toLowerCase();
    return normalizedWallet === normalizedOwner || normalizedWallet === normalizedExecutor;
  }, [isConnected, address, ownerDisplay, executorDisplay]);

  const {
    isLoading: isDecisionTxLoading,
    isSuccess: isDecisionTxSuccess,
    isError: isDecisionTxError,
  } = useWaitForTransactionReceipt({
    hash: pendingTxHash ?? undefined,
    query: {
      enabled: Boolean(pendingTxHash),
    },
  });

  useEffect(() => {
    if (!pendingTxHash) {
      if (waitToastRef.current) {
        toast.dismiss(waitToastRef.current);
        waitToastRef.current = undefined;
      }
      return;
    }

    if (isDecisionTxLoading) {
      if (!waitToastRef.current) {
        waitToastRef.current = toast.loading('治理决策确认中…');
      }
      return;
    }

    if (isDecisionTxSuccess) {
      if (waitToastRef.current) {
        toast.success('治理决策已上链', { id: waitToastRef.current });
      } else {
        toast.success('治理决策已上链');
      }
      waitToastRef.current = undefined;
      setPendingTxHash(null);
      if (activeDecisionId !== null) {
        setNotesMap((prev) => ({ ...prev, [activeDecisionId]: '' }));
        setProposalMap((prev) => ({ ...prev, [activeDecisionId]: '' }));
      }
      setActiveDecisionId(null);
      refetchContributions();
      return;
    }

    if (isDecisionTxError) {
      if (waitToastRef.current) {
        toast.error('治理交易执行失败', { id: waitToastRef.current });
      } else {
        toast.error('治理交易执行失败');
      }
      waitToastRef.current = undefined;
      setPendingTxHash(null);
      setActiveDecisionId(null);
    }
  }, [pendingTxHash, isDecisionTxLoading, isDecisionTxSuccess, isDecisionTxError, activeDecisionId, refetchContributions]);

  const handleDecision = async (contributionId: number, verdict: number) => {
    if (!registryConfigured) {
      toast.error('尚未配置贡献登记合约地址');
      return;
    }

    if (!canDecide) {
      toast.error('当前钱包地址无治理权限');
      return;
    }

    const notes = (notesMap[contributionId] ?? '').trim();
    const proposalValue = (proposalMap[contributionId] ?? '').trim();

    let proposalId = BigInt(0);
    if (proposalValue.length > 0) {
      try {
        proposalId = BigInt(proposalValue);
      } catch {
        toast.error('提案编号格式不正确');
        return;
      }
    }

    const toastId = toast.loading('提交治理决策中…');
    setActiveDecisionId(contributionId);

    try {
      const txHash = await writeContractAsync({
        address: registryAddress as Address,
        abi: contributionRegistryAbi,
        functionName: 'resolveContribution',
        args: [BigInt(contributionId), BigInt(verdict), proposalId, notes],
      });

      setPendingTxHash(txHash);
      toast.success('交易已发送，等待链上确认', { id: toastId });
    } catch (error) {
      console.error(error);
      setActiveDecisionId(null);
      toast.error(error instanceof Error ? error.message : '提交失败，请稍后再试', {
        id: toastId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-900">
      <div className="fixed inset-0 bg-black opacity-50 z-0" />
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
      </div>

      <div className="relative z-10">
        <Header />

        <main className="pt-24">
          <section className="relative py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl border border-purple-500/30 bg-gray-900/70 p-10 backdrop-blur"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="inline-flex items-center rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200">
                      <ShieldCheckIcon className="mr-2 h-4 w-4" /> PoL 治理面板
                    </div>
                    <h1 className="mt-4 text-3xl font-bold text-white">治理终审与发放控制中心</h1>
                    <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                      核心委员会成员可以基于 DeepSeek 模型输出、社区讨论与链上提案结果做出最终裁决。批准后将触发对贡献者的治理记录与资金发放。
                    </p>
                  </div>
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-purple-100">
                    <p>合约地址：
                      {registryConfigured ? (
                        <span className="ml-1 font-mono">{shortenAddress(registryAddress)}</span>
                      ) : (
                        <span className="ml-1 text-amber-200">未配置</span>
                      )}
                    </p>
                    <p className="mt-2">治理执行账户：{shortenAddress(executorDisplay || undefined)}</p>
                  </div>
                </div>
              </motion.div>

              <div className="mt-10 space-y-8">
                {contributions.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-3xl border border-dashed border-purple-500/30 bg-gray-900/60 p-10 text-center text-gray-300"
                  >
                    <SparklesIcon className="mx-auto h-10 w-10 text-purple-400" />
                    <p className="mt-4 text-lg font-semibold text-white">暂无待审贡献</p>
                    <p className="mt-2 text-sm text-gray-400">
                      当贡献者提交链上登记后，这里会展示 AI 评审结果、提交摘要和治理跟踪信息。
                    </p>
                  </motion.div>
                )}

                {contributions.map((contribution) => {
                  const aiVerdictLabel = AI_VERDICT_LABEL[contribution.aiVerdict] ?? '待模型判定';
                  const finalVerdictMeta = VERDICT_STYLES[contribution.finalVerdict] ?? VERDICT_STYLES[0];
                  const metadata = contribution.metadata;
                  const aiReport = contribution.aiReport;
                  const isProcessing = activeDecisionId === contribution.id && Boolean(pendingTxHash);

                  return (
                    <motion.div
                      key={contribution.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                      className="rounded-3xl border border-purple-500/20 bg-gray-900/75 p-8 backdrop-blur"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">贡献 #{contribution.id}</span>
                            <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', finalVerdictMeta.badge)}>
                              {finalVerdictMeta.label}
                            </span>
                          </div>
                          <h2 className="mt-2 text-2xl font-semibold text-white">{contribution.title}</h2>
                          <p className="mt-2 text-xs text-gray-400">
                            提交者：{shortenAddress(metadata?.submitter || contribution.submitter)} · 提交时间：
                            {contribution.submittedAt
                              ? formatDistanceToNow(new Date(contribution.submittedAt * 1000), { addSuffix: true, locale: zhCN })
                              : '未知'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-100">
                          <p>模型建议：{aiVerdictLabel}</p>
                          {aiReport?.confidence && <p className="mt-1">模型置信度：{aiReport.confidence}</p>}
                          {contribution.finalVerdict !== 0 && (
                            <p className="mt-1 text-gray-300">
                              最终审批：{shortenAddress(contribution.finalApprover)} · 时间：
                              {contribution.finalizedAt
                                ? formatDistanceToNow(new Date(contribution.finalizedAt * 1000), { addSuffix: true, locale: zhCN })
                                : '—'}
                            </p>
                          )}
                          {contribution.proposalId > 0 && (
                            <p className="mt-1 text-gray-300">关联提案 ID：{contribution.proposalId}</p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div className="rounded-2xl border border-gray-700/40 bg-gray-950/40 p-5 text-sm text-gray-200">
                          <h3 className="flex items-center text-sm font-semibold text-white">
                            <DocumentTextIcon className="mr-2 h-4 w-4 text-purple-300" /> 贡献摘要
                          </h3>
                          <p className="mt-3 leading-relaxed whitespace-pre-line">
                            {metadata?.summary || '贡献者尚未提供摘要。'}
                          </p>
                          {metadata?.impact && (
                            <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
                              <p className="text-xs font-semibold text-purple-200">预期影响</p>
                              <p className="mt-2 text-sm text-gray-200 leading-relaxed">{metadata.impact}</p>
                            </div>
                          )}
                          {metadata?.evidenceLinks?.length ? (
                            <div className="mt-4">
                              <p className="text-xs font-semibold text-gray-400">证据链接</p>
                              <ul className="mt-2 space-y-2">
                                {metadata.evidenceLinks.map((link) => (
                                  <li key={link}>
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-purple-300 underline-offset-4 hover:underline"
                                    >
                                      {link}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-gray-700/40 bg-gray-950/40 p-5 text-sm text-gray-200">
                          <h3 className="text-sm font-semibold text-white">AI 评分与洞察</h3>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <ScorePill label="技术质量" value={contribution.score.technical} tone="positive" />
                            <ScorePill label="社区影响" value={contribution.score.community} tone="warning" />
                            <ScorePill label="治理价值" value={contribution.score.governance} tone="positive" />
                            <ScorePill label="综合评分" value={contribution.score.overall} tone="primary" />
                          </div>

                          {aiReport?.summary && (
                            <div className="mt-5 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-xs text-gray-200">
                              <p className="font-semibold text-purple-200">模型总结</p>
                              <p className="mt-2 leading-relaxed">{aiReport.summary}</p>
                            </div>
                          )}

                          <InsightList title="亮点" items={aiReport?.strengths} tone="positive" />
                          <InsightList title="风险" items={aiReport?.risks} tone="negative" />
                          <InsightList title="改进建议" items={aiReport?.recommendations} tone="warning" />
                        </div>
                      </div>

                      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                        <div>
                          <label className="text-xs font-semibold text-gray-300">治理备注 / 决策理由</label>
                          <textarea
                            value={notesMap[contribution.id] ?? ''}
                            onChange={(event) =>
                              setNotesMap((prev) => ({ ...prev, [contribution.id]: event.target.value }))
                            }
                            placeholder="记录人工复核重点、资金发放条件或需要跟进的风险。"
                            rows={4}
                            className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-300">关联治理提案 ID（可选）</label>
                          <input
                            type="number"
                            min="0"
                            value={proposalMap[contribution.id] ?? ''}
                            onChange={(event) =>
                              setProposalMap((prev) => ({ ...prev, [contribution.id]: event.target.value }))
                            }
                            placeholder="如 42，保持为空则记录为 0"
                            className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950/60 px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                          />
                          {contribution.notes && (
                            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-100">
                              <p className="font-semibold">历史备注</p>
                              <p className="mt-2 leading-relaxed">{contribution.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap gap-3">
                          {DECISION_BUTTONS.map((option) => {
                            const Icon = option.icon;
                            return (
                              <motion.button
                                key={option.verdict}
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: canDecide && !isProcessing ? 1.02 : 1 }}
                                type="button"
                                disabled={!canDecide || isProcessing}
                                onClick={() => handleDecision(contribution.id, option.verdict)}
                                className={clsx(
                                  'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition',
                                  toneButtonStyles[option.tone],
                                  (!canDecide || isProcessing) && 'cursor-not-allowed opacity-60'
                                )}
                              >
                                <Icon className="h-4 w-4" />
                                {isProcessing && activeDecisionId === contribution.id
                                  ? '链上处理中…'
                                  : option.label}
                              </motion.button>
                            );
                          })}
                        </div>

                        <div className="text-xs text-gray-400">
                          {!canDecide ? (
                            <p>连接治理执行账户或合约 Owner 方可执行终审。</p>
                          ) : pendingTxHash && activeDecisionId === contribution.id ? (
                            <p>等待交易确认：
                              <span className="ml-1 font-mono text-purple-200">
                                {pendingTxHash.slice(0, 10)}…{pendingTxHash.slice(-6)}
                              </span>
                            </p>
                          ) : (
                            <p>请确保在执行资金发放前记录准确的提案编号与备注。</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}

interface ScorePillProps {
  label: string;
  value: number;
  tone: 'positive' | 'warning' | 'primary';
}

function ScorePill({ label, value, tone }: ScorePillProps) {
  const toneClasses: Record<ScorePillProps['tone'], string> = {
    positive: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
    primary: 'border-purple-500/30 bg-purple-500/10 text-purple-100',
  };

  return (
    <div className={clsx('rounded-xl border p-4 text-center', toneClasses[tone])}>
      <p className="text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value.toFixed(1)}</p>
    </div>
  );
}

interface InsightListProps {
  title: string;
  items?: string[];
  tone: 'positive' | 'warning' | 'negative';
}

function InsightList({ title, items, tone }: InsightListProps) {
  if (!items || !items.length) return null;

  const toneClasses: Record<InsightListProps['tone'], string> = {
    positive: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-100',
    negative: 'border-rose-500/20 bg-rose-500/5 text-rose-100',
  };

  return (
    <div className={clsx('mt-4 rounded-xl border p-4 text-xs leading-relaxed', toneClasses[tone])}>
      <p className="font-semibold uppercase tracking-wide">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item}>· {item}</li>
        ))}
      </ul>
    </div>
  );
}

