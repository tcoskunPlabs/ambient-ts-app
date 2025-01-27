import { bigIntToFloat } from '@crocswap-libs/sdk';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import { Provider } from 'ethers';
import { TokenIF } from '../../types';
import { NetworkIF } from '../../types/NetworkIF';
import ambientTokenList from '../ambient-token-list.json';
import { GCGO_ETHEREUM_URL } from '../gcgo';
import { TopPool } from './TopPool';

const RPC_URLS = {
    PUBLIC: 'https://ethereum-rpc.publicnode.com',
    SECONDARY_PUBLIC: 'https://eth.llamarpc.com',
    RESTRICTED: import.meta.env.VITE_MAINNET_RPC_URL || undefined,
};

const PRIMARY_RPC_URL = RPC_URLS.RESTRICTED || RPC_URLS.PUBLIC;
const FALLBACK_RPC_URL =
    PRIMARY_RPC_URL === RPC_URLS.PUBLIC
        ? RPC_URLS.SECONDARY_PUBLIC
        : RPC_URLS.PUBLIC;

const chainIdHex = '0x1';
const chainSpecFromSDK = lookupChain(chainIdHex);

const chainSpecForWalletConnector = {
    chainId: Number(chainIdHex),
    name: 'Ethereum',
    currency: 'ETH',
    rpcUrl: RPC_URLS.PUBLIC,
    explorerUrl: 'https://etherscan.io/',
};

const findTokenByAddress = (address: string): TokenIF =>
    ambientTokenList.tokens.find(
        (token) =>
            token.address.toLowerCase() === address.toLowerCase() &&
            token.chainId === Number(chainIdHex),
    ) as TokenIF;

const defaultTokenEntries = [
    ['ETH', '0x0000000000000000000000000000000000000000'],
    ['USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'],
    ['USDT', '0xdAC17F958D2ee523a2206206994597C13D831ec7'],
    ['WBTC', '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'],
    ['DAI', '0x6B175474E89094C44Da98b954EedeAC495271d0F'],
    ['SWETH', '0xf951e335afb289353dc249e82926178eac7ded78'],
    ['RSETH', '0xa1290d69c65a6fe4df752f95823fae25cb99e5a7'],
    ['RSWETH', '0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0'],
    ['STONE', '0x7122985656e38bdc0302db86685bb972b145bd3c'],
    ['SWELL', '0x0a6E7Ba5042B38349e437ec6Db6214AEC7B35676'],
    ['TBTC', '0x18084fbA666a33d37592fA2633fD49a74DD93a88'],
] as const;

// Infer the type of the keys and define the resulting type
type MainnetTokens = {
    [Key in (typeof defaultTokenEntries)[number][0]]: TokenIF;
};

// Safely construct the object with type inference
export const MAINNET_TOKENS: MainnetTokens = Object.fromEntries(
    defaultTokenEntries.map(([key, address]) => [
        key,
        findTokenByAddress(address),
    ]),
) as MainnetTokens;

export const ethereumMainnet: NetworkIF = {
    chainId: chainIdHex,
    chainSpec: chainSpecFromSDK,
    GCGO_URL: GCGO_ETHEREUM_URL,
    evmRpcUrl: PRIMARY_RPC_URL,
    fallbackRpcUrl: FALLBACK_RPC_URL,
    chainSpecForWalletConnector,
    defaultPair: [MAINNET_TOKENS.ETH, MAINNET_TOKENS.USDC],
    poolIndex: chainSpecFromSDK.poolIndex,
    gridSize: chainSpecFromSDK.gridSize,
    blockExplorer: chainSpecForWalletConnector.explorerUrl,
    displayName: 'Ethereum',
    tokenPriceQueryAssetPlatform: 'ethereum',
    vaultsEnabled: true,
    tempestApiNetworkName: 'ethereum',
    topPools: [
        new TopPool(
            MAINNET_TOKENS.ETH,
            MAINNET_TOKENS.USDC,
            chainSpecFromSDK.poolIndex,
        ),
        new TopPool(
            MAINNET_TOKENS.ETH,
            MAINNET_TOKENS.USDT,
            chainSpecFromSDK.poolIndex,
        ),
        new TopPool(
            MAINNET_TOKENS.ETH,
            MAINNET_TOKENS.WBTC,
            chainSpecFromSDK.poolIndex,
        ),
        new TopPool(
            MAINNET_TOKENS.USDT,
            MAINNET_TOKENS.USDC,
            chainSpecFromSDK.poolIndex,
        ),
    ],
    getGasPriceInGwei: async (provider?: Provider) => {
        if (!provider) return 0;
        return (
            bigIntToFloat((await provider.getFeeData()).gasPrice || BigInt(0)) *
            1e-9
        );
    },
};
