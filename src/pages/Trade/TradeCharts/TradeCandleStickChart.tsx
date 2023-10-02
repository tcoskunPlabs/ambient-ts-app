import {
    Dispatch,
    SetStateAction,
    memo,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import Chart from '../../Chart/Chart';
import './TradeCandleStickChart.css';

// import candleStikPlaceholder from '../../../assets/images/charts/candlestick.png';
import { useAppSelector } from '../../../utils/hooks/reduxToolkit';
import { getPinnedPriceValuesFromTicks } from '../Range/rangeFunctions';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { IS_LOCAL_ENV } from '../../../constants';
import {
    diffHashSig,
    diffHashSigLiquidity,
} from '../../../utils/functions/diffHashSig';
import { CandleContext } from '../../../contexts/CandleContext';
import { CrocEnvContext } from '../../../contexts/CrocEnvContext';
import { PoolContext } from '../../../contexts/PoolContext';
import { ChartContext } from '../../../contexts/ChartContext';
import { candleScale } from '../../../utils/state/tradeDataSlice';
import { TradeTokenContext } from '../../../contexts/TradeTokenContext';
import { LiquidityDataLocal } from './TradeCharts';
import { CandleData } from '../../../App/functions/fetchCandleSeries';
import {
    chartItemStates,
    liquidityChartData,
    scaleData,
} from '../../Chart/ChartUtils/chartUtils';
import useMediaQuery from '../../../utils/hooks/useMediaQuery';
import AxisScalingAdjustment from '../../Chart/AxisScalingAdjustment';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface propsIF {
    changeState: (
        isOpen: boolean | undefined,
        candleData: CandleData | undefined,
    ) => void;
    chartItemStates: chartItemStates;
    setCurrentData: Dispatch<SetStateAction<CandleData | undefined>>;
    setCurrentVolumeData: Dispatch<SetStateAction<number | undefined>>;
    selectedDate: number | undefined;
    setSelectedDate: Dispatch<number | undefined>;
    rescale: boolean | undefined;
    setRescale: Dispatch<SetStateAction<boolean>>;
    latest: boolean | undefined;
    setLatest: Dispatch<SetStateAction<boolean>>;
    reset: boolean | undefined;
    setReset: Dispatch<SetStateAction<boolean>>;
    showLatest: boolean | undefined;
    setShowLatest: Dispatch<SetStateAction<boolean>>;
    setShowTooltip: Dispatch<SetStateAction<boolean>>;

    setIsLoading: Dispatch<SetStateAction<boolean>>;
    isLoading: boolean;
}

function TradeCandleStickChart(props: propsIF) {
    const {
        selectedDate,
        setSelectedDate,
        isLoading,
        setIsLoading,
        changeState,
        chartItemStates,
    } = props;

    const { candleData, isFetchingCandle, isCandleDataNull, setCandleScale } =
        useContext(CandleContext);
    const { chartSettings } = useContext(ChartContext);
    const { chainData } = useContext(CrocEnvContext);
    const { poolPriceDisplay: poolPriceWithoutDenom, isPoolInitialized } =
        useContext(PoolContext);
    const {
        baseToken: { address: baseTokenAddress },
        quoteToken: { address: quoteTokenAddress },
    } = useContext(TradeTokenContext);

    const period = useMemo(
        () => chartSettings.candleTime.global.time,
        [chartSettings.candleTime.global.time, location.pathname],
    );

    const unparsedCandleData = candleData?.candles;

    const [scaleData, setScaleData] = useState<scaleData | undefined>();
    const [liquidityScale, setLiquidityScale] = useState<
        d3.ScaleLinear<number, number> | undefined
    >(undefined);
    const [liquidityDepthScale, setLiquidityDepthScale] = useState<
        d3.ScaleLinear<number, number> | undefined
    >();
    const [prevPeriod, setPrevPeriod] = useState<any>();
    const [prevFirsCandle, setPrevFirsCandle] = useState<any>();

    const [liqBoundary, setLiqBoundary] = useState<number | undefined>(
        undefined,
    );

    const tradeData = useAppSelector((state) => state.tradeData);
    const { liquidityData: unparsedLiquidityData } = useAppSelector(
        (state) => state.graphData,
    );

    const tokenPair = useMemo(
        () => ({
            dataTokenA: tradeData.tokenA,
            dataTokenB: tradeData.tokenB,
        }),
        [
            tradeData.tokenB.address,
            tradeData.tokenB.chainId,
            tradeData.tokenA.address,
            tradeData.tokenA.chainId,
        ],
    );

    const denominationsInBase = useMemo(
        () => ({
            isDenomBase: tradeData.isDenomBase,
        }),
        [tradeData.isDenomBase],
    );

    const { poolPriceNonDisplay } = tradeData;

    const isTokenABase = tokenPair?.dataTokenA.address === baseTokenAddress;

    const poolPriceDisplay = poolPriceWithoutDenom
        ? denominationsInBase.isDenomBase && poolPriceWithoutDenom
            ? 1 / poolPriceWithoutDenom
            : poolPriceWithoutDenom ?? 0
        : 0;

    const tokenA = tokenPair.dataTokenA;
    const tokenB = tokenPair.dataTokenB;
    const tokenADecimals = tokenA.decimals;
    const tokenBDecimals = tokenB.decimals;
    const baseTokenDecimals = isTokenABase ? tokenADecimals : tokenBDecimals;
    const quoteTokenDecimals = !isTokenABase ? tokenADecimals : tokenBDecimals;

    const currentPoolPriceTick =
        poolPriceNonDisplay === undefined
            ? 0
            : Math.log(poolPriceNonDisplay) / Math.log(1.0001);

    const mobileView = useMediaQuery('(max-width: 600px)');

    useEffect(() => {
        setIsLoading(true);
    }, [period]);

    useEffect(() => {
        if (unparsedLiquidityData !== undefined) {
            const barThreshold =
                poolPriceDisplay !== undefined ? poolPriceDisplay : 0;

            const liqBoundaryData = unparsedLiquidityData.ranges.find(
                (liq: any) => {
                    return denominationsInBase.isDenomBase
                        ? liq.upperBoundInvPriceDecimalCorrected <
                              barThreshold &&
                              liq.lowerBoundInvPriceDecimalCorrected !== '-inf'
                        : liq.upperBoundPriceDecimalCorrected > barThreshold &&
                              liq.upperBoundPriceDecimalCorrected !== '+inf';
                },
            );

            const liqBoundaryArg =
                liqBoundaryData !== undefined
                    ? denominationsInBase.isDenomBase
                        ? liqBoundaryData.lowerBoundInvPriceDecimalCorrected
                        : liqBoundaryData.lowerBoundPriceDecimalCorrected
                    : barThreshold;
            const liqBoundary =
                typeof liqBoundaryArg === 'number'
                    ? liqBoundaryArg
                    : parseFloat(liqBoundaryArg);

            setLiqBoundary(() => liqBoundary);
        }
    }, [
        diffHashSigLiquidity(unparsedLiquidityData),
        denominationsInBase.isDenomBase,
        poolPriceDisplay !== undefined && poolPriceDisplay > 0,
    ]);

    useEffect(() => {
        if (unparsedCandleData === undefined) {
            clearLiquidityData();
        }
    }, [baseTokenAddress + quoteTokenAddress]);

    const clearLiquidityData = () => {
        if (liquidityData) {
            liquidityData.topBoundary = 0;
            liquidityData.lowBoundary = 0;
            liquidityData.liqTransitionPointforCurve = 0;
            liquidityData.liqTransitionPointforDepth = 0;
        }
    };

    // Parse liquidtiy data
    const liquidityData: liquidityChartData | undefined = useMemo(() => {
        if (
            liqBoundary &&
            unparsedLiquidityData &&
            poolPriceDisplay !== undefined &&
            poolPriceDisplay > 0 &&
            unparsedLiquidityData.curveState.base ===
                baseTokenAddress.toLowerCase() &&
            unparsedLiquidityData.curveState.quote ===
                quoteTokenAddress.toLowerCase() &&
            unparsedLiquidityData.curveState.poolIdx === chainData.poolIndex &&
            unparsedLiquidityData.curveState.chainId === chainData.chainId
        ) {
            IS_LOCAL_ENV && console.debug('parsing liquidity data');

            const liqAskData: LiquidityDataLocal[] = [];
            const liqBidData: LiquidityDataLocal[] = [];
            const depthLiqBidData: LiquidityDataLocal[] = [];
            const depthLiqAskData: LiquidityDataLocal[] = [];

            let topBoundary = 0;
            let lowBoundary = 0;

            const lowTick = currentPoolPriceTick - 100 * 101;
            const highTick = currentPoolPriceTick + 100 * 101;

            const rangeBoundary = getPinnedPriceValuesFromTicks(
                denominationsInBase.isDenomBase,
                baseTokenDecimals,
                quoteTokenDecimals,
                lowTick,
                highTick,
                lookupChain(chainData.chainId).gridSize,
            );

            const limitBoundary = parseFloat(
                rangeBoundary.pinnedMaxPriceDisplay,
            );

            const barThreshold =
                poolPriceDisplay !== undefined ? poolPriceDisplay : 0;

            const domainLeft = Math.min(
                ...unparsedLiquidityData.ranges
                    .filter((item) => item.activeLiq > 0)
                    .map((o: any) => {
                        return o.activeLiq !== undefined
                            ? o.activeLiq
                            : Infinity;
                    }),
            );
            const domainRight = Math.max(
                ...unparsedLiquidityData.ranges.map((o: any) => {
                    return o.activeLiq !== undefined ? o.activeLiq : 0;
                }),
            );

            const depthBidLeft = Math.min(
                ...unparsedLiquidityData.ranges.map((o: any) => {
                    return o.cumBidLiq !== undefined && o.cumBidLiq !== 0
                        ? o.cumBidLiq
                        : Infinity;
                }),
            );

            const depthBidRight = Math.max(
                ...unparsedLiquidityData.ranges.map((o: any) => {
                    return o.cumBidLiq !== undefined && o.cumBidLiq !== 0
                        ? o.cumBidLiq
                        : 0;
                }),
            );

            const depthAskLeft = Math.min(
                ...unparsedLiquidityData.ranges.map((o: any) => {
                    return o.cumAskLiq !== undefined && o.cumAskLiq !== 0
                        ? o.cumAskLiq
                        : Infinity;
                }),
            );

            const depthAskRight = Math.max(
                ...unparsedLiquidityData.ranges.map((o: any) => {
                    const price = denominationsInBase.isDenomBase
                        ? o.upperBoundInvPriceDecimalCorrected
                        : o.upperBoundPriceDecimalCorrected;
                    if (price > barThreshold / 10 && price < limitBoundary) {
                        return o.cumAskLiq !== undefined && o.cumAskLiq !== 0
                            ? o.cumAskLiq
                            : 0;
                    }
                    return 0;
                }),
            );

            const liquidityScale = d3
                .scaleLog()
                .domain([domainLeft, domainRight])
                .range([30, 1000]);

            const depthLiquidityScale = d3
                .scaleLog()
                .domain([
                    depthAskLeft < depthBidLeft ? depthAskLeft : depthBidLeft,
                    depthBidRight > depthAskRight
                        ? depthBidRight
                        : depthAskRight,
                ])
                .range([30, 550]);

            let liqBoundaryDepth = liqBoundary;

            unparsedLiquidityData.ranges.map((data: any) => {
                const liqUpperPrices = denominationsInBase.isDenomBase
                    ? data.upperBoundInvPriceDecimalCorrected
                    : data.lowerBoundPriceDecimalCorrected;

                const liqLowerPrices = denominationsInBase.isDenomBase
                    ? data.lowerBoundInvPriceDecimalCorrected
                    : data.upperBoundPriceDecimalCorrected;

                liqBoundaryDepth = liqLowerPrices;

                liqBoundaryDepth = liqUpperPrices;
            });

            topBoundary = limitBoundary;
            lowBoundary = parseFloat(rangeBoundary.pinnedMinPriceDisplay);

            return {
                liquidityScale: liquidityScale,
                depthLiquidityScale: depthLiquidityScale,
                allData: unparsedLiquidityData.ranges,

                topBoundary: topBoundary,
                lowBoundary: lowBoundary,
                liqTransitionPointforCurve: liqBoundary
                    ? liqBoundary
                    : poolPriceDisplay,
                liqTransitionPointforDepth: liqBoundaryDepth
                    ? liqBoundaryDepth
                    : poolPriceDisplay,

                limitBoundary: limitBoundary,
            };
        } else {
            setIsLoading(true);
            return undefined;
        }
    }, [liqBoundary]);

    useEffect(() => {
        if (unparsedCandleData) {
            setScaleForChart(unparsedCandleData);
        }
    }, [unparsedCandleData === undefined, mobileView]);

    // Scale
    const setScaleForChart = (unparsedCandleData: any) => {
        if (
            unparsedCandleData !== undefined &&
            unparsedCandleData.length > 0 &&
            period
        ) {
            const temp = [...unparsedCandleData];
            const boundaryCandles = temp.splice(0, mobileView ? 30 : 99);

            const priceRange = d3fc
                .extentLinear()
                .accessors([
                    (d: any) => {
                        return (
                            denominationsInBase.isDenomBase
                                ? d.invMinPriceExclMEVDecimalCorrected
                                : d.maxPriceExclMEVDecimalCorrected,
                            denominationsInBase.isDenomBase
                                ? d.invMaxPriceExclMEVDecimalCorrected
                                : d.minPriceExclMEVDecimalCorrected
                        );
                    },
                ])
                .pad([0.05, 0.05]);

            const xExtent = d3fc
                .extentLinear()
                .accessors([(d: any) => d.time * 1000])
                .padUnit('domain')
                .pad([
                    period * 1000,
                    (period / 2) * (mobileView ? 30 : 80) * 1000,
                ]);

            let xScale: any = undefined;

            const xScaleTime = d3.scaleTime();
            const yScale = d3.scaleLinear();
            xScale = d3.scaleLinear();
            xScale.domain(xExtent(boundaryCandles));

            yScale.domain(priceRange(boundaryCandles));

            const volumeScale = d3.scaleLinear();

            const yExtentVolume = d3fc
                .extentLinear(candleData?.candles)
                .accessors([(d: any) => d.volumeUSD]);

            volumeScale.domain(yExtentVolume(candleData?.candles));
            setScaleData((prev: scaleData | undefined) => {
                return {
                    xScale: prev?.xScale ? prev.xScale : xScale,
                    xScaleTime: xScaleTime,
                    yScale: yScale,
                    volumeScale: volumeScale,
                    xExtent: xExtent,
                };
            });
        }
    };

    useEffect(() => {
        if (
            unparsedCandleData &&
            unparsedCandleData.length > 0 &&
            period &&
            (prevPeriod === undefined || period !== prevPeriod)
        ) {
            const firtCandleTimeState = d3.max(
                unparsedCandleData,
                (d) => d.time,
            );
            if (
                scaleData &&
                prevPeriod &&
                prevFirsCandle &&
                firtCandleTimeState
            ) {
                const domain = scaleData.xScale.domain();

                const diffDomain = Math.abs(domain[1] - domain[0]);
                const factorDomain = diffDomain / (prevPeriod * 1000);

                const domainCenter =
                    Math.max(domain[1], domain[0]) - diffDomain / 2;

                const newDiffDomain = period * 1000 * factorDomain;

                const d1 = domainCenter + newDiffDomain / 2;
                const d0 = domainCenter - newDiffDomain / 2;

                const domainRight =
                    domain[1] < Date.now()
                        ? d1
                        : Date.now() + (newDiffDomain / 10) * 3;
                const domainLeft =
                    domain[1] < Date.now()
                        ? d0
                        : Date.now() - (newDiffDomain / 10) * 7;

                const fethcingCandles =
                    domainRight > Date.now() ? Date.now() : domainRight;

                scaleData.xScale.domain([domainLeft, domainRight]);

                const minDate = 1657868400; // 15 July 2022

                let firstTime = Math.floor(fethcingCandles / 1000);

                if (firstTime > minDate && fethcingCandles > domainLeft) {
                    let nCandles = Math.floor(
                        (fethcingCandles - domainLeft) / (period * 1000),
                    );

                    if (nCandles < 139) {
                        const nDiffFirstTime = Math.floor(
                            (Date.now() - firstTime * 1000) / (period * 1000),
                        );

                        const tempFirstTime =
                            firstTime + period * nDiffFirstTime;
                        if (nDiffFirstTime < 139 && nCandles > 5) {
                            firstTime = tempFirstTime;
                            nCandles = nCandles + (nDiffFirstTime + 100);
                        } else {
                            firstTime = firstTime + period * 100;
                            nCandles = 200;
                        }
                    }

                    setCandleScale((prev: candleScale) => {
                        return {
                            isFetchForTimeframe: !prev.isFetchForTimeframe,
                            lastCandleDate: firstTime,
                            nCandles: nCandles,
                            isShowLatestCandle: false,
                        };
                    });
                } else {
                    // resets the graph if the calculated domain is less than the value with min time
                    resetChart();
                }
            }
            setPrevFirsCandle(() => firtCandleTimeState);
            setPrevPeriod(() => period);
        }
    }, [period, diffHashSig(unparsedCandleData)]);

    const resetChart = () => {
        const nowDate = Date.now();

        const snapDiff = nowDate % (period * 1000);

        const snappedTime =
            nowDate -
            (snapDiff > period * 1000 - snapDiff
                ? -1 * (period * 1000 - snapDiff)
                : snapDiff);

        const minDomain = snappedTime - 100 * 1000 * period;
        const maxDomain = snappedTime + 39 * 1000 * period;

        scaleData?.xScale.domain([minDomain, maxDomain]);

        setCandleScale((prev: candleScale) => {
            return {
                isFetchForTimeframe: !prev.isFetchForTimeframe,
                lastCandleDate: undefined,
                nCandles: 200,
                isShowLatestCandle: true,
            };
        });
    };
    // resetting Chart
    useEffect(() => {
        if (isCandleDataNull && scaleData) {
            resetChart();
        }
    }, [isCandleDataNull]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const shouldReload =
                scaleData === undefined ||
                unparsedCandleData?.length === 0 ||
                poolPriceDisplay === 0 ||
                poolPriceNonDisplay === 0 ||
                liquidityData === undefined;

            if (isLoading !== shouldReload) {
                IS_LOCAL_ENV &&
                    console.debug('setting isLoading to ' + shouldReload);
                setIsLoading(shouldReload);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [
        unparsedCandleData === undefined,
        unparsedCandleData?.length,
        poolPriceDisplay,
        poolPriceNonDisplay,
        scaleData === undefined,
        liquidityScale,
        liquidityDepthScale,
        liquidityData,
        isLoading,
    ]);

    return (
        <>
            <div style={{ height: '100%', width: '100%' }}>
                <AxisScalingAdjustment
                    isLoading={isLoading}
                    candleData={candleData}
                    prevPeriod={prevPeriod}
                    period={period}
                    changeState={changeState}
                    tokenPair={tokenPair}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    rescale={props.rescale}
                    setRescale={props.setRescale}
                    latest={props.latest}
                    setLatest={props.setLatest}
                    reset={props.reset}
                    setReset={props.setReset}
                    showLatest={props.showLatest}
                    setShowLatest={props.setShowLatest}
                    setShowTooltip={props.setShowTooltip}
                    chartItemStates={chartItemStates}
                    setCurrentData={props.setCurrentData}
                    liquidityData={liquidityData}
                    setCurrentVolumeData={props.setCurrentVolumeData}
                    liquidityScale={liquidityScale}
                    liquidityDepthScale={liquidityDepthScale}
                    poolPriceNonDisplay={poolPriceNonDisplay}
                    chartSettings={chartSettings}
                    scaleData={scaleData}
                    tradeData={tradeData}
                    currentPoolPriceTick={currentPoolPriceTick}
                />
            </div>
        </>
    );
}

export default memo(TradeCandleStickChart);
