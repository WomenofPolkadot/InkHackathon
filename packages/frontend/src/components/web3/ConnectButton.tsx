import { WalletModal } from '@components/modal/WalletModal'
import { env } from '@config/environment'
import { encodeAddress } from '@polkadot/util-crypto'
import {
  SubstrateChain,
  SubstrateWalletPlatform,
  allSubstrateWallets,
  getSubstrateChain,
  isWalletInstalled,
  useBalance,
  useInkathon,
  SubstrateWallet
} from '@scio-labs/use-inkathon'
import { truncateHash } from '@utils/truncateHash'
import { useIsSSR } from '@utils/useIsSSR'
import Link from 'next/link'
import { FC, useState } from 'react'
import { toast } from 'react-hot-toast'
import { AiOutlineCheckCircle, AiOutlineDisconnect } from 'react-icons/ai'
import { FiChevronDown, FiExternalLink } from 'react-icons/fi'
import { AccountName } from './AccountName'  // Assuming AccountName is in the same directory

export interface ConnectButtonProps {}
export const ConnectButton: FC<ConnectButtonProps> = () => {
  const {
    activeChain,
    switchActiveChain,
    connect,
    disconnect,
    isConnecting,
    activeAccount,
    accounts,
    setActiveAccount,
  } = useInkathon()
  const { balanceFormatted } = useBalance(activeAccount?.address, true, {
    forceUnit: false,
    fixedDecimals: 2,
    removeTrailingZeros: true,
  })
  const [supportedChains] = useState(
    env.supportedChains.map((networkId) => getSubstrateChain(networkId) as SubstrateChain),
  )
  const [browserWallets] = useState(
    allSubstrateWallets.filter((w) => w.platforms.includes(SubstrateWalletPlatform.Browser)),
  )
  const isSSR = useIsSSR()
  const [openConnect, setOpenConnect] = useState(false)
  const [openChooseAccount, setOpenChooseAccount] = useState(false)
  const [chosenWallet, setChosenWallet] = useState<SubstrateWallet | null>(null);

return (
  <>
  {!activeAccount && (
    // Connect Button + Modal
    <div className="relative">
      <button
        className="flex items-center justify-between border border-black  bg-gray-200 dark:bg-gray-800 px-6 py-3 font-bold text-black dark:text-white transition duration-300 hover:bg-gray-300"
        onClick={() => setOpenConnect(!openConnect)}
      >
        <span>Connect Wallet</span>
      </button>

      <WalletModal isOpen={openConnect} onClose={() => setOpenConnect(false)}>
        <ul className="border border-gray-200 bg-white dark:bg-gray-700 divide-y divide-gray-200">
          {/* Installed Wallets */}
          {!isSSR &&
            !activeAccount &&
            browserWallets.map((w) =>
              isWalletInstalled(w) ? (
                <li
                  key={w.id}
                  onClick={() => {
                    // If the wallet has only one account, connect directly.
                    console.log("w:", w);
                    connect?.(undefined, w);
                    setChosenWallet(w);
                  }}
                  className="p-3 cursor-pointer hover:bg-gray-100 transition duration-300"
                >
                  {w.name}
                </li>
              ) : (
                <li 
                key={w.id}
                className="p-3">
                  <Link
                    href={w.urls.website}
                    className="flex items-center justify-between opacity-50 hover:opacity-70 hover:no-underline transition duration-300"
                  >
                    <div>
                      <span>{w.name}</span>
                      <p className="text-xs mt-1">Not installed</p>
                    </div>
                    <FiExternalLink size={16} />
                  </Link>
                </li>
              ),
            )}
        </ul>
      </WalletModal>
    </div>
  )}
  {!!activeAccount && (
    // Account Menu & Disconnect Button
    <div className=" space-y-4">
      <div className="flex items-center ">
        {/* Account Balance */}
        {balanceFormatted !== undefined && (
        <div className="px-4 py-2 font-bold text-gray-700 dark:text-gray-200">
          {balanceFormatted}
        </div>
        )}
        {/* Account Name, Address, and AZNS-Domain (if assigned) */}
        <button
          className="flex flex-col items-start p-4 border border-black  bg-white dark:bg-gray-900 shadow hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => setOpenChooseAccount(true)} 
          >
          <div className="space-y-1">
            <AccountName account={activeAccount} />
            <p className="text-xs opacity-75">
              {truncateHash(encodeAddress(activeAccount.address, activeChain?.ss58Prefix || 42), 8)}
            </p>
          </div>
        </button>
      </div>

        {/* Available Accounts/Wallets */}
        <WalletModal isOpen={openChooseAccount} onClose={() => setOpenChooseAccount(false)}>
          <>
          {chosenWallet && (accounts || []).map((acc) => {
            const encodedAddress = encodeAddress(acc.address, activeChain?.ss58Prefix || 42);
            const truncatedEncodedAddress = truncateHash(encodedAddress, 10);
            return (
              <div
              key={encodedAddress}
                // When an account is clicked, set it as active and then connect to the chosen wallet.
                onClick={() => {
                  setActiveAccount?.(acc);
                  connect?.(undefined, chosenWallet);
                  if (acc.address !== activeAccount.address) {
                    setActiveAccount?.(acc);
                  }
                }}
                className={`p-2 flex justify-between items-center cursor-pointer ${acc.address === activeAccount.address ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                >
                <div>
                  <AccountName account={acc} />
                  <p className="text-xs">{truncatedEncodedAddress}</p>
                </div>
                {acc.address === activeAccount.address && <AiOutlineCheckCircle size={16} className="text-green-500" />}
              </div>
            )
          })}

            <div className="flex flex-col space-y-2 py-2 border-t-2 border-gray-200 bg-white dark:bg-gray-700">
            {/* Supported Chains */}
            {supportedChains.map((chain) => (
              <div
                key={chain.network}
                onClick={async () => {
                  if (chain.network !== activeChain?.network) {
                    await switchActiveChain?.(chain);
                    toast.success(`Switched to ${chain.name}`);
                  }
                }}
                className={`p-2 flex justify-between items-center cursor-pointer ${chain.network === activeChain?.network ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
              >
                <p>{chain.name}</p>
                {chain.network === activeChain?.network && <AiOutlineCheckCircle size={16} className="text-green-500" />}
              </div>
            ))}
            </div>
          
            <div className="p-2 flex justify-between items-center cursor-pointer hover:bg-red-100" onClick={() => disconnect?.()}>
              <span className="text-red-500">Disconnect</span>
              <AiOutlineDisconnect size={18} className="text-red-500" />
            </div>

          </>
        </WalletModal>


    </div>
  )}
  </>
)}
