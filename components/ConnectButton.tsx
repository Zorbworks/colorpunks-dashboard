'use client';

import { ConnectButton as RKConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Custom-styled wrapper around RainbowKit's ConnectButton that matches the
 * brutalist design system. Shows a primary filled black button with the
 * wallet's truncated address + green status dot when connected, and a
 * "CONNECT WALLET" call-to-action otherwise.
 */
export function ConnectButton() {
  return (
    <RKConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    type="button"
                    className="connect-btn"
                    onClick={openConnectModal}
                  >
                    CONNECT WALLET
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    type="button"
                    className="connect-btn"
                    onClick={openChainModal}
                  >
                    WRONG NETWORK
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  className="connect-btn"
                  onClick={openAccountModal}
                  title="Wallet — click for options"
                >
                  <span className="dot">●</span>
                  <span>{account.displayName}</span>
                </button>
              );
            })()}
          </div>
        );
      }}
    </RKConnectButton.Custom>
  );
}
