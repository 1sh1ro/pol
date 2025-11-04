# Proof of Love (PoL) Platform - 波卡生态开发者影响力平台

## 项目简介

Proof of Love 是一个基于 Polkadot 生态的去中心化社交影响力平台，旨在通过量化开发者的爱心贡献和社区参与，搭建全球 Polkadot 生态与中文开发者之间的桥梁。

## 核心特性

### 🎯 贡献证明系统 (Proof of Love)
- 教育内容创作奖励
- 代码贡献影响力量化
- 社区治理参与证明
- 跨链协作记录

### 🌐 跨链教育平台
- 多链技术内容分享
- 中文开发者本地化支持
- 实时翻译和协作工具
- 知识产权保护

### 🏛️ 去中心化治理
- PoL 代币治理机制
- 社区提案和投票
- 发展资金分配
- 里程碑奖励系统

### 🎨 开发者NFT徽章
- 可验证的成就系统
- 稀有度分级机制
- 跨链展示功能
- 社交身份标识

## 技术架构

### 智能合约层 (REVM兼容)
- **Solidity**: 主要智能合约语言
- **Foundry**: 开发和测试框架
- **REVM**: Polkadot 高性能执行环境
- **OpenZeppelin**: 安全合约库

### 前端层
- **React + TypeScript**: 现代化UI框架
- **Substrate Connect**: 直接连接波卡网络
- **Polkadot.js**: 波卡生态核心库
- **Wagmi + Viem**: 以太坊兼容工具

### 跨链集成
- **XCM**: Polkadot 跨链消息传递
- **XCMP**: 跨链通信协议
- **Asset Hub**: 跨链资产管理

## 开发环境

```bash
# 安装依赖
npm install
# 启动本地开发网络
npm run dev:node
# 部署智能合约
npm run deploy
# 启动前端开发服务器
npm run dev:frontend
```

## 项目结构

```
proof-of-love-platform/
├── contracts/              # 智能合约
│   ├── src/
│   │   ├── PoLToken.sol    # 治理代币
│   │   ├── Contribution.sol # 贡献记录
│   │   ├── NFTBadge.sol    # 成就徽章
│   │   └── Governance.sol  # 治理模块
│   ├── test/
│   └── foundry.toml
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── hooks/          # 自定义Hook
│   │   ├── services/       # API服务
│   │   └── utils/          # 工具函数
│   └── package.json
├── substrate/              # Polkadot运行时 (可选)
│   └── runtime/
└── docs/                   # 项目文档
```

## 创新亮点

1. **REVM 深度集成**: 充分利用 Polkadot 即将产品化的 REVM 环境
2. **中文开发者友好**: 针对中文社区的特殊优化和支持
3. **跨链教育**: 打破语言和技术壁垒的全球化学习平台
4. **爱心经济学**: 将社区贡献转化为可量化的影响力价值

## 评审标准对应

✅ **技术实现**: 模块化架构、REVM兼容、跨链集成
✅ **创新性**: 爱心经济学、社区影响力量化、跨链教育
✅ **Polkadot生态结合**: REVM、XCM、Substrate Connect
✅ **开发者体验**: Foundry工具链、TypeScript、详细文档
✅ **项目潜力**: 可持续治理模型、生态价值创造

## 贡献指南

欢迎开发者通过 GitHub Issues 和 Pull Requests 参与贡献！

### AI 贡献评审助手

- 前端 `Contribute` 模块集成了 DeepSeek 预审能力，可在社区评审前生成初步分析与打分。
- 在 `frontend/.env.local` 中配置 `DEEPSEEK_API_KEY=your_api_key`，服务端 API 路由会自动调用 DeepSeek。
- 模型输出结构化建议包含技术质量、社区影响、治理价值、风险与改进建议，实际发放奖励仍需通过治理或人工复核。

### 链上贡献登记与终审流程

1. 在 `contracts/src` 中新增 `ContributionRegistry` 合约，用于记录 AI 评分、贡献信息与治理终审结果；部署后执行：
   - `setGovernanceExecutor(PoLGovernanceAddress)` 将治理合约设为执行者；
   - 在 `PoLGovernance` 合约中调用 `setContributionRegistry` 关联登记册。
2. 前端通过 `ContributionRegistry.submitContribution` 把 DeepSeek 生成的 JSON、证据摘要等信息写入链上，所有评分以 `uint16`（放大 10 倍）存储。
3. 治理成员可在 `frontend/src/app/governance` 面板查看贡献详情，记录复核备注，并调用 `resolveContribution` 完成最终裁决与提案绑定。
4. 配置以下环境变量以启用前端交互：
   - `NEXT_PUBLIC_CONTRIBUTION_REGISTRY_ADDRESS`
   - `NEXT_PUBLIC_GOVERNANCE_ADDRESS`
   - `NEXT_PUBLIC_POL_TOKEN_ADDRESS`（如需显示 token 信息）

## 许可证

MIT License