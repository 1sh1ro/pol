# Proof of Love Platform Makefile

.PHONY: help build test deploy dev clean install format

# Default target
help:
	@echo "Proof of Love Platform - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  install     - Install all dependencies"
	@echo "  build       - Build smart contracts and frontend"
	@echo "  test        - Run all tests"
	@echo "  dev         - Start development environment"
	@echo "  clean       - Clean build artifacts"
	@echo "  format      - Format code"
	@echo ""
	@echo "Deployment:"
	@echo "  deploy-local    - Deploy to local network"
	@echo "  deploy-testnet  - Deploy to testnet"
	@echo "  deploy-mainnet  - Deploy to mainnet"
	@echo "  verify          - Verify contracts on Etherscan"
	@echo ""
	@echo "Contracts:"
	@echo "  compile     - Compile smart contracts"
	@echo "  coverage    - Run test coverage"
	@echo "  size        - Check contract sizes"
	@echo ""
	@echo "Frontend:"
	@echo "  frontend-build - Build frontend application"
	@echo "  frontend-dev   - Start frontend development server"

# Variables
NETWORK ?= localhost
PRIVATE_KEY ?= $(shell grep PRIVATE_KEY .env 2>/dev/null | cut -d '=' -f2)
CONTRACTS_DIR = contracts
FRONTEND_DIR = frontend

# Development commands
install:
	@echo "📦 Installing dependencies..."
	cd $(CONTRACTS_DIR) && forge install
	cd $(CONTRACTS_DIR) && npm install
	cd $(FRONTEND_DIR) && yarn install
	@echo "✅ Dependencies installed"

build: compile frontend-build
	@echo "🏗️ Build completed"

compile:
	@echo "🔨 Compiling smart contracts..."
	cd $(CONTRACTS_DIR) && forge build
	@echo "✅ Contracts compiled"

test:
	@echo "🧪 Running tests..."
	cd $(CONTRACTS_DIR) && forge test -vv
	cd $(CONTRACTS_DIR) && forge coverage
	@echo "✅ Tests completed"

coverage:
	@echo "📊 Running coverage analysis..."
	cd $(CONTRACTS_DIR) && forge coverage --report lcov
	@echo "📈 Coverage report generated"

format:
	@echo "🎨 Formatting code..."
	cd $(CONTRACTS_DIR) && forge fmt
	cd $(FRONTEND_DIR) && yarn prettier --write .
	@echo "✨ Code formatted"

clean:
	@echo "🧹 Cleaning artifacts..."
	cd $(CONTRACTS_DIR) && forge clean
	cd $(FRONTEND_DIR) && rm -rf .next node_modules/.cache
	@echo "✅ Clean completed"

# Frontend commands
frontend-build:
	@echo "🏗️ Building frontend..."
	cd $(FRONTEND_DIR) && yarn build
	@echo "✅ Frontend built"

frontend-dev:
	@echo "🚀 Starting frontend development server..."
	cd $(FRONTEND_DIR) && yarn dev

# Development environment
dev:
	@echo "🚀 Starting development environment..."
	@if ! pgrep -f "anvil" > /dev/null; then \
		echo "📡 Starting local Anvil node..."; \
		cd $(CONTRACTS_DIR) && anvil --fork-url https://rpc-assethub-polkadot.lodestar.io & \
		sleep 3; \
	fi
	@echo "🔨 Building contracts..."
	cd $(CONTRACTS_DIR) && forge build
	@echo "📜 Deploying to local network..."
	cd $(CONTRACTS_DIR) && forge script script/Deploy.s.sol --rpc-url localhost --broadcast --slow
	@echo "🌐 Starting frontend..."
	cd $(FRONTEND_DIR) && yarn dev

# Deployment commands
deploy-local:
	@echo "🏠 Deploying to local network..."
	@if ! pgrep -f "anvil" > /dev/null; then \
		echo "📡 Starting Anvil..."; \
		cd $(CONTRACTS_DIR) && anvil --fork-url https://rpc-assethub-polkadot.lodestar.io & \
		sleep 3; \
	fi
	cd $(CONTRACTS_DIR) && forge script script/Deploy.s.sol --rpc-url localhost --broadcast --verify
	@echo "✅ Deployed to local network"

deploy-testnet:
	@echo "🧪 Deploying to testnet..."
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "❌ PRIVATE_KEY not set in .env file"; \
		exit 1; \
	fi
	cd $(CONTRACTS_DIR) && forge script script/Deploy.s.sol --rpc-url $(SEPOLIA_RPC) --broadcast --verify
	@echo "✅ Deployed to testnet"

deploy-mainnet:
	@echo "🌟 Deploying to mainnet..."
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "❌ PRIVATE_KEY not set in .env file"; \
		exit 1; \
	fi
	@read -p "Are you sure you want to deploy to mainnet? (y/N) " confirm && [ "$$confirm" = "y" ] || exit 1
	cd $(CONTRACTS_DIR) && forge script script/Deploy.s.sol --rpc-url $(MAINNET_RPC) --broadcast --verify
	@echo "✅ Deployed to mainnet"

