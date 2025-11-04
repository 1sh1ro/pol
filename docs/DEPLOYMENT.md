# Proof of Love 平台部署指南

## 概述

Proof of Love 是一个基于 Polkadot 生态的去中心化影响力平台，采用 REVM 兼容的智能合约架构。本指南将帮助您在 Polkadot Asset Hub 或其他兼容网络上部署完整的平台。

## 前置条件

### 环境要求
- Node.js 18.0+
- Foundry (最新版本)
- Git
- Docker (可选，用于本地开发)

### 工具安装

```bash
# 安装 Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 安装 Node.js 依赖
npm install -g yarn
```

### 账户准备
1. 准备部署账户的私钥
2. 确保账户有足够的 DOT 或 ETH 支付 gas 费用
3. 在 Polkadot.js 中设置好账户

## 网络配置

### Polkadot Asset Hub (REVM)
```bash
# 环境变量
export ASSET_HUB_RPC="wss://rpc-assethub-polkadot.lodestar.io"
export PRIVATE_KEY="0x..."
export CHAIN_ID=1000
```

### 测试网络
```bash
# 本地开发
export LOCAL_RPC="http://127.0.0.1:8545"

# Sepolia 测试网 (以太坊兼容)
export SEPOLIA_RPC="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
```

## 智能合约部署

### 1. 克隆项目
```bash
git clone https://github.com/your-org/proof-of-love-platform.git
cd proof-of-love-platform/contracts
```

### 2. 安装依赖
```bash
forge install
npm install
```

### 3. 编译合约
```bash
forge build
```

### 4. 运行测试
```bash
forge test
forge coverage
```

### 5. 部署到 Polkadot Asset Hub
```bash
# 设置环境变量
export ASSET_HUB_RPC="wss://rpc-assethub-polkadot.lodestar.io"
export PRIVATE_KEY="0x..."

# 部署合约
forge script script/Deploy.s.sol --rpc-url $ASSET_HUB_RPC --broadcast --verify

# 部署信息将保存到 deployment.json
```

### 6. 部署到本地网络
```bash
# 启动本地节点
anvil --fork-url $ASSET_HUB_RPC --port 8545

# 部署合约
forge script script/Deploy.s.sol --rpc-url localhost --broadcast
```

## 前端部署

### 1. 安装依赖
```bash
cd frontend
yarn install
```

### 2. 环境配置
创建 `.env.local` 文件：
```env
# 合约地址
NEXT_PUBLIC_POL_TOKEN_ADDRESS="0x..."
NEXT_PUBLIC_NFT_BADGE_ADDRESS="0x..."
NEXT_PUBLIC_GOVERNANCE_ADDRESS="0x..."
NEXT_PUBLIC_CROSS_CHAIN_BRIDGE_ADDRESS="0x..."

# 网络配置
NEXT_PUBLIC_NETWORK_ID="1000"
NEXT_PUBLIC_POLKADOT_WS_URL="wss://rpc.polkadot.io"

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# IPFS (可选)
NEXT_PUBLIC_IPFS_GATEWAY="https://gateway.pinata.cloud"
```

### 3. 构建和部署
```bash
# 构建生产版本
yarn build

# 部署到 Vercel (推荐)
vercel --prod

# 或部署到其他平台
yarn start  # 本地预览
```

## IPFS 配置

### 1. Pinata 设置
```bash
# 安装 Pinata SDK
npm install @pinata/sdk

# 创建 Pinata 账户并获取 API 密钥
```

### 2. 上传元数据
```bash
# 上传 NFT 元数据
node scripts/upload-metadata.js
```

## 监控和维护

### 1. 合约监控
```bash
# 监控合约事件
forge script script/Monitor.s.sol --rpc-url $ASSET_HUB_RPC

# 检查合约状态
cast call 0x... "balanceOf(address)" 0x...
```

### 2. 前端监控
- 使用 Vercel Analytics 监控网站性能
- 集成 Sentry 进行错误追踪
- 设置 Uptime 监控

### 3. 安全检查
- 定期运行安全审计
- 监控异常交易
- 检查合约余额

## 常见问题

### Q: 部署失败怎么办？
A: 检查以下几点：
1. 网络连接是否正常
2. 账户余额是否充足
3. 私钥格式是否正确
4. RPC 端点是否可用

### Q: 如何更新合约？
A: 使用代理模式升级：
```bash
forge script script/Upgrade.s.sol --rpc-url $ASSET_HUB_RPC --broadcast
```

### Q: 如何添加新的跨链支持？
A: 修改 `CrossChainBridge.sol` 并调用 `addSupportedChain` 函数。

## 安全最佳实践

1. **私钥管理**
   - 使用硬件钱包存储私钥
   - 定期轮换部署密钥
   - 使用多重签名钱包

2. **合约安全**
   - 进行代码审计
   - 启用紧急暂停功能
   - 设置时间锁

3. **前端安全**
   - 验证所有用户输入
   - 使用 HTTPS
   - 实施 CSP 策略

## 性能优化

1. **Gas 优化**
   - 批量操作减少交易次数
   - 使用 Layer 2 解决方案
   - 优化合约存储

2. **前端优化**
   - 使用 CDN 加速
   - 实现代码分割
   - 优化图片资源

## 联系支持

如需帮助，请联系：
- GitHub Issues: https://github.com/your-org/proof-of-love-platform/issues
- Discord: https://discord.gg/your-invite
- Email: support@proofoflove.io

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](../LICENSE) 文件。