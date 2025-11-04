import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Enable, web3FromSource } from '@polkadot/extension-dapp';

export class PolkadotService {
  private api: ApiPromise | null = null;
  private wsProvider: WsProvider | null = null;

  constructor() {
    this.init();
  }

  async init() {
    try {
      // Enable browser extension
      const extensions = await web3Enable('Proof of Love');
      if (extensions.length === 0) {
        console.warn('No Polkadot extension found');
        return;
      }

      // Connect to Polkadot network
      const wsUrl = process.env.NEXT_PUBLIC_POLKADOT_WS_URL || 'wss://rpc.polkadot.io';
      this.wsProvider = new WsProvider(wsUrl);
      this.api = await ApiPromise.create({ provider: this.wsProvider });

      console.log('Connected to Polkadot network');
    } catch (error) {
      console.error('Failed to initialize Polkadot API:', error);
    }
  }

  async getAccount(): Promise<string | null> {
    try {
      const extensions = await web3FromSource('polkadot-js');
      if (!extensions) return null;

      const accounts = await extensions.accounts.get();
      return accounts.length > 0 ? accounts[0].address : null;
    } catch (error) {
      console.error('Failed to get Polkadot account:', error);
      return null;
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.api) return '0';

    try {
      const balance = await this.api.query.system.account(address);
      const { free } = balance.toPrimitive() as any;
      return free.toString();
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  async transferDOT(to: string, amount: string): Promise<boolean> {
    try {
      if (!this.api) return false;

      const extensions = await web3FromSource('polkadot-js');
      if (!extensions) return false;

      const account = await this.getAccount();
      if (!account) return false;

      const transfer = this.api.tx.balances.transfer(to, amount);
      const injector = await extensions.signer;

      await transfer.signAndSend(account, { signer: injector.signer });
      return true;
    } catch (error) {
      console.error('Transfer failed:', error);
      return false;
    }
  }

  async getChainInfo() {
    if (!this.api) return null;

    try {
      const [chain, nodeName, nodeVersion] = await Promise.all([
        this.api.rpc.system.chain(),
        this.api.rpc.system.name(),
        this.api.rpc.system.version()
      ]);

      return {
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString()
      };
    } catch (error) {
      console.error('Failed to get chain info:', error);
      return null;
    }
  }

  async disconnect() {
    if (this.wsProvider) {
      await this.wsProvider.disconnect();
      this.wsProvider = null;
      this.api = null;
    }
  }
}

// Singleton instance
export const polkadotService = new PolkadotService();