verify:
	@echo "🔍 Verifying contracts..."
	cd $(CONTRACTS_DIR) && forge verify-contract $(CONTRACT_ADDRESS) --chain-id $(CHAIN_ID)
	@echo "✅ Contracts verified"

# Contract analysis
size:
	@echo "📏 Analyzing contract sizes..."
	cd $(CONTRACTS_DIR) && forge build --sizes
	@echo "📊 Size analysis completed"

gas:
	@echo "⛽ Running gas usage analysis..."
	cd $(CONTRACTS_DIR) && forge test --gas-report
	@echo "⛽ Gas report generated"

snapshot:
	@echo "📸 Creating gas snapshot..."
	cd $(CONTRACTS_DIR) && forge snapshot
	@echo "📸 Snapshot created"

# Monitoring
monitor:
	@echo "👀 Starting contract monitoring..."
	cd $(CONTRACTS_DIR) && forge script script/Monitor.s.sol --rpc-url $(NETWORK)

logs:
	@echo "📋 Fetching contract events..."
	cd $(CONTRACTS_DIR) && cast logs --from-block $(START_BLOCK) --address $(CONTRACT_ADDRESS)

# Security
audit:
	@echo "🔒 Running security audit..."
	cd $(CONTRACTS_DIR) && forge test --match-contract "*Security*" -vv
	@echo "✅ Security audit completed"

slither:
	@echo "🔍 Running Slither analysis..."
	cd $(CONTRACTS_DIR) && slither . --filter-paths "node_modules/*|test/*" --json slither-report.json
	@echo "📊 Slither report generated"

# Documentation
docs:
	@echo "📚 Generating documentation..."
	cd $(CONTRACTS_DIR) && forge doc --build
	@echo "📖 Documentation generated"

# Environment setup
setup:
	@echo "⚙️ Setting up development environment..."
	@echo "Creating .env file..."
	@cp .env.example .env 2>/dev/null || echo "PRIVATE_KEY=0x..." > .env
	@echo "NETWORK_ID=1000" >> .env
	@echo "ASSET_HUB_RPC=wss://rpc-assethub-polkadot.lodestar.io" >> .env
	@echo "SEPOLIA_RPC=https://sepolia.infura.io/v3/YOUR_PROJECT_ID" >> .env
	@echo "MAINNET_RPC=https://mainnet.infura.io/v3/YOUR_PROJECT_ID" >> .env
	@echo "✅ Environment setup completed"
	@echo "⚠️  Please edit .env file with your actual configuration"

# CI/CD helpers
ci-test:
	@echo "🔄 Running CI tests..."
	cd $(CONTRACTS_DIR) && forge test --gas-report --no-match-test testFork
	cd $(FRONTEND_DIR) && yarn lint
	cd $(FRONTEND_DIR) && yarn type-check
	@echo "✅ CI tests passed"

ci-build:
	@echo "🏗️ CI build..."
	cd $(CONTRACTS_DIR) && forge build
	cd $(FRONTEND_DIR) && yarn build
	@echo "✅ CI build completed"

# Database and infrastructure (optional)
db-up:
	@echo "🗄️ Starting database..."
	docker-compose up -d postgres redis

db-down:
	@echo "🗄️ Stopping database..."
	docker-compose down

# Utility commands
list-contracts:
	@echo "📜 Contract addresses:"
	@if [ -f deployment.json ]; then \
		cat deployment.json | jq '.'; \
	else \
		echo "❌ deployment.json not found. Please run deploy first."; \
	fi

balance:
	@echo "💰 Checking contract balances..."
	@if [ -f deployment.json ]; then \
		for contract in polToken nftBadge governance; do \
			address=$$(cat deployment.json | jq -r ".contracts.$$contract"); \
			if [ "$$address" != "null" ] && [ "$$address" != "" ]; then \
				balance=$$(cast balance $$address); \
				echo "$$contract: $$balance wei"; \
			fi; \
		done; \
	else \
		echo "❌ deployment.json not found."; \
	fi

# Release management
release-patch:
	@echo "🏷️ Creating patch release..."
	@npm version patch
	@git add .
	@git commit -m "chore(release): patch release"
	@git tag -a v$$($(MAKE) -s get-version) -m "Release v$$($(MAKE) -s get-version)"
	@git push origin main --tags

release-minor:
	@echo "🏷️ Creating minor release..."
	@npm version minor
	@git add .
	@git commit -m "chore(release): minor release"
	@git tag -a v$$($(MAKE) -s get-version) -m "Release v$$($(MAKE) -s get-version)"
	@git push origin main --tags

get-version:
	@node -p "require('./package.json').version"