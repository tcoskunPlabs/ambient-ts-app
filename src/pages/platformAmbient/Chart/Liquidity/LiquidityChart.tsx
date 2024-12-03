import * as d3 from 'd3';
import {
    MouseEvent,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    diffHashSig,
    diffHashSigScaleData,
} from '../../../../ambient-utils/dataLayer';
import { ChartThemeIF } from '../../../../contexts/ChartContext';
import { PoolContext } from '../../../../contexts/PoolContext';
import { RangeContext } from '../../../../contexts/RangeContext';
import { TradeDataContext } from '../../../../contexts/TradeDataContext';
import useMediaQuery from '../../../../utils/hooks/useMediaQuery';
import { formatAmountWithoutDigit } from '../../../../utils/numbers';
import { LiquidityDataLocal } from '../../Trade/TradeCharts/TradeCharts';
import {
    getXandYLocationForChart,
    lineValue,
    liquidityChartData,
    LiquidityHoverData,
    renderCanvasArray,
    renderChart,
    scaleData,
    setCanvasResolution,
} from '../ChartUtils/chartUtils';
import {
    createAreaSeries,
    decorateForLiquidityArea,
    getAskPriceValue,
    getBidPriceValue,
} from './LiquiditySeries/AreaSeries';
import {
    createLineSeries,
    decorateForLiquidityLine,
} from './LiquiditySeries/LineSeries';
import { LiquidityRangeIF } from '../../../../ambient-utils/types';

interface liquidityPropsIF {
    liqMode: string;
    liquidityData: liquidityChartData;
    scaleData: scaleData | undefined;
    liquidityScale: d3.ScaleLinear<number, number> | undefined;
    liquidityDepthScale: d3.ScaleLinear<number, number> | undefined;
    ranges: lineValue[];
    chartMousemoveEvent: MouseEvent<HTMLDivElement> | undefined;
    liqTooltip:
        | d3.Selection<HTMLDivElement, unknown, null, undefined>
        | undefined;
    mouseLeaveEvent: MouseEvent<HTMLDivElement> | undefined;
    isActiveDragOrZoom: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mainCanvasBoundingClientRect: any;
    chartThemeColors: ChartThemeIF | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render: any;
    colorChangeTrigger: boolean;
    setColorChangeTrigger: React.Dispatch<React.SetStateAction<boolean>>;
}

type nearestLiquidity = {
    min: number | undefined;
    max: number | undefined;
};

