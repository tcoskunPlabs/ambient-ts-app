import { brandAssetsIF } from './types';
import large from '../images/logos/large.svg';

export const ambientProductionBrandAssets: brandAssetsIF = {
    networks: [
        '0x1', // ethereum mainnet
        '0x82750', // scroll mainnet
        '0x13e31', // blast mainnet
    ],
    color: {
        '0x1': 'purple_dark',
        '0x82750': 'purple_dark',
        '0x5': 'purple_dark',
        '0x8274f': 'purple_dark',
        '0xaa36a7': 'purple_dark',
        '0xa0c71fd': 'purple_dark',
        '0x13e31': 'purple_dark',
    },
    platformName: 'ambient',
    headerImage: large as string,
    showPoints: true,
    showDexStats: true,
    heroImage: 'stars',
};
