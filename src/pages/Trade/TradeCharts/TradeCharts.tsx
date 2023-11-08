// START: Import React and Dongles
import {
    Dispatch,
    useState,
    useEffect,
    useContext,
    memo,
    useMemo,
} from 'react';

// START: Import Local Files
import TradeCandleStickChart from './TradeCandleStickChart';
import TimeFrame from './TradeChartsComponents/TimeFrame';
import VolumeTVLFee from './TradeChartsComponents/VolumeTVLFee';
import CurveDepth from './TradeChartsComponents/CurveDepth';
import CurrentDataInfo from './TradeChartsComponents/CurrentDataInfo';
import { useLocation } from 'react-router-dom';
import TutorialOverlay from '../../../components/Global/TutorialOverlay/TutorialOverlay';
import { tradeChartTutorialSteps } from '../../../utils/tutorial/TradeChart';
import { AppStateContext } from '../../../contexts/AppStateContext';
import { ChartContext } from '../../../contexts/ChartContext';
import { LS_KEY_SUBCHART_SETTINGS } from '../../../constants';
import { getLocalStorageItem } from '../../../utils/functions/getLocalStorageItem';
import { CandleData } from '../../../App/functions/fetchCandleSeries';
import { TradeChartsHeader } from './TradeChartsHeader/TradeChartsHeader';
import { updatesIF } from '../../../utils/hooks/useUrlParams';
import { FlexContainer } from '../../../styled/Common';
import { MainContainer } from '../../../styled/Components/Chart';
import { TutorialButton } from '../../../styled/Components/Tutorial';
import { drawDataHistory } from '../../Chart/ChartUtils/chartUtils';

// interface for React functional component props
interface propsIF {
    changeState: (
        isOpen: boolean | undefined,
        candleData: CandleData | undefined,
    ) => void;
    selectedDate: number | undefined;
    setSelectedDate: Dispatch<number | undefined>;
    setIsChartLoading: Dispatch<React.SetStateAction<boolean>>;
    isChartLoading: boolean;
    updateURL: (changes: updatesIF) => void;
}
export interface LiquidityDataLocal {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeLiq: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    liqPrices: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deltaAverageUSD: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cumAverageUSD: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upperBound: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lowerBound: any;
}

export interface LiqSnap {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeLiq: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pinnedMaxPriceDisplayTruncated: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pinnedMinPriceDisplayTruncated: any;
}

// React functional component
function TradeCharts(props: propsIF) {
    const { selectedDate, setSelectedDate, updateURL } = props;

    const {
        tutorial: { isActive: isTutorialActive },
    } = useContext(AppStateContext);
    const {
        chartSettings,
        isFullScreen: isChartFullScreen,
        setIsFullScreen: setIsChartFullScreen,
        chartCanvasRef,
    } = useContext(ChartContext);

    const { pathname } = useLocation();

    const isMarketOrLimitModule =
        pathname.includes('market') || pathname.includes('limit');

    // allow a local environment variable to be defined in [app_repo]/.env.local to turn off connections to the cache server

    // ---------------------TRADE DATA CALCULATIONS------------------------

    const [rescale, setRescale] = useState(true);
    const [latest, setLatest] = useState(false);
    const [showLatest, setShowLatest] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [reset, setReset] = useState(false);
    const [isReadOnlyChart, setIsReadOnlyChart] = useState(true);

    // ---------------------END OF TRADE DATA CALCULATIONS------------------------

    // CHART SETTINGS------------------------------------------------------------
    const subchartState: {
        isVolumeSubchartEnabled: boolean;
        isTvlSubchartEnabled: boolean;
        isFeeRateSubchartEnabled: boolean;
    } | null = JSON.parse(
        getLocalStorageItem(LS_KEY_SUBCHART_SETTINGS) ?? '{}',
    );

    const [showTvl, setShowTvl] = useState(
        subchartState?.isTvlSubchartEnabled ?? false,
    );
    const [showFeeRate, setShowFeeRate] = useState(
        subchartState?.isFeeRateSubchartEnabled ?? false,
    );
    const [showVolume, setShowVolume] = useState(
        subchartState?.isVolumeSubchartEnabled ?? true,
    );

    const chartItemStates = useMemo(() => {
        return {
            showFeeRate,
            showTvl,
            showVolume,
            liqMode: chartSettings.poolOverlay.overlay,
        };
    }, [
        isMarketOrLimitModule,
        chartSettings.poolOverlay,
        showTvl,
        showVolume,
        showFeeRate,
    ]);

    // END OF CHART SETTINGS------------------------------------------------------------

    function closeOnEscapeKeyDown(e: KeyboardEvent) {
        if (e.code === 'Escape') setIsChartFullScreen(false);
    }

    useEffect(() => {
        document.body.addEventListener('keydown', closeOnEscapeKeyDown);
        return function cleanUp() {
            document.body.removeEventListener('keydown', closeOnEscapeKeyDown);
        };
    });

    // END OF GRAPH SETTINGS CONTENT------------------------------------------------------

    const drawData = [
        {
            data: [
                {
                    x: 1698314114594.5933,
                    y: 1643.314830966333,
                    denomInBase: true,
                },
                {
                    x: 1698314114594.5933,
                    y: 1643.314830966333,
                    denomInBase: true,
                },
            ],
            type: 'Ray',
            time: 1698872412046,
            pool: {
                tokenA: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 5,
                    decimals: 18,
                    fromList: '/testnet-token-list.json',
                    listedBy: [
                        '/testnet-token-list.json',
                        '/ambient-token-list.json',
                    ],
                    logoURI:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                    name: 'Native Ether',
                    symbol: 'ETH',
                },
                tokenB: {
                    address: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
                    chainId: 5,
                    decimals: 6,
                    fromList: '/ambient-token-list.json',
                    listedBy: ['/ambient-token-list.json'],
                    logoURI:
                        'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                    name: 'USDCoin',
                    symbol: 'USDC',
                },
                baseToken: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 5,
                    decimals: 18,
                    fromList: '/testnet-token-list.json',
                    listedBy: [
                        '/testnet-token-list.json',
                        '/ambient-token-list.json',
                    ],
                    logoURI:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                    name: 'Native Ether',
                    symbol: 'ETH',
                },
                quoteToken: {
                    address: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
                    chainId: 5,
                    decimals: 6,
                    fromList: '/ambient-token-list.json',
                    listedBy: ['/ambient-token-list.json'],
                    logoURI:
                        'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                    name: 'USDCoin',
                    symbol: 'USDC',
                },
                isTokenABase: true,
                liquidityFee: 0.0005,
                didUserFlipDenom: false,
                shouldSwapConverterUpdate: false,
                shouldLimitConverterUpdate: false,
                shouldSwapDirectionReverse: false,
                shouldRangeDirectionReverse: false,
                isDenomBase: true,
                advancedMode: false,
                isTokenAPrimary: true,
                primaryQuantity: '',
                isTokenAPrimaryRange: true,
                primaryQuantityRange: '',
                rangeTicksCopied: false,
                poolPriceNonDisplay: 609326401.3136151,
                advancedLowTick: 0,
                advancedHighTick: 0,
                simpleRangeWidth: 10,
                slippageTolerance: 0.05,
                candleDomains: {},
                mainnetBaseTokenAddress: '',
                mainnetQuoteTokenAddress: '',
            },
            color: 'rgba(115, 113, 252, 1)',
            lineWidth: 1.5,
            style: [0, 0],
        },
        {
            data: [
                {
                    x: 1698860138939.671,
                    y: 1640.138997166775,
                    denomInBase: true,
                },
                {
                    x: 1698448475319.927,
                    y: 1637.6915117520864,
                    denomInBase: true,
                },
            ],
            type: 'Square',
            time: 1698875094428,
            pool: {
                tokenA: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 5,
                    decimals: 18,
                    fromList: '/testnet-token-list.json',
                    listedBy: [
                        '/testnet-token-list.json',
                        '/ambient-token-list.json',
                    ],
                    logoURI:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                    name: 'Native Ether',
                    symbol: 'ETH',
                },
                tokenB: {
                    address: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
                    chainId: 5,
                    decimals: 6,
                    fromList: '/ambient-token-list.json',
                    listedBy: ['/ambient-token-list.json'],
                    logoURI:
                        'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                    name: 'USDCoin',
                    symbol: 'USDC',
                },
                baseToken: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 5,
                    decimals: 18,
                    fromList: '/testnet-token-list.json',
                    listedBy: [
                        '/testnet-token-list.json',
                        '/ambient-token-list.json',
                    ],
                    logoURI:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                    name: 'Native Ether',
                    symbol: 'ETH',
                },
                quoteToken: {
                    address: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
                    chainId: 5,
                    decimals: 6,
                    fromList: '/ambient-token-list.json',
                    listedBy: ['/ambient-token-list.json'],
                    logoURI:
                        'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                    name: 'USDCoin',
                    symbol: 'USDC',
                },
                isTokenABase: true,
                liquidityFee: 0.0005,
                didUserFlipDenom: false,
                shouldSwapConverterUpdate: false,
                shouldLimitConverterUpdate: false,
                shouldSwapDirectionReverse: false,
                shouldRangeDirectionReverse: false,
                isDenomBase: true,
                advancedMode: false,
                isTokenAPrimary: true,
                primaryQuantity: '',
                isTokenAPrimaryRange: true,
                primaryQuantityRange: '',
                rangeTicksCopied: false,
                poolPriceNonDisplay: 609326401.3136151,
                advancedLowTick: 0,
                advancedHighTick: 0,
                simpleRangeWidth: 10,
                slippageTolerance: 0.05,
                candleDomains: {},
                mainnetBaseTokenAddress: '',
                mainnetQuoteTokenAddress: '',
            },
            color: 'rgba(115, 113, 252, 1)',
            lineWidth: 1.5,
            style: [0, 0],
        },
        {
            data: [
                {
                    x: 1699123603656.3071,
                    y: 1640.0890484848428,
                    denomInBase: true,
                },
                {
                    x: 1699123603656.3071,
                    y: 1640.0890484848428,
                    denomInBase: true,
                },
            ],
            type: 'Ray',
            time: 1698875096388,
            pool: {
                tokenA: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 5,
                    decimals: 18,
                    fromList: '/testnet-token-list.json',
                    listedBy: [
                        '/testnet-token-list.json',
                        '/ambient-token-list.json',
                    ],
                    logoURI:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                    name: 'Native Ether',
                    symbol: 'ETH',
                },
                tokenB: {
                    address: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
                    chainId: 5,
                    decimals: 6,
                    fromList: '/ambient-token-list.json',
                    listedBy: ['/ambient-token-list.json'],
                    logoURI:
                        'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                    name: 'USDCoin',
                    symbol: 'USDC',
                },
                baseToken: {
                    address: '0x0000000000000000000000000000000000000000',
                    chainId: 5,
                    decimals: 18,
                    fromList: '/testnet-token-list.json',
                    listedBy: [
                        '/testnet-token-list.json',
                        '/ambient-token-list.json',
                    ],
                    logoURI:
                        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
                    name: 'Native Ether',
                    symbol: 'ETH',
                },
                quoteToken: {
                    address: '0xD87Ba7A50B2E7E660f678A895E4B72E7CB4CCd9C',
                    chainId: 5,
                    decimals: 6,
                    fromList: '/ambient-token-list.json',
                    listedBy: ['/ambient-token-list.json'],
                    logoURI:
                        'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
                    name: 'USDCoin',
                    symbol: 'USDC',
                },
                isTokenABase: true,
                liquidityFee: 0.0005,
                didUserFlipDenom: false,
                shouldSwapConverterUpdate: false,
                shouldLimitConverterUpdate: false,
                shouldSwapDirectionReverse: false,
                shouldRangeDirectionReverse: false,
                isDenomBase: true,
                advancedMode: false,
                isTokenAPrimary: true,
                primaryQuantity: '',
                isTokenAPrimaryRange: true,
                primaryQuantityRange: '',
                rangeTicksCopied: false,
                poolPriceNonDisplay: 609326401.3136151,
                advancedLowTick: 0,
                advancedHighTick: 0,
                simpleRangeWidth: 10,
                slippageTolerance: 0.05,
                candleDomains: {},
                mainnetBaseTokenAddress: '',
                mainnetQuoteTokenAddress: '',
            },
            color: 'rgba(115, 113, 252, 1)',
            lineWidth: 1.5,
            style: [0, 0],
        },
    ] as drawDataHistory[];

    const userSharebaleData = {
        showTvl: false,
        showFeeRate: false,
        showVolume: true,
        liqMode: 'Curve',
        timeframe: '4h',
        drawData: drawData,
    };

    const chartKey = 'UVVLZ5qb';

    useEffect(() => {
        setIsReadOnlyChart(chartKey.toString() === 'UVVLZ5qb');
    }, [chartKey]);

    useEffect(() => {
        if (isReadOnlyChart) {
            setShowFeeRate(userSharebaleData?.showFeeRate);
            setShowTvl(userSharebaleData?.showTvl);
            setShowVolume(userSharebaleData?.showVolume);
            chartSettings.candleTime.global.changeTime(14400);
        }
    }, [isReadOnlyChart]);

    const timeFrameContent = (
        <FlexContainer
            justifyContent='space-between'
            alignItems='center'
            padding='4px 4px 8px 4px'
        >
            <div>
                <TimeFrame candleTime={chartSettings.candleTime.global} />
            </div>
            <div>
                <VolumeTVLFee
                    setShowVolume={setShowVolume}
                    setShowTvl={setShowTvl}
                    setShowFeeRate={setShowFeeRate}
                    showVolume={showVolume}
                    showTvl={showTvl}
                    showFeeRate={showFeeRate}
                />
            </div>
            <div>
                <CurveDepth overlayMethods={chartSettings.poolOverlay} />
            </div>
        </FlexContainer>
    );

    // END OF TIME FRAME CONTENT--------------------------------------------------------------

    // CURRENT DATA INFO----------------------------------------------------------------
    const [currentData, setCurrentData] = useState<CandleData | undefined>();
    const [currentVolumeData, setCurrentVolumeData] = useState<
        number | undefined
    >();
    // END OF CURRENT DATA INFO----------------------------------------------------------------

    const [isTutorialEnabled, setIsTutorialEnabled] = useState(false);

    return (
        <MainContainer
            flexDirection='column'
            fullHeight
            fullWidth
            style={{
                padding: isChartFullScreen ? '1rem' : '0',
                background: isChartFullScreen ? 'var(--dark2)' : '',
            }}
            ref={chartCanvasRef}
        >
            <div>
                {isTutorialActive && (
                    <FlexContainer
                        fullWidth
                        justifyContent='flex-end'
                        alignItems='flex-end'
                        padding='0 8px'
                    >
                        <TutorialButton
                            onClick={() => setIsTutorialEnabled(true)}
                        >
                            Tutorial Mode
                        </TutorialButton>
                    </FlexContainer>
                )}
                {isChartFullScreen && <TradeChartsHeader />}
                {!isReadOnlyChart && timeFrameContent}

                <CurrentDataInfo
                    showTooltip={showTooltip}
                    currentData={currentData}
                    currentVolumeData={currentVolumeData}
                    showLatest={showLatest}
                    setLatest={setLatest}
                    setReset={setReset}
                    setRescale={setRescale}
                    rescale={rescale}
                    reset={reset}
                    isReadOnlyChart={isReadOnlyChart}
                    userSharebaleData={userSharebaleData}
                />
            </div>
            <div style={{ width: '100%', height: '100%' }}>
                <TradeCandleStickChart
                    changeState={props.changeState}
                    chartItemStates={chartItemStates}
                    setCurrentData={setCurrentData}
                    setCurrentVolumeData={setCurrentVolumeData}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    rescale={rescale}
                    setRescale={setRescale}
                    latest={latest}
                    setLatest={setLatest}
                    reset={reset}
                    setReset={setReset}
                    showLatest={showLatest}
                    setShowLatest={setShowLatest}
                    setShowTooltip={setShowTooltip}
                    isLoading={props.isChartLoading}
                    setIsLoading={props.setIsChartLoading}
                    updateURL={updateURL}
                    isReadOnlyChart={isReadOnlyChart}
                    userSharebaleData={userSharebaleData}
                />
            </div>
            <TutorialOverlay
                isTutorialEnabled={isTutorialEnabled}
                setIsTutorialEnabled={setIsTutorialEnabled}
                steps={tradeChartTutorialSteps}
            />
        </MainContainer>
    );
}

export default memo(TradeCharts);
