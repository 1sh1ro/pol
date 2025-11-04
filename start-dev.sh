#!/bin/bash

echo "🚀 启动 Proof of Love 平台开发环境"
echo "=================================="

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 设置项目根目录
PROJECT_ROOT="/root/proof-of-love-platform"
cd $PROJECT_ROOT

echo "📁 当前目录: $(pwd)"

# 检查 Foundry 安装
if ! command -v forge &> /dev/null; then
    echo "📦 Foundry 正在安装中，请稍候..."

    # 等待 Foundry 安装完成
    for i in {1..30}; do
        if command -v forge &> /dev/null; then
            echo "✅ Foundry 安装完成"
            break
        fi
        echo "⏳ 等待 Foundry 安装... ($i/30)"
        sleep 2
    done

    # 如果还没有安装，手动配置
    if ! command -v forge &> /dev/null; then
        echo "📦 正在配置 Foundry..."
        export PATH="$HOME/.foundry/bin:$PATH"
        if [ -f "$HOME/.foundry/bin/foundryup" ]; then
            $HOME/.foundry/bin/foundryup
        fi
    fi
fi

# 安装合约依赖
echo "📦 安装智能合约依赖..."
cd contracts
if [ ! -d "lib" ]; then
    if command -v forge &> /dev/null; then
        forge install OpenZeppelin/openzeppelin-contracts --no-commit
        forge install foundry-rs/forge-std --no-commit
    else
        echo "⚠️  Foundry 不可用，跳过合约依赖安装"
    fi
fi

# 编译合约
echo "🔨 编译智能合约..."
if command -v forge &> /dev/null; then
    forge build
    if [ $? -eq 0 ]; then
        echo "✅ 合约编译成功"
    else
        echo "❌ 合约编译失败"
    fi
else
    echo "⚠️  Foundry 不可用，跳过合约编译"
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend

# 使用 yarn 如果可用，否则使用 npm
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

echo ""
echo "🎯 启动选项："
echo "1. 启动智能合约开发网络 (如果 Foundry 可用)"
echo "2. 启动前端开发服务器"
echo "3. 查看项目状态"
echo ""

read -p "请选择 (1/2/3): " choice

case $choice in
    1)
        echo "🔗 启动本地区块链网络..."
        if command -v anvil &> /dev/null; then
            cd ../contracts
            anvil --host 0.0.0.0 --port 8545 --chain-id 1337 --accounts 10 --balance 1000
        else
            echo "❌ Anvil 不可用，请先安装 Foundry"
        fi
        ;;
    2)
        echo "🌐 启动前端开发服务器..."
        npm run dev
        ;;
    3)
        echo "📊 项目状态检查..."
        echo "📁 项目目录结构:"
        find $PROJECT_ROOT -type f -name "*.sol" | head -10
        echo ""
        echo "📁 前端文件:"
        find $PROJECT_ROOT/frontend -type f -name "*.tsx" | head -5
        echo ""
        echo "📋 检查 Node.js 版本:"
        node --version
        echo "📋 检查 npm 版本:"
        npm --version
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac