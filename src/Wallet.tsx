import { useEffect, useState } from 'react';
import { useConnection, useConnect, useConnectors, useDisconnect, useSwitchChain } from 'wagmi';
import { getAddress } from 'viem';
import { sepolia } from 'viem/chains';
import { Icon } from './Art';
import { Modal } from './Modal';
import { isMobileBrowser, OPEN_IN } from './open-in';

export const shortAddress = (a: string) => `${getAddress(a).slice(0, 6)}…${getAddress(a).slice(-4)}`;

export function WalletButton({ onOpen }: { onOpen: () => void }) {
  const { address, chainId, isConnected } = useConnection();
  const { mutate: switchChain, isPending, error } = useSwitchChain();
  return <div className="wallet-control"><button className="button button-wallet" onClick={() => isConnected && chainId !== sepolia.id ? switchChain({ chainId: sepolia.id }) : onOpen()} disabled={isPending} aria-describedby={error ? 'switch-error' : undefined}><Icon name="wallet" size={18} /><span>{isPending ? 'Switching…' : isConnected && chainId !== sepolia.id ? 'Switch to Sepolia' : address ? shortAddress(address) : 'Connect'}</span></button>{error && <span id="switch-error" role="status" className="wallet-error">Switch declined. Try again.</span>}</div>;
}

export function WalletSheet({ onClose }: { onClose: () => void }) {
  const { address, isConnected } = useConnection();
  const connectors = useConnectors();
  const { mutate: connect, isPending, variables, error } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [wasConnected] = useState(isConnected);
  const mobile = isMobileBrowser();
  useEffect(() => { if (isConnected && !wasConnected) onClose(); }, [isConnected, wasConnected, onClose]);
  const named = connectors.some(c => c.type === 'injected' && c.id !== 'injected');
  const listed = [...connectors.filter(c => c.type === 'injected'), ...connectors.filter(c => c.type !== 'injected')].filter(c => !(c.id === 'injected' && named) && !(mobile && c.type === 'injected'));
  return <Modal title={isConnected ? 'Your garden wallet' : 'Connect a wallet'} onClose={onClose}>
    {isConnected && address ? <>
      <p className="muted">Your live garden is saved in this browser for this address.</p>
      <p className="full-address">{getAddress(address)}</p>
      <div className="modal-actions"><button className="button secondary" onClick={async () => { try { await navigator.clipboard.writeText(getAddress(address)); setCopied(true); } catch { setCopied(false); } }}>{copied ? 'Copied' : 'Copy address'}</button><button className="button secondary" onClick={() => { disconnect(); onClose(); }}>Disconnect</button></div>
    </> : <>
      <p className="muted">A free signature plants your seed. No gas or token approval.</p>
      <div className="wallet-list">
        {mobile && OPEN_IN.map(w => <a key={w.id} className="wallet-row" href={w.href(location.href)}><img src={`${import.meta.env.BASE_URL}wallets/${w.id}.svg`} width="28" height="28" alt="" /><span>Open in {w.name}</span><Icon name="chevron" size={16} /></a>)}
        {listed.map(c => <button className="wallet-row" key={c.uid} disabled={isPending} onClick={() => connect({ connector: c, chainId: sepolia.id })}>
          {c.icon ? <img src={c.icon} width="28" height="28" alt="" /> : c.id === 'coinbaseWalletSDK' ? <img src={`${import.meta.env.BASE_URL}wallets/coinbase.svg`} width="28" height="28" alt="" /> : <span className="browser-wallet-icon"><Icon name="wallet" size={24} /></span>}
          <span>{c.id === 'injected' ? 'Browser wallet' : c.id === 'coinbaseWalletSDK' && mobile ? 'Coinbase Smart Wallet' : c.name}{isPending && variables?.connector === c ? ' · opening…' : ''}</span><Icon name="chevron" size={16} />
        </button>)}
      </div>
      <div className="inline-feedback" role="status">{error ? 'Wallet connection was not completed. Open your wallet and try again.' : isPending ? 'Approve the connection in your wallet.' : !named && !mobile ? 'No extension? Choose Coinbase Wallet to create a passkey wallet.' : ''}</div>
      <p className="fine-print">You can also explore the practice garden without a wallet.</p>
    </>}
  </Modal>;
}