export default function LiquidityChart(props: liquidityPropsIF) {
    const d3CanvasLiq = useRef<HTMLCanvasElement | null>(null);
    const d3CanvasLiqHover = useRef<HTMLCanvasElement | null>(null);
    const {
        pool: pool,
        poolPriceDisplay: poolPriceWithoutDenom,
        isTradeDollarizationEnabled,
    } = useContext(PoolContext);
    const { advancedMode } = useContext(RangeContext);
    const { isDenomBase, poolPriceNonDisplay } = useContext(TradeDataContext);

    const poolPriceDisplay = poolPriceWithoutDenom
        ? isDenomBase && poolPriceWithoutDenom
            ? 1 / poolPriceWithoutDenom
            : (poolPriceWithoutDenom ?? 0)
        : 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [liqAskSeries, setLiqAskSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [liqBidSeries, setLiqBidSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineLiqAskSeries, setLineLiqAskSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineLiqBidSeries, setLineLiqBidSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineLiqDepthBidSeries, setLineLiqDepthBidSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineLiqDepthAskSeries, setLineLiqDepthAskSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [liqDepthAskSeries, setLiqDepthAskSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [liqDepthBidSeries, setLiqDepthBidSeries] = useState<any>();
    const [highlightedBidAreaCurveSeries, setHighlightedBidAreaCurveSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();
    const [highlightedAskAreaCurveSeries, setHighlightedAskAreaCurveSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();
    const [highlightedAreaBidSeries, setHighlightedAreaBidSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();
    const [highlightedAreaAskSeries, setHighlightedAreaAskSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();

    const [currentPriceData] = useState([{ value: -1 }]);
    const [liqTooltipSelectedLiqBar, setLiqTooltipSelectedLiqBar] = useState<
        LiquidityRangeIF | undefined
    >(undefined);

    const [singlePosition, setSinglePosition] = useState<
        undefined | 'ask' | 'bid'
    >();

    const {
        liqMode,
        liquidityData,
        scaleData,
        liquidityScale,
        liquidityDepthScale,
        ranges,
        chartMousemoveEvent,
        liqTooltip,
        mouseLeaveEvent,
        isActiveDragOrZoom,
        mainCanvasBoundingClientRect,
        chartThemeColors,
        render,
        colorChangeTrigger,
        setColorChangeTrigger,
    } = props;

    const mobileView = useMediaQuery('(max-width: 800px)');

    const currentPoolPriceTick =
        poolPriceNonDisplay === undefined
            ? 0
            : Math.log(poolPriceNonDisplay) / Math.log(1.0001);

    const liqDataAsk = liquidityData?.liqAskData;

    const liqDataDepthAsk = liquidityData?.depthLiqAskData;

    const liqDataBid = liquidityData?.liqBidData;

    const liqDataDepthBid = useMemo<LiquidityDataLocal[]>(() => {
        return advancedMode
            ? liquidityData?.depthLiqBidData
            : liquidityData?.depthLiqBidData.filter(
                  (d: LiquidityDataLocal) =>
                      d.liqPrices <= liquidityData?.topBoundary,
              );
    }, [
        advancedMode,
        liquidityData?.depthLiqBidData,
        liquidityData?.topBoundary,
    ]);

    const hoverAskData = useMemo(
        () =>
            liqDataAsk?.map((item) => {
                return {
                    activeLiq: liquidityData.liquidityScale(item.activeLiq),
                    liqPrices: isDenomBase
                        ? item.lowerBoundInvPriceDecimalCorrected
                        : item.upperBoundPriceDecimalCorrected,
                };
            }),
        [liqDataAsk],
    );

    const hoverBidData = useMemo(
        () =>
            liqDataBid?.map((item) => {
                return {
                    activeLiq: liquidityData.liquidityScale(item.activeLiq),
                    liqPrices: isDenomBase
                        ? item.upperBoundInvPriceDecimalCorrected
                        : item.lowerBoundPriceDecimalCorrected,
                };
            }),
        [liqDataBid],
    );

    const findLiqNearest = (
        liqDataAll: LiquidityHoverData[],
    ): nearestLiquidity => {
        if (scaleData !== undefined) {
            const point = scaleData?.yScale.domain()[0];

            if (point == undefined) return { min: undefined, max: undefined };
            if (liqDataAll) {
                const tempLiqData = liqDataAll;

                const sortLiqaData = tempLiqData.sort(function (a, b) {
                    return a.liqPrices - b.liqPrices;
                });

                if (!sortLiqaData || sortLiqaData.length === 0)
                    return { min: undefined, max: undefined };
                const closestMin = sortLiqaData.reduce(function (prev, curr) {
                    return Math.abs(
                        curr.liqPrices - scaleData?.yScale.domain()[0],
                    ) < Math.abs(prev.liqPrices - scaleData?.yScale.domain()[0])
                        ? curr
                        : prev;
                });

                const closestMax = sortLiqaData.reduce(function (prev, curr) {
                    return Math.abs(
                        curr.liqPrices - scaleData?.yScale.domain()[1],
                    ) < Math.abs(prev.liqPrices - scaleData?.yScale.domain()[1])
                        ? curr
                        : prev;
                });

                if (closestMin !== undefined && closestMin !== undefined) {
                    return {
                        min: closestMin.liqPrices ? closestMin.liqPrices : 0,
                        max: closestMax.liqPrices,
                    };
                } else {
                    return { min: 0, max: 0 };
                }
            }
        }
        return { min: undefined, max: undefined };
    };

    useEffect(() => {
        console.log({ liquidityData });
    }, [liquidityData]);

    const liqMaxActiveLiq = useMemo<number | undefined>(() => {
        if (scaleData && liquidityDepthScale && liquidityScale) {
            const allData =
                liqMode === 'curve'
                    ? hoverAskData.concat(hoverBidData)
                    : liqDataDepthBid.concat(liqDataDepthAsk);

            if (!allData || allData.length === 0) return;
            const { min }: { min: number | undefined } = findLiqNearest(
                allData,
            ) as nearestLiquidity;

            if (min !== undefined) {
                let filteredAllData = allData.filter(
                    (item: LiquidityHoverData) =>
                        min <= item.liqPrices &&
                        item.liqPrices <= scaleData?.yScale.domain()[1],
                );

                if (
                    filteredAllData === undefined ||
                    filteredAllData.length === 0
                ) {
                    filteredAllData = allData.filter(
                        (item: LiquidityHoverData) => min <= item.liqPrices,
                    );
                }

                const liqMaxActiveLiq = d3.max(
                    filteredAllData,
                    function (d: LiquidityHoverData) {
                        return d.activeLiq;
                    },
                );

                return liqMaxActiveLiq;
            }
        }
        return undefined;
    }, [
        liqDataBid,
        liqDataAsk,
        liqDataDepthBid,
        liqDataDepthAsk,
        scaleData && liquidityDepthScale && liquidityScale,
        liqMode,
        diffHashSigScaleData(scaleData, 'y'),
    ]);

    const [liquidityMouseMoveActive, setLiquidityMouseMoveActive] =
        useState<string>('none');

    useEffect(() => {
        renderChart();
    }, [
        liquidityScale === undefined,
        liquidityDepthScale === undefined,
        diffHashSig(chartThemeColors),
    ]);

    useEffect(() => {
        const filteredAsk = liqDataAsk.filter(
            (i) => getAskPriceValue(i, isDenomBase) < poolPriceDisplay,
        );

        const filteredBid = liqDataBid.filter(
            (i) => getBidPriceValue(i, isDenomBase) > poolPriceDisplay,
        );

        console.log({ filteredAsk, filteredBid });

        if (filteredBid.length === 0) {
            setSinglePosition('ask');
        }

        if (filteredAsk.length === 0) {
            setSinglePosition('bid');
        }
        console.log({ liqDataAsk, liqDataBid });

        console.log({ filteredAsk, filteredBid });
    }, [liqDataAsk, liqDataBid]);

    // Auto scale fo liq Curve
    useEffect(() => {
        if (liquidityScale) {
            const mergedLiqData = hoverAskData.concat(hoverBidData);

            try {
                if (mergedLiqData && mergedLiqData.length === 0) return;

                const { min, max }: nearestLiquidity =
                    findLiqNearest(mergedLiqData);

                if (min !== undefined && max !== undefined) {
                    const visibleDomain = mergedLiqData.filter(
                        (liqData: LiquidityHoverData) =>
                            liqData?.liqPrices >= min &&
                            liqData?.liqPrices <= max,
                    );
                    const maxLiq = d3.max(
                        visibleDomain,
                        (d: LiquidityHoverData) => d.activeLiq,
                    );
                    if (maxLiq && maxLiq !== 1 && liquidityScale) {
                        liquidityScale.domain([0, maxLiq]);
                    }

                    render();
                    renderCanvasArray([d3CanvasLiq]);
                }
            } catch (error) {
                console.error({ error });
            }
        }
    }, [
        diffHashSigScaleData(scaleData, 'y'),
        liquidityData?.depthLiqAskData,
        liquidityData?.depthLiqBidData,
        mobileView,
        liquidityScale,
    ]);

    useEffect(() => {
        if (
            scaleData !== undefined &&
            liquidityScale !== undefined &&
            liquidityDepthScale !== undefined
        ) {
            const d3CanvasLiqAskChart = createAreaSeries(
                liquidityScale,
                scaleData?.yScale,
                d3.curveBasis,
            );
            setLiqAskSeries(() => d3CanvasLiqAskChart);

            const d3CanvasLiqBidChart = createAreaSeries(
                liquidityScale,
                scaleData?.yScale,
                d3.curveBasis,
            );
            setLiqBidSeries(() => d3CanvasLiqBidChart);

            const d3CanvasLiqBidChartDepth = createAreaSeries(
                liquidityDepthScale,
                scaleData?.yScale,
                d3.curveStepAfter,
            );

            setLiqDepthBidSeries(() => d3CanvasLiqBidChartDepth);

            const d3CanvasLiqAskChartDepth = createAreaSeries(
                liquidityDepthScale,
                scaleData?.yScale,
                d3.curveStepBefore,
            );

            setLiqDepthAskSeries(() => d3CanvasLiqAskChartDepth);

            const d3CanvasLiqChartLine = createLineSeries(
                liquidityScale,
                scaleData?.yScale,
                d3.curveBasis,
            );
            setLineLiqAskSeries(() => d3CanvasLiqChartLine);

            const d3CanvasLiqBidChartLine = createLineSeries(
                liquidityScale,
                scaleData?.yScale,
                d3.curveBasis,
            );
            setLineLiqBidSeries(() => d3CanvasLiqBidChartLine);

            const d3CanvasLiqBidChartDepthLine = createLineSeries(
                liquidityDepthScale,
                scaleData?.yScale,
                d3.curveStepAfter,
            );

            setLineLiqDepthBidSeries(() => d3CanvasLiqBidChartDepthLine);

            const d3CanvasLiqAskChartDepthLine = createLineSeries(
                liquidityDepthScale,
                scaleData?.yScale,
                d3.curveStepBefore,
            );

            setLineLiqDepthAskSeries(() => d3CanvasLiqAskChartDepthLine);
        }
    }, [
        scaleData,
        liquidityScale,
        pool,
        liquidityDepthScale,
        isDenomBase,
        isTradeDollarizationEnabled,
    ]);

    useEffect(() => {
        if (liqBidSeries && chartThemeColors && liqAskSeries) {
            decorateForLiquidityArea(liqBidSeries, chartThemeColors, true);

            decorateForLiquidityArea(liqAskSeries, chartThemeColors, false);

            decorateForLiquidityLine(lineLiqBidSeries, chartThemeColors, 'bid');

            decorateForLiquidityLine(lineLiqAskSeries, chartThemeColors, 'ask');
        }

        if (liqDepthAskSeries && chartThemeColors) {
            decorateForLiquidityArea(
                liqDepthAskSeries,
                chartThemeColors,
                false,
            );
            decorateForLiquidityLine(
                lineLiqDepthAskSeries,
                chartThemeColors,
                'ask',
            );
        }

        if (liqDepthBidSeries && chartThemeColors) {
            decorateForLiquidityArea(liqDepthBidSeries, chartThemeColors, true);
            decorateForLiquidityLine(
                lineLiqDepthBidSeries,
                chartThemeColors,
                'bid',
            );
        }

        setColorChangeTrigger(false);

        render();
        renderCanvasArray([d3CanvasLiq]);
    }, [
        liqMode,
        liquidityData,
        liqAskSeries,
        liqBidSeries,
        liqDepthAskSeries,
        liqDepthBidSeries,
        lineLiqAskSeries,
        lineLiqBidSeries,
        lineLiqDepthAskSeries,
        lineLiqDepthBidSeries,
        colorChangeTrigger,
        chartThemeColors,
    ]);

    const clipCanvas = (
        low: number,
        high: number,
        canvas: HTMLCanvasElement,
    ) => {
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        const height = low - high;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, high, canvas.width, height);
        ctx.clip();
    };

    const clipHighlightedLines = (
        canvas: HTMLCanvasElement,
        liqType: 'bid' | 'ask',
    ) => {
        const _low = ranges.filter(
            (target: lineValue) => target.name === 'Min',
        )[0].value;
        const _high = ranges.filter(
            (target: lineValue) => target.name === 'Max',
        )[0].value;

        const low = _low > _high ? _high : _low;
        const high = _low > _high ? _low : _high;

        const lastLow = liqType === 'bid' ? poolPriceDisplay : low;
        const lastHigh = liqType === 'bid' ? high : poolPriceDisplay;
        if (scaleData) {
            if (lastLow && lastHigh) {
                clipCanvas(
                    scaleData?.yScale(lastLow),
                    scaleData?.yScale(lastHigh),
                    canvas,
                );
            } else {
                clipCanvas(
                    scaleData?.yScale(low),
                    scaleData?.yScale(high),
                    canvas,
                );
            }
        }
    };

    useEffect(() => {
        setHighlightedBidAreaCurveSeries(() => liqBidSeries);
        setHighlightedAskAreaCurveSeries(() => liqAskSeries);
        setHighlightedAreaBidSeries(() => liqDepthBidSeries);
        setHighlightedAreaAskSeries(() => liqDepthAskSeries);
    }, [liqBidSeries, liqAskSeries, liqDepthBidSeries, liqDepthAskSeries]);

    const drawCurveLines = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');

        const isRange =
            location.pathname.includes('pool') ||
            location.pathname.includes('reposition');

        const allData =
            liqMode === 'curve'
                ? liqDataBid.concat(liqDataAsk)
                : liqDataDepthBid.concat(liqDataDepthAsk);

        if (isRange) {
            clipHighlightedLines(canvas, 'bid');
            lineLiqBidSeries(allData.slice().reverse());
            ctx?.restore();
            clipHighlightedLines(canvas, 'ask');
            lineLiqAskSeries(allData);
            ctx?.restore();
        }
    };

    const drawDepthLines = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');

        const allData =
            liqMode === 'curve'
                ? liqDataBid.concat(liqDataAsk)
                : liqDataDepthBid.concat(liqDataDepthAsk);

        const isRange =
            location.pathname.includes('pool') ||
            location.pathname.includes('reposition');
        if (isRange) {
            clipHighlightedLines(canvas, 'ask');
            lineLiqDepthAskSeries(allData);
            ctx?.restore();
            clipHighlightedLines(canvas, 'bid');
            lineLiqDepthBidSeries(allData.slice().reverse());
            ctx?.restore();
        }
    };

    const liqDataHover = (event: MouseEvent<HTMLDivElement>) => {
        if (
            scaleData !== undefined &&
            liquidityDepthScale !== undefined &&
            liquidityScale !== undefined
        ) {
            const canvas = d3
                .select(d3CanvasLiq.current)
                .select('canvas')
                .node() as HTMLCanvasElement;

            const rect = canvas.getBoundingClientRect();

            const { offsetX, offsetY } = getXandYLocationForChart(event, rect);

            const currentDataY = scaleData?.yScale.invert(offsetY);
            const currentDataX =
                liqMode === 'depth'
                    ? liquidityDepthScale.invert(offsetX)
                    : liquidityScale.invert(offsetX);

            const bidMinBoudnary = d3.min(liqDataBid, (d: LiquidityRangeIF) =>
                getBidPriceValue(d, isDenomBase),
            );
            const bidMaxBoudnary = d3.max(liqDataBid, (d: LiquidityRangeIF) =>
                getBidPriceValue(d, isDenomBase),
            );

            const askMinBoudnary = d3.min(liqDataAsk, (d: LiquidityRangeIF) =>
                getAskPriceValue(d, isDenomBase),
            );
            const askMaxBoudnary = d3.max(liqDataAsk, (d: LiquidityRangeIF) =>
                getAskPriceValue(d, isDenomBase),
            );

            if (liqMaxActiveLiq && currentDataX <= liqMaxActiveLiq) {
                if (
                    bidMinBoudnary !== undefined &&
                    bidMaxBoudnary !== undefined
                ) {
                    if (
                        bidMinBoudnary < currentDataY &&
                        currentDataY < bidMaxBoudnary
                    ) {
                        setLiquidityMouseMoveActive('bid');
                        bidAreaFunc(event);
                    } else if (
                        askMinBoudnary !== undefined &&
                        askMaxBoudnary !== undefined
                    ) {
                        if (
                            askMinBoudnary < currentDataY &&
                            currentDataY < askMaxBoudnary
                        ) {
                            setLiquidityMouseMoveActive('ask');
                            askAreaFunc(event);
                        }
                    }
                }
            } else {
                if (liquidityMouseMoveActive !== 'none') {
                    liqTooltip?.style('visibility', 'hidden');
                    setLiquidityMouseMoveActive('none');
                }
            }
        }
    };

    useEffect(() => {
        const canvas = d3
            .select(d3CanvasLiq.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        const allData =
            liqMode === 'curve'
                ? hoverAskData.concat(hoverBidData)
                : liqDataDepthBid.concat(liqDataDepthAsk);
        if (
            liqBidSeries &&
            liqAskSeries &&
            liqDepthBidSeries &&
            liqDepthAskSeries &&
            scaleData &&
            liquidityDepthScale &&
            liquidityScale
        ) {
            d3.select(d3CanvasLiq.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);

                    if (singlePosition === undefined) {
                        if (liqMode === 'curve') {
                            clipCanvas(
                                scaleData?.yScale(poolPriceDisplay),
                                0,
                                canvas,
                            );

                            liqBidSeries(allData.slice().reverse());

                            ctx?.restore();

                            clipCanvas(
                                scaleData?.yScale(0),
                                scaleData?.yScale(poolPriceDisplay),
                                canvas,
                            );

                            liqAskSeries(allData);
                            ctx?.restore();

                            drawCurveLines(canvas);
                        }
                        if (liqMode === 'depth') {
                            clipCanvas(
                                scaleData?.yScale(poolPriceDisplay),
                                0,
                                canvas,
                            );

                            liqDepthBidSeries(allData.slice().reverse());

                            ctx?.restore();

                            clipCanvas(
                                scaleData?.yScale(0),
                                scaleData?.yScale(poolPriceDisplay),
                                canvas,
                            );

                            liqDepthAskSeries(liqDataDepthAsk);

                            ctx?.restore();

                            drawDepthLines(canvas);
                        }
                    } else {
                        if (singlePosition === 'ask') {
                            liqAskSeries(
                                [
                                    ...allData,
                                    {
                                        activeLiq: allData[0].activeLiq,
                                        liqPrices: scaleData.yScale.domain()[1],
                                    },
                                ].sort((a, b) => a.liqPrices - b.liqPrices),
                            );
                        } else {
                            liqBidSeries(
                                [
                                    ...allData,
                                    {
                                        activeLiq: allData[0].activeLiq,
                                        liqPrices: scaleData.yScale.domain()[1],
                                    },
                                    {
                                        activeLiq: allData[0].activeLiq,
                                        liqPrices: scaleData.yScale.domain()[0],
                                    },
                                ].sort((a, b) => b.liqPrices - a.liqPrices),
                            );
                        }
                    }
                })
                .on('measure', (event: CustomEvent) => {
                    liquidityScale.range([event.detail.width, 0]);

                    liquidityDepthScale.range([event.detail.width, 0]);
                    scaleData?.yScale.range([event.detail.height, 0]);

                    liqBidSeries?.context(ctx);
                    liqAskSeries?.context(ctx);
                    liqDepthBidSeries?.context(ctx);
                    liqDepthAskSeries?.context(ctx);
                    lineLiqDepthAskSeries?.context(ctx);
                    lineLiqDepthBidSeries?.context(ctx);
                    lineLiqAskSeries?.context(ctx);
                    lineLiqBidSeries?.context(ctx);
                });

            renderChart();
        }
    }, [
        liqDataAsk,
        liqDataBid,
        liqDataDepthBid,
        liqDataDepthAsk,
        advancedMode,
        liqBidSeries,
        liqAskSeries,
        liqDepthBidSeries,
        liqDepthAskSeries,
        liquidityScale === undefined,
        liquidityDepthScale === undefined,
        liqMode,
        location.pathname,
        ranges,
        lineLiqDepthAskSeries,
        lineLiqDepthBidSeries,
        lineLiqAskSeries,
        lineLiqBidSeries,
        singlePosition,
    ]);

    useEffect(() => {
        const threshold =
            liqMode === 'curve'
                ? liquidityData?.liqTransitionPointforCurve
                : liquidityData?.liqTransitionPointforDepth;

        const allData =
            liqMode === 'curve'
                ? liqDataBid.concat(liqDataAsk)
                : liqDataDepthBid.concat(liqDataDepthAsk);

        const canvas = d3
            .select(d3CanvasLiqHover.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (chartMousemoveEvent) {
            d3.select(d3CanvasLiqHover.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);
                    if (liquidityMouseMoveActive !== 'none' && scaleData) {
                        const rectCanvas = canvas.getBoundingClientRect();
                        const { offsetY } = getXandYLocationForChart(
                            chartMousemoveEvent,
                            rectCanvas,
                        );

                        if (liquidityMouseMoveActive === 'ask') {
                            clipCanvas(
                                offsetY,
                                scaleData?.yScale(threshold),
                                canvas,
                            );

                            if (liqMode === 'curve') {
                                highlightedAskAreaCurveSeries(allData);
                            }
                            if (liqMode === 'depth') {
                                highlightedAreaAskSeries(allData);
                            }
                            ctx?.restore();
                        }
                        if (liquidityMouseMoveActive === 'bid') {
                            clipCanvas(
                                scaleData?.yScale(threshold),
                                offsetY,
                                canvas,
                            );
                            if (liqMode === 'curve') {
                                highlightedBidAreaCurveSeries(
                                    allData.slice().reverse(),
                                );
                            }

                            if (liqMode === 'depth') {
                                highlightedAreaBidSeries(
                                    allData.slice().reverse(),
                                );
                            }
                            ctx?.restore();
                        }
                    }
                })
                .on('measure', () => {
                    highlightedAskAreaCurveSeries?.context(ctx);
                    highlightedBidAreaCurveSeries?.context(ctx);
                    highlightedAreaAskSeries?.context(ctx);
                    highlightedAreaBidSeries?.context(ctx);
                });
        }
    }, [
        highlightedAskAreaCurveSeries,
        highlightedBidAreaCurveSeries,
        highlightedAreaBidSeries,
        highlightedAreaAskSeries,
        liquidityMouseMoveActive,
        chartMousemoveEvent,
        liqDataDepthAsk,
        liqDataAsk,
        liqDataDepthBid,
        liqDataBid,
        liqMode,
        liquidityData?.liqTransitionPointforCurve,
        liquidityData?.liqTransitionPointforDepth,
    ]);

    useEffect(() => {
        if (
            liqTooltip !== undefined &&
            liquidityMouseMoveActive !== 'none' &&
            poolPriceDisplay !== undefined
        ) {
            const liqTextData = { totalValue: 0 };

            if (liqTooltipSelectedLiqBar != null) {
                if (liquidityMouseMoveActive === 'ask') {
                    liquidityData?.liqAskData.map(
                        (liqData: LiquidityRangeIF) => {
                            if (
                                getAskPriceValue(liqData, isDenomBase) >
                                getAskPriceValue(
                                    liqTooltipSelectedLiqBar,
                                    isDenomBase,
                                )
                            ) {
                                liqTextData.totalValue =
                                    liqTextData.totalValue +
                                    liqData?.deltaAverageUSD;
                            }
                        },
                    );
                } else {
                    liquidityData?.liqBidData.map(
                        (liqData: LiquidityRangeIF) => {
                            if (
                                getBidPriceValue(liqData, isDenomBase) <
                                getBidPriceValue(
                                    liqTooltipSelectedLiqBar,
                                    isDenomBase,
                                )
                            ) {
                                liqTextData.totalValue =
                                    liqTextData.totalValue +
                                    liqData?.deltaAverageUSD;
                            }
                        },
                    );
                }
            }
            const pinnedTick =
                liquidityMouseMoveActive === 'bid'
                    ? isDenomBase
                        ? liqTooltipSelectedLiqBar?.upperBound
                        : liqTooltipSelectedLiqBar?.lowerBound
                    : isDenomBase
                      ? liqTooltipSelectedLiqBar?.lowerBound
                      : liqTooltipSelectedLiqBar?.upperBound;

            if (pinnedTick) {
                const percentage = parseFloat(
                    (
                        Math.abs(pinnedTick - currentPoolPriceTick) / 100
                    ).toString(),
                ).toFixed(1);

                liqTooltip.html(
                    '<p>' +
                        percentage +
                        '%</p>' +
                        '<p> $' +
                        formatAmountWithoutDigit(liqTextData.totalValue, 0) +
                        ' </p>',
                );
            }
        }
    }, [
        liqTooltipSelectedLiqBar,
        liqMode,
        liquidityMouseMoveActive,
        liqTooltip,
        poolPriceDisplay,
        currentPoolPriceTick,
        liquidityData?.liqAskData,
        liquidityData?.liqBidData,
    ]);

    const bidAreaFunc = (event: MouseEvent<HTMLDivElement>) => {
        if (scaleData) {
            const canvas = d3
                .select(d3CanvasLiq.current)
                .select('canvas')
                .node() as HTMLCanvasElement;

            const rect = canvas.getBoundingClientRect();
            const { offsetX } = getXandYLocationForChart(
                event,
                mainCanvasBoundingClientRect,
            );
            const { offsetY } = getXandYLocationForChart(event, rect);
            currentPriceData[0] = {
                value: poolPriceDisplay !== undefined ? poolPriceDisplay : 0,
            };

            const filtered =
                liquidityData?.liqBidData.length > 1
                    ? liquidityData?.liqBidData.filter(
                          (d: LiquidityRangeIF) =>
                              getBidPriceValue(d, isDenomBase) != null,
                      )
                    : liquidityData?.liqBidData;

            const mousePosition = scaleData?.yScale.invert(offsetY);

            let closest = filtered.find(
                (item: LiquidityRangeIF) =>
                    getBidPriceValue(item, isDenomBase) ===
                    d3.min(filtered, (d: LiquidityRangeIF) =>
                        getBidPriceValue(d, isDenomBase),
                    ),
            );

            if (closest) {
                liqDataBid.map((data: LiquidityRangeIF) => {
                    if (closest) {
                        const liqPrice = getBidPriceValue(data, isDenomBase);
                        const closestLiqPrice = getBidPriceValue(
                            closest,
                            isDenomBase,
                        );

                        if (
                            mousePosition > liqPrice &&
                            liqPrice > closestLiqPrice
                        ) {
                            closest = data;
                        }
                    }
                });

                setLiqTooltipSelectedLiqBar(() => {
                    return closest;
                });

                const pinnedTick = isDenomBase
                    ? closest?.upperBound
                    : closest?.lowerBound;

                const percentage = parseFloat(
                    (
                        Math.abs(pinnedTick - currentPoolPriceTick) / 100
                    ).toString(),
                ).toFixed(1);

                liqTooltip
                    ?.style(
                        'visibility',
                        percentage !== '0.0' ? 'visible' : 'hidden',
                    )
                    .style('top', offsetY - 20 + 'px')
                    .style('left', offsetX - 80 + 'px');
            }
        }
    };

    const askAreaFunc = (event: MouseEvent<HTMLDivElement>) => {
        if (scaleData) {
            const canvas = d3
                .select(d3CanvasLiq.current)
                .select('canvas')
                .node() as HTMLCanvasElement;

            const rect = canvas.getBoundingClientRect();

            const { offsetX } = getXandYLocationForChart(
                event,
                mainCanvasBoundingClientRect,
            );
            const { offsetY } = getXandYLocationForChart(event, rect);

            currentPriceData[0] = {
                value: poolPriceDisplay !== undefined ? poolPriceDisplay : 0,
            };

            const filtered =
                liquidityData?.liqAskData.length > 1
                    ? liquidityData?.liqAskData.filter(
                          (d: LiquidityRangeIF) =>
                              getAskPriceValue(d, isDenomBase) != null,
                      )
                    : liquidityData?.liqAskData;

            const mousePosition = scaleData?.yScale.invert(offsetY);
            const maxAskPriceValue = d3.max(liqDataAsk, (d: LiquidityRangeIF) =>
                getAskPriceValue(d, isDenomBase),
            );

            let closest = filtered.find((item: LiquidityRangeIF) => {
                return getAskPriceValue(item, isDenomBase) === maxAskPriceValue;
            });

            if (closest !== undefined) {
                filtered.map((data: LiquidityRangeIF) => {
                    if (closest) {
                        const liqPrice = getAskPriceValue(data, isDenomBase);
                        const closestLiqPrice = getAskPriceValue(
                            closest,
                            isDenomBase,
                        );

                        if (
                            mousePosition < liqPrice &&
                            liqPrice < closestLiqPrice
                        ) {
                            closest = data;
                        }
                    }
                });
                setLiqTooltipSelectedLiqBar(() => {
                    return closest;
                });

                const pinnedTick = isDenomBase
                    ? closest?.lowerBound
                    : closest?.upperBound;

                const percentage = parseFloat(
                    (
                        Math.abs(pinnedTick - currentPoolPriceTick) / 100
                    ).toString(),
                ).toFixed(1);

                liqTooltip
                    ?.style(
                        'visibility',
                        percentage !== '0.0' ? 'visible' : 'hidden',
                    )
                    .style('top', offsetY - 20 + 'px')
                    .style('left', offsetX - 80 + 'px');
            }
        }
    };

    useEffect(() => {
        const liqDataAll = liquidityData?.depthLiqBidData.concat(
            liquidityData?.depthLiqAskData,
        );
        try {
            if (liqDataAll && liqDataAll.length === 0) return;
            const { min, max }: nearestLiquidity = findLiqNearest(liqDataAll);
            if (min !== undefined && max !== undefined) {
                const visibleDomain = liqDataAll.filter(
                    (liqData: LiquidityDataLocal) =>
                        liqData?.liqPrices >= min && liqData?.liqPrices <= max,
                );
                const maxLiq = d3.max(
                    visibleDomain,
                    (d: LiquidityDataLocal) => d.activeLiq,
                );
                if (maxLiq && parseFloat(maxLiq) !== 1 && liquidityDepthScale) {
                    liquidityDepthScale.domain([0, maxLiq]);
                }
            }
        } catch (error) {
            console.error({ error });
        }
    }, [
        diffHashSigScaleData(scaleData, 'y'),
        liquidityData?.depthLiqAskData,
        liquidityData?.depthLiqBidData,
    ]);

    useEffect(() => {
        if (chartMousemoveEvent && liqMode !== 'none') {
            liqDataHover(chartMousemoveEvent);
            renderCanvasArray([d3CanvasLiqHover]);
        }
    }, [
        chartMousemoveEvent,
        mainCanvasBoundingClientRect,
        liqMode,
        liqMaxActiveLiq,
    ]);

    useEffect(() => {
        if (liquidityMouseMoveActive !== 'none') {
            setLiquidityMouseMoveActive('none');
            liqTooltip?.style('visibility', 'hidden');
        }
    }, [mouseLeaveEvent]);

    useEffect(() => {
        if (liquidityMouseMoveActive !== 'none' && isActiveDragOrZoom) {
            liqTooltip?.style('visibility', 'hidden');
            setLiquidityMouseMoveActive('none');
        }
    }, [isActiveDragOrZoom]);

    useEffect(() => {
        if (liquidityMouseMoveActive === 'none') {
            d3.select(d3CanvasLiqHover.current)
                .select('canvas')
                .style('display', 'none');
        } else {
            d3.select(d3CanvasLiqHover.current)
                .select('canvas')
                .style('display', 'inline');
        }
    }, [liquidityMouseMoveActive]);

    useEffect(() => {
        renderCanvasArray([d3CanvasLiq]);
    }, [
        diffHashSig(liquidityData),
        ranges,
        liqMode,
        location.pathname,
        diffHashSig(chartThemeColors),
        chartThemeColors,
    ]);

    return (
        <>
            <d3fc-canvas
                ref={d3CanvasLiqHover}
                style={{
                    position: 'relative',
                    width: mobileView ? '20%' : '8%',
                    marginLeft: mobileView ? '80%' : '92%',
                }}
            ></d3fc-canvas>
            <d3fc-canvas
                ref={d3CanvasLiq}
                style={{
                    position: 'relative',
                    width: mobileView ? '20%' : '8%',
                    marginLeft: mobileView ? '80%' : '92%',
                }}
            ></d3fc-canvas>
        </>
    );
}
