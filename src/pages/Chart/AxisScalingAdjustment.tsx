import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Spinner from '../../components/Global/Spinner/Spinner';
import { CandlesByPoolAndDuration } from '../../utils/state/graphDataSlice';
import Chart from './Chart';
import { PoolContext } from '../../contexts/PoolContext';
import { CandleContext } from '../../contexts/CandleContext';
import { TokenIF } from '../../utils/interfaces/TokenIF';
import { TradeTokenContext } from '../../contexts/TradeTokenContext';
import { CandleData } from '../../App/functions/fetchCandleSeries';
import {
    chartItemStates,
    lineValue,
    liquidityChartData,
    scaleData,
} from './ChartUtils/chartUtils';
import { chartSettingsMethodsIF } from '../../App/hooks/useChartSettings';
import { diffHashSigChart } from '../../utils/functions/diffHashSig';
import * as d3 from 'd3';
import { TradeDataIF } from '../../utils/state/tradeDataSlice';
import { RangeContext } from '../../contexts/RangeContext';
import { getPinnedPriceValuesFromTicks } from '../Trade/Range/rangeFunctions';
import { lookupChain } from '@crocswap-libs/sdk/dist/context';
import { CrocEnvContext } from '../../contexts/CrocEnvContext';
import { pinTickLower, pinTickUpper, tickToPrice } from '@crocswap-libs/sdk';

interface propsIF {
    changeState: (
        isOpen: boolean | undefined,
        candleData: CandleData | undefined,
    ) => void;
    isLoading: boolean;
    candleData: CandlesByPoolAndDuration | undefined;
    prevPeriod: number;
    period: number;
    tokenPair: {
        dataTokenA: TokenIF;
        dataTokenB: TokenIF;
    };
    selectedDate: number | undefined;
    setSelectedDate: React.Dispatch<number | undefined>;
    rescale: boolean | undefined;
    setRescale: React.Dispatch<React.SetStateAction<boolean>>;
    latest: boolean | undefined;
    setLatest: React.Dispatch<React.SetStateAction<boolean>>;
    reset: boolean | undefined;
    setReset: React.Dispatch<React.SetStateAction<boolean>>;
    showLatest: boolean | undefined;
    setShowLatest: React.Dispatch<React.SetStateAction<boolean>>;
    setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>;
    chartItemStates: chartItemStates;
    setCurrentData: React.Dispatch<
        React.SetStateAction<CandleData | undefined>
    >;
    liquidityData: liquidityChartData | undefined;
    setCurrentVolumeData: React.Dispatch<
        React.SetStateAction<number | undefined>
    >;
    poolPriceNonDisplay: number;
    chartSettings: chartSettingsMethodsIF;
    scaleData: scaleData | undefined;
    tradeData: TradeDataIF;
    currentPoolPriceTick: number;
}
export default function AxisScalingAdjustment(props: propsIF) {
    const {
        isLoading,
        candleData,
        prevPeriod,
        period,
        tokenPair,
        selectedDate,
        setSelectedDate,
        rescale,
        setRescale,
        reset,
        setReset,
        showLatest,
        setShowLatest,
        latest,
        setLatest,
        changeState,
        setShowTooltip,
        chartItemStates,
        setCurrentData,
        setCurrentVolumeData,
        liquidityData,
        poolPriceNonDisplay,
        chartSettings,
        scaleData,
        tradeData,
        currentPoolPriceTick,
    } = props;
    const {
        isPoolInitialized,
        poolPriceDisplay: poolPriceWithoutDenom,
        pool,
    } = useContext(PoolContext);
    const { isFetchingCandle } = useContext(CandleContext);
    const {
        baseToken: { address: baseTokenAddress },
    } = useContext(TradeTokenContext);

    const isTokenABase = tokenPair?.dataTokenA.address === baseTokenAddress;
    const isDenomBase = tradeData.isDenomBase;

    const denominationsInBase = useMemo(
        () => ({
            isDenomBase: tradeData.isDenomBase,
        }),
        [tradeData.isDenomBase],
    );
    const { chainData } = useContext(CrocEnvContext);
    const chainId = chainData.chainId;
    const { simpleRangeWidth: rangeSimpleRangeWidth } =
        useContext(RangeContext);
    const [limitPrice, setLimitPrice] = useState<number>(0);

    const [marketPrice, setMarketPrice] = useState<number>(0);

    const [ranges, setRanges] = useState<lineValue[]>([
        {
            name: 'Min',
            value: 0,
        },
        {
            name: 'Max',
            value: 0,
        },
    ]);

    // NoGoZone
    const [noGoZoneBoudnaries, setNoGoZoneBoudnaries] = useState([[0, 0]]);

    const [minTickForLimit, setMinTickForLimit] = useState<number>(0);
    const [maxTickForLimit, setMaxTickForLimit] = useState<number>(0);
    const [isLineDrag, setIsLineDrag] = useState(false);

    const { tokenA, tokenB } = tradeData;
    const tokenADecimals = tokenA.decimals;
    const tokenBDecimals = tokenB.decimals;
    const baseTokenDecimals = isTokenABase ? tokenADecimals : tokenBDecimals;
    const quoteTokenDecimals = !isTokenABase ? tokenADecimals : tokenBDecimals;

    const poolPriceDisplay = poolPriceWithoutDenom
        ? isDenomBase && poolPriceWithoutDenom
            ? 1 / poolPriceWithoutDenom
            : poolPriceWithoutDenom ?? 0
        : 0;

    const unparsedCandleData = useMemo(() => {
        const data = candleData?.candles
            .sort((a, b) => b.time - a.time)
            .map((item) => ({
                ...item,
                isFakeData: false,
            }));
        if (poolPriceWithoutDenom && data && data.length > 0) {
            const fakeData = {
                time: data[0].time + period,
                invMinPriceExclMEVDecimalCorrected:
                    data[0].invPriceOpenExclMEVDecimalCorrected,
                maxPriceExclMEVDecimalCorrected:
                    data[0].priceOpenExclMEVDecimalCorrected,
                invMaxPriceExclMEVDecimalCorrected: 1 / poolPriceWithoutDenom,
                minPriceExclMEVDecimalCorrected: poolPriceWithoutDenom,
                invPriceOpenExclMEVDecimalCorrected:
                    data[0].invPriceOpenExclMEVDecimalCorrected,
                priceOpenExclMEVDecimalCorrected:
                    data[0].priceOpenExclMEVDecimalCorrected,
                invPriceCloseExclMEVDecimalCorrected: 1 / poolPriceWithoutDenom,
                priceCloseExclMEVDecimalCorrected: poolPriceWithoutDenom,
                period: period,
                tvlData: {
                    time: data[0].time,
                    tvl: data[0].tvlData.tvl,
                },
                volumeUSD: 0,
                averageLiquidityFee: data[0].averageLiquidityFee,
                minPriceDecimalCorrected:
                    data[0].priceOpenExclMEVDecimalCorrected,
                maxPriceDecimalCorrected: 0,
                priceOpenDecimalCorrected:
                    data[0].priceOpenExclMEVDecimalCorrected,
                priceCloseDecimalCorrected:
                    data[0].priceOpenExclMEVDecimalCorrected,
                invMinPriceDecimalCorrected:
                    data[0].invPriceOpenExclMEVDecimalCorrected,
                invMaxPriceDecimalCorrected: 0,
                invPriceOpenDecimalCorrected:
                    data[0].invPriceOpenExclMEVDecimalCorrected,
                invPriceCloseDecimalCorrected:
                    data[0].invPriceOpenExclMEVDecimalCorrected,
                isCrocData: false,
                isFakeData: true,
            };

            // added candle for pool price market price match
            if (!data[0].isFakeData) {
                data.unshift(fakeData);
            } else {
                data[0] = fakeData;
            }
        }

        return data;
    }, [diffHashSigChart(candleData?.candles), poolPriceWithoutDenom]);

    useEffect(() => {
        const noGoZoneBoudnaries = noGoZone(poolPriceDisplay);
        setNoGoZoneBoudnaries(() => {
            return noGoZoneBoudnaries;
        });
    }, [poolPriceDisplay]);

    function noGoZone(poolPrice: number) {
        setLimitTickNearNoGoZone(poolPrice * 0.99, poolPrice * 1.01);
        return [[poolPrice * 0.99, poolPrice * 1.01]];
    }

    // *** LIMIT ***
    /**
     * This function retrieves the 'noGoZoneMin' and 'noGoZoneMax' values from the 'noGoZoneBoundaries' array.
     * These values represent the minimum and maximum boundaries of a no-go zone.
     *
     * @returns {Object} An object containing 'noGoZoneMin' and 'noGoZoneMax'.
     */
    const getNoZoneData = () => {
        const noGoZoneMin = noGoZoneBoudnaries[0][0];
        const noGoZoneMax = noGoZoneBoudnaries[0][1];
        return { noGoZoneMin: noGoZoneMin, noGoZoneMax: noGoZoneMax };
    };

    // *** LIMIT ***
    /**
     * finds border ticks of nogozone
     * This function sets the 'minTickForLimit' and 'maxTickForLimit' values
     * tick values are calculated based on the 'low' and 'high' values provided near the no go zone.
     *
     * @param low   The low value for the calculation
     * @param high  The high value for the calculation
     */ const setLimitTickNearNoGoZone = (low: number, high: number) => {
        const limitNonDisplay = isDenomBase
            ? pool?.fromDisplayPrice(parseFloat(low.toString()))
            : pool?.fromDisplayPrice(1 / parseFloat(low.toString()));

        limitNonDisplay?.then((limit) => {
            limit = limit !== 0 ? limit : 1;
            const pinnedTick: number = pinTickLower(limit, chainData.gridSize);

            const tickPrice = tickToPrice(
                pinnedTick + (isDenomBase ? 1 : -1) * chainData.gridSize * 2,
            );

            const tickDispPrice = pool?.toDisplayPrice(tickPrice);

            if (tickDispPrice) {
                tickDispPrice.then((tp) => {
                    const displayPriceWithDenom = isDenomBase ? tp : 1 / tp;

                    setMinTickForLimit(displayPriceWithDenom);
                });
            }
        });

        const limitNonDisplayMax = isDenomBase
            ? pool?.fromDisplayPrice(parseFloat(high.toString()))
            : pool?.fromDisplayPrice(1 / parseFloat(high.toString()));

        limitNonDisplayMax?.then((limit) => {
            limit = limit !== 0 ? limit : 1;
            const pinnedTick: number = pinTickUpper(limit, chainData.gridSize);

            const tickPrice = tickToPrice(
                pinnedTick + (isDenomBase ? -1 : 1) * chainData.gridSize * 2,
            );

            const tickDispPrice = pool?.toDisplayPrice(tickPrice);

            if (tickDispPrice) {
                tickDispPrice.then((tp) => {
                    const displayPriceWithDenom = isDenomBase ? tp : 1 / tp;
                    setMaxTickForLimit(displayPriceWithDenom);
                });
            }
        });
    };

    function changeScale(isChangeDenom = false) {
        if (scaleData && rescale && unparsedCandleData) {
            const xmin = scaleData?.xScale.domain()[0];
            const xmax = scaleData?.xScale.domain()[1];
            const marketPrice = poolPriceWithoutDenom
                ? isDenomBase
                    ? 1 / poolPriceWithoutDenom
                    : poolPriceWithoutDenom
                : 0;
            const filtered = unparsedCandleData.filter(
                (data: CandleData) =>
                    data.time * 1000 >= xmin && data.time * 1000 <= xmax,
            );

            if (
                filtered !== undefined &&
                (isChangeDenom || filtered.length > 10)
            ) {
                const minYBoundary = d3.min(filtered, (d) =>
                    isDenomBase
                        ? d.invMaxPriceExclMEVDecimalCorrected
                        : d.minPriceExclMEVDecimalCorrected,
                );
                const maxYBoundary = d3.max(filtered, (d) =>
                    isDenomBase
                        ? d.invMinPriceExclMEVDecimalCorrected
                        : d.maxPriceExclMEVDecimalCorrected,
                );

                if (minYBoundary && maxYBoundary) {
                    const diffBoundray = Math.abs(maxYBoundary - minYBoundary);
                    const buffer = diffBoundray
                        ? diffBoundray / 6
                        : minYBoundary / 2;
                    if (
                        location.pathname.includes('pool') ||
                        location.pathname.includes('reposition')
                    ) {
                        if (
                            rangeSimpleRangeWidth !== 100 ||
                            tradeData.advancedMode
                        ) {
                            const min = ranges.filter(
                                (target: lineValue) => target.name === 'Min',
                            )[0].value;
                            const max = ranges.filter(
                                (target: lineValue) => target.name === 'Max',
                            )[0].value;

                            const low = Math.min(
                                min,
                                max,
                                minYBoundary,
                                marketPrice,
                            );

                            const high = Math.max(
                                min,
                                max,
                                maxYBoundary,
                                marketPrice,
                            );

                            const bufferForRange = Math.abs((low - high) / 6);

                            const domain = [
                                Math.min(low, high) - bufferForRange,
                                Math.max(low, high) + bufferForRange / 2,
                            ];

                            setYaxisDomain(domain[0], domain[1]);
                        } else {
                            const lowTick =
                                currentPoolPriceTick -
                                rangeSimpleRangeWidth * 100;
                            const highTick =
                                currentPoolPriceTick +
                                rangeSimpleRangeWidth * 100;

                            const pinnedDisplayPrices =
                                getPinnedPriceValuesFromTicks(
                                    isDenomBase,
                                    baseTokenDecimals,
                                    quoteTokenDecimals,
                                    lowTick,
                                    highTick,
                                    lookupChain(chainId).gridSize,
                                );

                            const low = 0;
                            const high = parseFloat(
                                pinnedDisplayPrices.pinnedMaxPriceDisplayTruncated,
                            );

                            const bufferForRange = Math.abs((low - high) / 90);

                            const domain = [
                                Math.min(low, high) - bufferForRange,
                                Math.max(low, high) + bufferForRange / 2,
                            ];

                            scaleData?.yScale.domain(domain);
                        }
                    } else if (location.pathname.includes('/limit')) {
                        const value = limitPrice;
                        const low = Math.min(
                            minYBoundary,
                            value,
                            minTickForLimit,
                            marketPrice,
                        );

                        const high = Math.max(
                            maxYBoundary,
                            value,
                            maxTickForLimit,
                            marketPrice,
                        );

                        const bufferForLimit = Math.abs((low - high) / 6);
                        if (value > 0 && Math.abs(value) !== Infinity) {
                            const domain = [
                                Math.min(low, high) - bufferForLimit,
                                Math.max(low, high) + bufferForLimit / 2,
                            ];

                            setYaxisDomain(domain[0], domain[1]);
                        }
                    } else {
                        const domain = [
                            Math.min(minYBoundary, maxYBoundary, marketPrice) -
                                buffer,
                            Math.max(minYBoundary, maxYBoundary, marketPrice) +
                                buffer / 2,
                        ];

                        setYaxisDomain(domain[0], domain[1]);
                    }
                }
            }
            render();
        }
    }

    const render = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nd = d3.select('#d3fc_group').node() as any;
        if (nd) nd.requestRedraw();
    }, []);

    useEffect(() => {
        setMarketLineValue();
    }, [poolPriceWithoutDenom, isDenomBase]);

    const setMarketLineValue = useCallback(() => {
        if (poolPriceWithoutDenom !== undefined) {
            const lastCandlePrice = isDenomBase
                ? 1 / poolPriceWithoutDenom
                : poolPriceWithoutDenom;

            setMarketPrice(() => {
                return lastCandlePrice !== undefined ? lastCandlePrice : 0;
            });
        }
    }, [poolPriceWithoutDenom, isDenomBase]);

    function setYaxisDomain(minDomain: number, maxDomain: number) {
        if (scaleData) {
            if (minDomain === maxDomain) {
                const delta = minDomain / 8;
                const tempMinDomain = minDomain - delta;
                const tempMaxDomain = minDomain + delta;

                scaleData.yScale.domain([tempMinDomain, tempMaxDomain]);
            } else {
                scaleData.yScale.domain([minDomain, maxDomain]);
            }
        }
    }

    // autoScaleF
    useEffect(() => {
        if (rescale && !isLineDrag && prevPeriod === period) {
            changeScale();
        }
    }, [
        ranges,
        limitPrice,
        location.pathname,
        period,
        diffHashSigChart(unparsedCandleData),
        noGoZoneBoudnaries,
        maxTickForLimit,
        minTickForLimit,
        prevPeriod === period,
        // candleTimeInSeconds === period,
        isLineDrag,
        marketPrice,
    ]);

    useEffect(() => {
        changeScale(true);
    }, [denominationsInBase, marketPrice]);

    const isLoadingChart =
        !isLoading &&
        isPoolInitialized !== undefined &&
        prevPeriod === period &&
        !isFetchingCandle &&
        liquidityData !== undefined;

    return (
        <div style={{ height: '100%', width: '100%' }}>
            {!isLoadingChart && (
                <Spinner size={100} bg='var(--dark2)' centered />
            )}

            {unparsedCandleData !== undefined && (
                <Chart
                    unparsedCandleData={unparsedCandleData}
                    isTokenABase={isTokenABase}
                    liquidityData={liquidityData}
                    changeState={changeState}
                    chartItemStates={chartItemStates}
                    setCurrentData={setCurrentData}
                    setCurrentVolumeData={setCurrentVolumeData}
                    scaleData={scaleData}
                    prevPeriod={prevPeriod}
                    candleTimeInSeconds={period}
                    poolPriceNonDisplay={poolPriceNonDisplay}
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
                    candleTime={chartSettings.candleTime.global}
                    changeScale={changeScale}
                    setYaxisDomain={setYaxisDomain}
                    limit={limitPrice}
                    setLimit={setLimitPrice}
                    market={marketPrice}
                    setMarket={setMarketPrice}
                    ranges={ranges}
                    setRanges={setRanges}
                    minTickForLimit={minTickForLimit}
                    maxTickForLimit={maxTickForLimit}
                    getNoZoneData={getNoZoneData}
                    noGoZoneBoudnaries={noGoZoneBoudnaries}
                    setIsLineDrag={setIsLineDrag}
                    isLineDrag={isLineDrag}
                    render={render}
                    isLoadingChart={isLoadingChart}
                />
            )}
        </div>
    );
}
