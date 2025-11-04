import { NextRequest, NextResponse } from 'next/server';

interface JudgeRequestBody {
  title?: string;
  summary: string;
  impact?: string;
  contributionType?: string;
  evidenceLinks?: string[];
  contributor?: string;
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as JudgeRequestBody;

    if (!body || typeof body.summary !== 'string' || body.summary.trim().length === 0) {
      return NextResponse.json(
        { error: '缺少必要字段：summary' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: '服务器未配置 DeepSeek API 密钥' },
        { status: 500 }
      );
    }

    const promptPayload = buildPrompt(body);

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promptPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error:', errorText);
      return NextResponse.json(
        { error: 'DeepSeek API 调用失败', details: errorText },
        { status: 502 }
      );
    }

    const data = (await response.json()) as DeepSeekResponse;
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'DeepSeek 未返回有效内容' },
        { status: 502 }
      );
    }

    const parsed = safeParseStructuredContent(content);

    return NextResponse.json(
      {
        ok: true,
        content,
        structured: parsed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Judge API error:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

function buildPrompt(body: JudgeRequestBody) {
  const evidence = body.evidenceLinks?.length
    ? body.evidenceLinks.map((link) => `- ${link}`).join('\n')
    : '无';

  const impact = body.impact?.trim() || '未提供';
  const title = body.title?.trim() || '未命名贡献';
  const contributionType = body.contributionType?.trim() || '未指定';
  const contributor = body.contributor?.trim() || '匿名贡献者';

  const systemPrompt = `你是 Proof of Love (PoL) 平台的贡献评审助手。请按照平台贡献规范，从技术质量、社区影响、对 Polkadot 生态的契合度、安全性风险等维度做出评估。使用简洁中文回答。`;

  const userPrompt = `请评估以下贡献信息，并返回 JSON：
{
  "title": "${title}",
  "contributor": "${contributor}",
  "contributionType": "${contributionType}",
  "summary": ${JSON.stringify(body.summary)},
  "impact": ${JSON.stringify(impact)},
  "evidence": ${JSON.stringify(evidence)}
}

返回 JSON 格式如下：
{
  "verdict": "accept | needs_review | reject",
  "score": {
    "technical": number,
    "community": number,
    "governance": number,
    "overall": number
  },
  "confidence": "low | medium | high",
  "summary": string,
  "strengths": string[],
  "risks": string[],
  "recommendations": string[]
}

请严格返回有效 JSON。`;

  return {
    model: 'deepseek-chat',
    temperature: 0.2,
    max_tokens: 700,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
}

type StructuredResponse = {
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
} | null;

function safeParseStructuredContent(content: string): StructuredResponse {
  try {
    const match = content.match(/\{[\s\S]*\}$/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return JSON.parse(content);
  } catch {
    return null;
  }
}

