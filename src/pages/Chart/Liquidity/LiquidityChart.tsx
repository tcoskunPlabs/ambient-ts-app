import {
    MouseEvent,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';

import {
    diffHashSig,
    diffHashSigScaleData,
} from '../../../utils/functions/diffHashSig';

import { useAppSelector } from '../../../utils/hooks/reduxToolkit';
import { PoolContext } from '../../../contexts/PoolContext';
import { formatAmountWithoutDigit } from '../../../utils/numbers';
import {
    LiquidityDataLocal,
    LiquidityHoverData,
} from '../../Trade/TradeCharts/TradeCharts';
import {
    lineValue,
    liquidityChartData,
    renderCanvasArray,
    scaleData,
    setCanvasResolution,
} from '../ChartUtils/chartUtils';
import {
    createAreaSeries,
    createAreaSeriesLiquidity,
    createAreaSeriesLiquidityAsk,
    createAreaSeriesLiquidityBid,
} from './LiquiditySeries/AreaSeries';
import {
    createLineSeries,
    decorateForLiquidityLine,
} from './LiquiditySeries/LineSeries';
import {
    LiquidityDataIF,
    LiquidityRangeIF,
} from '../../../App/functions/fetchPoolLiquidity';

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
}

type nearestLiquidity = {
    min: number | undefined;
    max: number | undefined;
};

export default function LiquidityChart(props: liquidityPropsIF) {
    const d3CanvasLiq = useRef<HTMLCanvasElement | null>(null);
    const d3CanvasLiqHover = useRef<HTMLCanvasElement | null>(null);
    const { pool: pool, poolPriceDisplay: poolPriceWithoutDenom } =
        useContext(PoolContext);
    const tradeData = useAppSelector((state) => state.tradeData);

    const isDenomBase = tradeData.isDenomBase;
    const { poolPriceNonDisplay } = tradeData;

    const poolPriceDisplay = poolPriceWithoutDenom
        ? isDenomBase && poolPriceWithoutDenom
            ? 1 / poolPriceWithoutDenom
            : poolPriceWithoutDenom ?? 0
        : 0;

    const [liquidityScale, setLiquidityScale] = useState<
        d3.ScaleLinear<number, number> | undefined
    >(undefined);

    const [liquidityDepthScale, setLiquidityDepthScale] = useState<
        d3.ScaleLinear<number, number> | undefined
    >();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [liqDepthAskSeries, setLiqDepthAskSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [liqDepthBidSeries, setLiqDepthBidSeries] = useState<any>();
    const [highlightedAreaCurveAskSeries, setHighlightedAreaCurveAskSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();

    const [highlightedAreaCurveBidSeries, setHighlightedAreaCurveBidSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();
    const [highlightedAreaDepthBidSeries, setHighlightedAreaDepthBidSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();
    const [highlightedAreaDepthAskSeries, setHighlightedAreaDepthAskSeries] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();
    const [liqBoundary, setLiqBoundary] = useState<number | undefined>(
        undefined,
    );

    const [currentPriceData] = useState([{ value: -1 }]);
    const [liqTooltipSelectedLiqBar, setLiqTooltipSelectedLiqBar] = useState<
        LiquidityRangeIF | undefined
    >(undefined);
    const {
        liqMode,
        liquidityData,
        scaleData,
        ranges,
        chartMousemoveEvent,
        liqTooltip,
        mouseLeaveEvent,
        isActiveDragOrZoom,
        mainCanvasBoundingClientRect,
    } = props;

    const currentPoolPriceTick =
        poolPriceNonDisplay === undefined
            ? 0
            : Math.log(poolPriceNonDisplay) / Math.log(1.0001);

    const liqDataAsk = useMemo<LiquidityRangeIF[]>(() => {
        if (liqBoundary) {
            const data = liquidityData.allData
                .filter((i: LiquidityRangeIF) => {
                    const liqUpperPrices = isDenomBase
                        ? i.upperBoundInvPriceDecimalCorrected
                        : i.lowerBoundPriceDecimalCorrected;

                    const liqLowerPrices = isDenomBase
                        ? i.lowerBoundInvPriceDecimalCorrected
                        : i.upperBoundPriceDecimalCorrected;

                    return (
                        liqLowerPrices <= liquidityData.limitBoundary &&
                        liqLowerPrices > liqBoundary / 10 &&
                        !(
                            liqUpperPrices >= liqBoundary &&
                            liqUpperPrices < liqBoundary * 10
                        )
                    );
                })
                .sort(
                    (a: LiquidityRangeIF, b: LiquidityRangeIF) =>
                        b.upperBoundInvPriceDecimalCorrected -
                        a.upperBoundInvPriceDecimalCorrected,
                );

            if (isDenomBase) {
                data.push({
                    ...data[data.length - 1],
                    lowerBoundInvPriceDecimalCorrected: 0,
                });
            } else {
                data.push({
                    ...data[data.length - 1],
                    upperBoundInvPriceDecimalCorrected: 0,
                });
            }

            return data;
        }
    }, [liqBoundary, isDenomBase]);

    const liqDataBid = useMemo<LiquidityRangeIF[]>(() => {
        if (liqBoundary) {
            const data = liquidityData.allData.filter((i: LiquidityRangeIF) => {
                const liqUpperPrices = isDenomBase
                    ? i.upperBoundInvPriceDecimalCorrected
                    : i.lowerBoundPriceDecimalCorrected;

                return (
                    liqUpperPrices >= liqBoundary &&
                    liqUpperPrices < liqBoundary * 10
                );
            });

            if (isDenomBase) {
                const minLowerBoundInvPriceDecimalCorrected = d3.min(
                    data,
                    (d: LiquidityRangeIF) =>
                        d.upperBoundInvPriceDecimalCorrected,
                );

                const activeLiq = data.find(
                    (liqData: LiquidityRangeIF) =>
                        minLowerBoundInvPriceDecimalCorrected ===
                        liqData.upperBoundInvPriceDecimalCorrected,
                )?.activeLiq;

                data.push({
                    ...data[0],
                    activeLiq: activeLiq,
                    upperBoundInvPriceDecimalCorrected:
                        liquidityData.liqTransitionPointforCurve,
                });

                return data.sort(
                    (a: LiquidityRangeIF, b: LiquidityRangeIF) =>
                        b.upperBoundInvPriceDecimalCorrected -
                        a.upperBoundInvPriceDecimalCorrected,
                );
            } else {
                const minUpperBoundInvPriceDecimalCorrected = d3.min(
                    data,
                    (d: any) => d.upperBoundPriceDecimalCorrected,
                );

                const activeLiq = data.find(
                    (liqData: any) =>
                        minUpperBoundInvPriceDecimalCorrected ===
                        liqData.upperBoundPriceDecimalCorrected,
                )?.activeLiq;
                // data.push({
                //     ...data[0],
                //     activeLiq: activeLiq,
                //     upperBoundPriceDecimalCorrected:
                //         liquidityData.liqTransitionPointforCurve,
                // });

                return data.sort(
                    (a: any, b: any) =>
                        b.upperBoundPriceDecimalCorrected -
                        a.upperBoundPriceDecimalCorrected,
                );
            }
        }
    }, [liqBoundary, isDenomBase]);

    const liqDepthDataAsk = useMemo<LiquidityRangeIF[]>(() => {
        if (liqBoundary) {
            const data = liquidityData.allData
                .filter((i: LiquidityRangeIF) => {
                    const liqUpperPrices = isDenomBase
                        ? i.upperBoundInvPriceDecimalCorrected
                        : i.lowerBoundPriceDecimalCorrected;

                    const liqLowerPrices = isDenomBase
                        ? i.lowerBoundInvPriceDecimalCorrected
                        : i.upperBoundPriceDecimalCorrected;

                    if (isDenomBase) {
                        return (
                            i.cumAskLiq !== undefined &&
                            !Number.isNaN(
                                liquidityData.depthLiquidityScale(i.cumAskLiq),
                            ) &&
                            liqLowerPrices > liqBoundary / 10
                        );
                    }

                    return (
                        i.cumBidLiq !== undefined &&
                        !Number.isNaN(
                            liquidityData.depthLiquidityScale(i.cumBidLiq),
                        ) &&
                        liqUpperPrices <= liquidityData.limitBoundary &&
                        liqUpperPrices > liqBoundary / 10
                    );
                })
                .sort(
                    (a: LiquidityRangeIF, b: LiquidityRangeIF) =>
                        b.upperBoundInvPriceDecimalCorrected -
                        a.upperBoundInvPriceDecimalCorrected,
                );

            if (isDenomBase) {
                data.push({
                    ...data[data.length - 1],
                    lowerBoundInvPriceDecimalCorrected: 0,
                });
            } else {
                data.push({
                    ...data[data.length - 1],
                    upperBoundInvPriceDecimalCorrected: 0,
                });
            }

            return data;
        }
    }, [liqBoundary, isDenomBase]);

    const liqDepthDataBid = useMemo<LiquidityRangeIF[]>(() => {
        if (liqBoundary) {
            const data = liquidityData.allData
                .filter((i: LiquidityRangeIF) => {
                    const liqUpperPrices = isDenomBase
                        ? i.upperBoundInvPriceDecimalCorrected
                        : i.lowerBoundPriceDecimalCorrected;

                    const liqLowerPrices = isDenomBase
                        ? i.lowerBoundInvPriceDecimalCorrected
                        : i.upperBoundPriceDecimalCorrected;

                    if (isDenomBase) {
                        return (
                            i.cumBidLiq !== undefined &&
                            Number.isFinite(liqUpperPrices) &&
                            liqUpperPrices < liqBoundary * 10 &&
                            !Number.isNaN(
                                liquidityData.depthLiquidityScale(i.cumBidLiq),
                            )
                        );
                    } else {
                        return (
                            i.cumAskLiq !== undefined &&
                            Number.isFinite(liqUpperPrices) &&
                            !Number.isNaN(
                                liquidityData.depthLiquidityScale(i.cumAskLiq),
                            ) &&
                            liqUpperPrices < liqBoundary * 10
                        );
                    }
                })
                .sort(
                    (a: LiquidityRangeIF, b: LiquidityRangeIF) =>
                        b.upperBoundInvPriceDecimalCorrected -
                        a.upperBoundInvPriceDecimalCorrected,
                );
            if (isDenomBase) {
                const minLowerBoundInvPriceDecimalCorrected = d3.min(
                    data,
                    (d: LiquidityRangeIF) =>
                        d.upperBoundInvPriceDecimalCorrected,
                );

                const cumBidLiq = data.find(
                    (liqData: LiquidityRangeIF) =>
                        minLowerBoundInvPriceDecimalCorrected ===
                        liqData.upperBoundInvPriceDecimalCorrected,
                )?.activeLiq;

                data.push({
                    ...data[0],
                    cumBidLiq: cumBidLiq,
                    upperBoundInvPriceDecimalCorrected:
                        liquidityData.liqTransitionPointforCurve,
                });

                return data.sort(
                    (a: LiquidityRangeIF, b: LiquidityRangeIF) =>
                        b.upperBoundInvPriceDecimalCorrected -
                        a.upperBoundInvPriceDecimalCorrected,
                );
            } else {
                const minUpperBoundInvPriceDecimalCorrected = d3.min(
                    data,
                    (d: any) => d.upperBoundPriceDecimalCorrected,
                );

                const activeLiq = data.find(
                    (liqData: any) =>
                        minUpperBoundInvPriceDecimalCorrected ===
                        liqData.upperBoundPriceDecimalCorrected,
                )?.activeLiq;
                // data.push({
                //     ...data[0],
                //     activeLiq: activeLiq,
                //     upperBoundPriceDecimalCorrected:
                //         liquidityData.liqTransitionPointforCurve,
                // });

                return data.sort(
                    (a: any, b: any) =>
                        b.upperBoundPriceDecimalCorrected -
                        a.upperBoundPriceDecimalCorrected,
                );
            }

            return data;
        }
    }, [liqBoundary, isDenomBase]);

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

    const hoverDepthAskData = useMemo(
        () =>
            liqDepthDataAsk?.map((item) => {
                return {
                    activeLiq: liquidityData.depthLiquidityScale(
                        isDenomBase ? item.cumAskLiq : item.cumBidLiq,
                    ),
                    liqPrices: isDenomBase
                        ? item.lowerBoundInvPriceDecimalCorrected
                        : item.upperBoundPriceDecimalCorrected,
                };
            }),
        [liqDepthDataAsk, isDenomBase],
    );

    const hoverDepthBidData = useMemo(
        () =>
            liqDepthDataBid?.map((item) => {
                return {
                    activeLiq: liquidityData.depthLiquidityScale(
                        isDenomBase ? item.cumBidLiq : item.cumAskLiq,
                    ),
                    liqPrices: isDenomBase
                        ? item.upperBoundInvPriceDecimalCorrected
                        : item.lowerBoundPriceDecimalCorrected,
                };
            }),
        [liqDepthDataBid],
    );

    useEffect(() => {
        if (liqDataAsk !== undefined && liqDataBid !== undefined) {
            const liquidityScale = d3.scaleLinear();
            const liquidityDepthScale = d3.scaleLinear();

            const liquidityExtent = d3fc
                .extentLinear()
                .include([0])
                .accessors([
                    (d: any) =>
                        parseFloat(liquidityData.liquidityScale(d.activeLiq)),
                ]);

            liquidityScale.domain(
                liquidityExtent(liqDataAsk.concat(liqDataBid)),
            );

            const liquidityExtentDepth = d3fc
                .extentLinear()
                .include([0])
                .accessors([
                    (d: any) => {
                        return parseFloat(
                            liquidityData.depthLiquidityScale(
                                d.cumAskLiq ? d.cumAskLiq : d.cumBidLiq,
                            ),
                        );
                    },
                ]);

            liquidityDepthScale.domain(
                liquidityExtentDepth(liqDepthDataAsk.concat(liqDepthDataBid)),
            );

            setLiquidityScale(() => liquidityScale);
            setLiquidityDepthScale(() => liquidityDepthScale);
        }
    }, [liqDataBid, liqDataAsk, liqDepthDataBid, liqDepthDataAsk]);

    const liqDataDepthBid = useMemo<LiquidityDataLocal[]>(() => {
        return tradeData.advancedMode
            ? liquidityData?.depthLiqBidData
            : liquidityData?.depthLiqBidData.filter(
                  (d: LiquidityDataLocal) =>
                      d.liqPrices <= liquidityData?.topBoundary,
              );
    }, [
        tradeData.advancedMode,
        liquidityData?.depthLiqBidData,
        liquidityData?.topBoundary,
    ]);

    const [liqAskSeries, setLiqAskSeries] = useState<any>();
    const [liqBidSeries, setLiqBidSeries] = useState<any>();

    const [lineAskSeries, setLineAskSeries] = useState<any>();
    const [lineBidSeries, setLineBidSeries] = useState<any>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineAskDepthSeries, setLineAskDepthSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [lineBidDepthSeries, setLineBidDepthSeries] = useState<any>();

    const [liquidityMouseMoveActive, setLiquidityMouseMoveActive] =
        useState<string>('none');

    useEffect(() => {
        if (
            scaleData !== undefined &&
            liquidityScale !== undefined &&
            liquidityDepthScale !== undefined
        ) {
            const liqAskSeries = createAreaSeriesLiquidity(
                liquidityData.liquidityScale,
                liquidityScale,
                scaleData.yScale,
                'ask',
                isDenomBase,
                d3.curveBasis,
                'curve',
            );
            setLiqAskSeries(() => liqAskSeries);

            const liqBidSeries = createAreaSeriesLiquidity(
                liquidityData.liquidityScale,
                liquidityScale,
                scaleData.yScale,
                'bid',
                isDenomBase,
                d3.curveBasis,
                'curve',
            );
            setLiqBidSeries(() => liqBidSeries);

            const d3CanvasLiqBidChartDepth = createAreaSeriesLiquidity(
                liquidityData.depthLiquidityScale,
                liquidityDepthScale,
                scaleData.yScale,
                'bid',
                isDenomBase,
                d3.curveStepAfter,
                'depth',
            );

            setLiqDepthBidSeries(() => d3CanvasLiqBidChartDepth);

            const d3CanvasLiqAskChartDepth = createAreaSeriesLiquidity(
                liquidityData.depthLiquidityScale,
                liquidityDepthScale,
                scaleData.yScale,
                'ask',
                isDenomBase,
                d3.curveStepBefore,
                'depth',
            );

            setLiqDepthAskSeries(() => d3CanvasLiqAskChartDepth);

            const d3CanvasLiqChartAskLine = createLineSeries(
                liquidityData.depthLiquidityScale,
                liquidityScale,
                scaleData.yScale,
                'ask',
                isDenomBase,
                d3.curveBasis,
                'curve',
            );
            setLineAskSeries(() => d3CanvasLiqChartAskLine);

            const d3CanvasLiqChartBidLine = createLineSeries(
                liquidityData.liquidityScale,
                liquidityScale,
                scaleData.yScale,
                'bid',
                isDenomBase,
                d3.curveBasis,
                'curve',
            );
            setLineBidSeries(() => d3CanvasLiqChartBidLine);

            const d3CanvasLiqBidChartDepthLine = createLineSeries(
                liquidityData.depthLiquidityScale,
                liquidityDepthScale,
                scaleData.yScale,
                'bid',
                isDenomBase,
                d3.curveStepAfter,
                'depth',
            );

            setLineBidDepthSeries(() => d3CanvasLiqBidChartDepthLine);

            const d3CanvasLiqAskChartDepthLine = createLineSeries(
                liquidityData.depthLiquidityScale,
                liquidityDepthScale,
                scaleData.yScale,
                'ask',
                isDenomBase,
                d3.curveStepBefore,
                'depth',
            );

            setLineAskDepthSeries(() => d3CanvasLiqAskChartDepthLine);
        }
    }, [scaleData, liquidityScale, pool, liquidityDepthScale, isDenomBase]);

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

    const clipHighlightedLines = (canvas: HTMLCanvasElement) => {
        const _low = ranges.filter(
            (target: lineValue) => target.name === 'Min',
        )[0].value;
        const _high = ranges.filter(
            (target: lineValue) => target.name === 'Max',
        )[0].value;

        const low = _low > _high ? _high : _low;
        const high = _low > _high ? _low : _high;

        if (scaleData) {
            clipCanvas(scaleData?.yScale(low), scaleData?.yScale(high), canvas);
        }
    };

    useEffect(() => {
        setHighlightedAreaCurveAskSeries(() => liqAskSeries);
        setHighlightedAreaCurveBidSeries(() => liqBidSeries);

        setHighlightedAreaDepthBidSeries(() => liqDepthBidSeries);
        setHighlightedAreaDepthAskSeries(() => liqDepthAskSeries);
    }, [liqAskSeries, liqBidSeries, liqDepthBidSeries, liqDepthAskSeries]);

    const drawCurveLines = (canvas: HTMLCanvasElement) => {
        const isRange =
            location.pathname.includes('pool') ||
            location.pathname.includes('reposition');
        if (isRange) {
            clipHighlightedLines(canvas);
            lineAskSeries(liqDataAsk);
            lineBidSeries(liqDataBid);
        }
    };

    const drawDepthLines = (canvas: HTMLCanvasElement) => {
        const isRange =
            location.pathname.includes('pool') ||
            location.pathname.includes('reposition');
        if (isRange) {
            clipHighlightedLines(canvas);
            lineAskDepthSeries(liqDepthDataAsk);
            lineBidDepthSeries(liqDepthDataBid);
        }
    };

    const findLiqNearest = (liqDataAll: any[]): nearestLiquidity => {
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

    const liqDataHover = (event: MouseEvent<HTMLDivElement>) => {
        if (
            scaleData !== undefined &&
            liquidityDepthScale !== undefined &&
            liquidityScale !== undefined
        ) {
            const allData =
                liqMode === 'curve'
                    ? hoverBidData.concat(hoverAskData)
                    : hoverDepthBidData.concat(hoverDepthAskData);

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
                    allData,
                    function (d: LiquidityHoverData) {
                        return d.activeLiq;
                    },
                );

                const canvas = d3
                    .select(d3CanvasLiq.current)
                    .select('canvas')
                    .node() as HTMLCanvasElement;

                const rect = canvas.getBoundingClientRect();

                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;
                const currentDataY = scaleData?.yScale.invert(y);
                const currentDataX =
                    liqMode === 'depth'
                        ? liquidityDepthScale.invert(x)
                        : liquidityScale.invert(x);

                const bidMinBoudnary = d3.min(
                    hoverBidData,
                    (d: LiquidityHoverData) => d.liqPrices,
                );
                const bidMaxBoudnary = d3.max(
                    hoverBidData,
                    (d: LiquidityHoverData) => d.liqPrices,
                );

                const askMinBoudnary = d3.min(
                    hoverAskData,
                    (d: LiquidityHoverData) => d.liqPrices,
                );
                const askMaxBoudnary = d3.max(
                    hoverAskData,
                    (d: LiquidityHoverData) => d.liqPrices,
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
        }
    };

    useEffect(() => {
        if (liquidityData !== undefined && liquidityData.allData) {
            const barThreshold =
                poolPriceDisplay !== undefined ? poolPriceDisplay : 0;

            const liqBoundaryData = liquidityData.allData.find((liq: any) => {
                return isDenomBase
                    ? liq.upperBoundInvPriceDecimalCorrected < barThreshold &&
                          liq.lowerBoundInvPriceDecimalCorrected !== '-inf'
                    : liq.upperBoundPriceDecimalCorrected > barThreshold &&
                          liq.upperBoundPriceDecimalCorrected !== '+inf';
            });

            const liqBoundaryArg =
                liqBoundaryData !== undefined
                    ? isDenomBase
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
        liquidityData,
        isDenomBase,
        poolPriceDisplay !== undefined && poolPriceDisplay > 0,
    ]);

    useEffect(() => {
        const canvas = d3
            .select(d3CanvasLiq.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');
        if (scaleData && liquidityDepthScale && liquidityScale) {
            d3.select(d3CanvasLiq.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);
                    if (liqMode === 'curve' && liqBoundary) {
                        liqBidSeries(liqDataBid);
                        liqAskSeries(liqDataAsk);
                        drawCurveLines(canvas);
                    }
                    if (liqMode === 'depth') {
                        liqDepthBidSeries(liqDepthDataBid);
                        liqDepthAskSeries(liqDepthDataAsk);
                        drawDepthLines(canvas);
                    }
                })
                .on('measure', (event: CustomEvent) => {
                    liquidityScale.range([
                        event.detail.width,
                        (event.detail.width / 10) * 6,
                    ]);

                    liquidityDepthScale.range([
                        event.detail.width,
                        event.detail.width * 0.5,
                    ]);
                    scaleData?.yScale.range([event.detail.height, 0]);
                    liqAskSeries.context(ctx);
                    liqBidSeries.context(ctx);
                    liqDepthBidSeries.context(ctx);
                    liqDepthAskSeries.context(ctx);
                    lineAskSeries.context(ctx);
                    lineBidSeries.context(ctx);
                    lineAskDepthSeries.context(ctx);
                    lineBidDepthSeries.context(ctx);
                });
        }
    }, [
        liqDepthDataAsk,
        liqAskSeries,
        liqBidSeries,
        liqDataAsk,
        liqDataBid,
        liqDepthDataAsk,
        liqDepthDataBid,
        tradeData.advancedMode,
        liqDepthBidSeries,
        liqDepthAskSeries,
        liquidityScale,
        liquidityDepthScale,
        liqMode,
        location.pathname,
        ranges,
        lineAskSeries,
        lineBidSeries,
        lineAskDepthSeries,
        lineBidDepthSeries,
        isDenomBase,
        liqBoundary,
    ]);

    useEffect(() => {
        const threshold =
            liqMode === 'curve'
                ? liquidityData?.liqTransitionPointforCurve
                : liquidityData?.liqTransitionPointforDepth;
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
                        const offsetY =
                            chartMousemoveEvent.clientY - rectCanvas.top;

                        if (liquidityMouseMoveActive === 'ask') {
                            clipCanvas(
                                offsetY,
                                scaleData?.yScale(threshold),
                                canvas,
                            );

                            if (liqMode === 'curve') {
                                highlightedAreaCurveAskSeries(liqDataAsk);
                            }
                            if (liqMode === 'depth') {
                                highlightedAreaDepthAskSeries(liqDepthDataAsk);
                            }
                        }
                        if (liquidityMouseMoveActive === 'bid') {
                            clipCanvas(
                                scaleData?.yScale(threshold),
                                offsetY,
                                canvas,
                            );
                            if (liqMode === 'curve') {
                                highlightedAreaCurveBidSeries(liqDataBid);
                            }

                            if (liqMode === 'depth') {
                                highlightedAreaDepthBidSeries(liqDepthDataBid);
                            }
                        }
                    }
                })
                .on('measure', () => {
                    highlightedAreaCurveAskSeries.context(ctx);
                    highlightedAreaCurveBidSeries.context(ctx);
                    highlightedAreaDepthAskSeries.context(ctx);
                    highlightedAreaDepthBidSeries.context(ctx);
                });
        }
    }, [
        highlightedAreaCurveAskSeries,
        highlightedAreaCurveBidSeries,
        highlightedAreaDepthBidSeries,
        highlightedAreaDepthAskSeries,
        liquidityMouseMoveActive,
        chartMousemoveEvent,
        liqDataAsk,
        liqDataDepthBid,
        liqDepthDataAsk,
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
                    liqDataAsk.map((liqData: LiquidityRangeIF) => {
                        if (
                            getAskPriceValue(liqData) >
                            getAskPriceValue(liqTooltipSelectedLiqBar)
                        ) {
                            liqTextData.totalValue =
                                liqTextData.totalValue +
                                liqData?.deltaAverageUSD;
                        }
                    });
                } else {
                    liqDataBid.map((liqData: LiquidityRangeIF) => {
                        if (
                            getBidPriceValue(liqData) <
                            getBidPriceValue(liqTooltipSelectedLiqBar)
                        ) {
                            liqTextData.totalValue =
                                liqTextData.totalValue +
                                liqData?.deltaAverageUSD;
                        }
                    });
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
        isDenomBase,
    ]);

    const bidAreaFunc = (event: MouseEvent) => {
        if (scaleData) {
            const canvas = d3
                .select(d3CanvasLiq.current)
                .select('canvas')
                .node() as HTMLCanvasElement;

            const rect = canvas.getBoundingClientRect();
            const leftSpaceRelativeToMainCanvas =
                mainCanvasBoundingClientRect.left;
            const offsetY = event.clientY - rect.top;
            const offsetX = event.clientX - leftSpaceRelativeToMainCanvas;

            currentPriceData[0] = {
                value: poolPriceDisplay !== undefined ? poolPriceDisplay : 0,
            };

            const mousePosition = scaleData?.yScale.invert(offsetY);

            const minBidPriceValue = d3.min(liqDataBid, (d: LiquidityRangeIF) =>
                getBidPriceValue(d),
            );

            let closest = liqDataBid.find((item: LiquidityRangeIF) => {
                return getBidPriceValue(item) === minBidPriceValue;
            });

            if (closest !== undefined) {
                liqDataBid.map((data: LiquidityRangeIF) => {
                    if (closest) {
                        const liqPrice = getBidPriceValue(data);
                        const closestLiqPrice = getBidPriceValue(closest);

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
                    .style('top', event.pageY - 80 + 'px')
                    .style('left', offsetX - 80 + 'px');
            }
        }
    };

    const getAskPriceValue = (data: LiquidityRangeIF) => {
        if (isDenomBase) {
            return data.lowerBoundInvPriceDecimalCorrected;
        } else {
            return data.upperBoundPriceDecimalCorrected;
        }
    };

    const getBidPriceValue = (data: LiquidityRangeIF) => {
        if (isDenomBase) {
            return data.upperBoundInvPriceDecimalCorrected;
        } else {
            return data.lowerBoundPriceDecimalCorrected;
        }
    };

    const askAreaFunc = (event: MouseEvent) => {
        if (scaleData) {
            const canvas = d3
                .select(d3CanvasLiq.current)
                .select('canvas')
                .node() as HTMLCanvasElement;

            const rect = canvas.getBoundingClientRect();
            const leftSpaceRelativeToMainCanvas =
                mainCanvasBoundingClientRect.left;
            const offsetY = event.clientY - rect.top;
            const offsetX = event.clientX - leftSpaceRelativeToMainCanvas;

            currentPriceData[0] = {
                value: poolPriceDisplay !== undefined ? poolPriceDisplay : 0,
            };

            const mousePosition = scaleData?.yScale.invert(offsetY);
            const maxAskPriceValue = d3.max(liqDataAsk, (d: LiquidityRangeIF) =>
                getAskPriceValue(d),
            );

            let closest = liqDataAsk.find((item: LiquidityRangeIF) => {
                return getAskPriceValue(item) === maxAskPriceValue;
            });

            if (closest !== undefined) {
                liqDataAsk.map((data: LiquidityRangeIF) => {
                    if (closest) {
                        const liqPrice = getAskPriceValue(data);
                        const closestLiqPrice = getAskPriceValue(closest);

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
                    .style(
                        'top',
                        event.pageY -
                            mainCanvasBoundingClientRect.top +
                            50 +
                            'px',
                    )
                    .style('left', offsetX - 80 + 'px');
            }
        }
    };

    useEffect(() => {
        if (hoverDepthAskData && hoverDepthBidData) {
            const liqDataAll = hoverDepthAskData.concat(hoverDepthBidData);
            try {
                if (liqDataAll && liqDataAll.length === 0) return;
                const { min, max }: nearestLiquidity =
                    findLiqNearest(liqDataAll);
                if (min !== undefined && max !== undefined) {
                    const visibleDomain = liqDataAll.filter(
                        (liqData: LiquidityHoverData) =>
                            liqData?.liqPrices >= min &&
                            liqData?.liqPrices <= max,
                    );

                    const maxLiq = d3.max(
                        visibleDomain,
                        (d: LiquidityHoverData) => d.activeLiq,
                    );
                    if (maxLiq && maxLiq !== 1 && liquidityDepthScale) {
                        liquidityDepthScale.domain([0, maxLiq]);

                        console.log({ maxLiq });

                        renderCanvasArray([d3CanvasLiq]);
                    }
                }
            } catch (error) {
                console.error({ error });
            }
        }
    }, [
        diffHashSigScaleData(scaleData, 'y'),
        liquidityData?.depthLiqAskData,
        liquidityData?.depthLiqBidData,
        hoverDepthAskData,
        hoverDepthBidData,
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
        isDenomBase,
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
    }, [diffHashSig(liquidityData), ranges, liqMode, location.pathname]);

    return (
        <>
            <d3fc-canvas
                ref={d3CanvasLiqHover}
                style={{
                    position: 'relative',
                    width: '20%',
                    marginLeft: '80%',
                }}
            ></d3fc-canvas>
            <d3fc-canvas
                ref={d3CanvasLiq}
                style={{
                    position: 'relative',
                    width: '20%',
                    marginLeft: '80%',
                }}
            ></d3fc-canvas>
        </>
    );
}
