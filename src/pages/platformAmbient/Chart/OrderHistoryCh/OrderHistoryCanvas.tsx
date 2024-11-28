import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { useContext, useEffect, useRef, useState } from 'react';
import {
    bandLineData,
    lineData,
    renderCanvasArray,
    scaleData,
    setCanvasResolution,
} from '../ChartUtils/chartUtils';
import { createCircle } from '../ChartUtils/circle';
import { createLinearLineSeries } from '../Draw/DrawCanvas/LinearLineSeries';
import { createBandArea } from '../Draw/DrawCanvas/BandArea';
import { diffHashSig } from '../../../../ambient-utils/dataLayer';
import { TransactionIF } from '../../../../ambient-utils/types';
import { BrandContext } from '../../../../contexts/BrandContext';
import { GraphDataContext } from '../../../../contexts';

interface OrderHistoryCanvasProps {
    scaleData: scaleData;
    denomInBase: boolean;
    showSwap: boolean;
    showLiquidity: boolean;
    showHistorical: boolean;
    hoveredOrderHistory: TransactionIF | undefined;
    isHoveredOrderHistory: boolean;
    selectedOrderHistory: TransactionIF | undefined;
    isSelectedOrderHistory: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    drawSettings: any;
    userTransactionData: TransactionIF[] | undefined;
    circleScale: d3.ScaleLinear<number, number>;
}

export default function OrderHistoryCanvas(props: OrderHistoryCanvasProps) {
    const {
        scaleData,
        denomInBase,
        showSwap,
        showLiquidity,
        showHistorical,
        hoveredOrderHistory,
        isHoveredOrderHistory,
        selectedOrderHistory,
        isSelectedOrderHistory,
        drawSettings,
        userTransactionData,
        circleScale,
    } = props;

    const d3OrderCanvas = useRef<HTMLDivElement | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [bandArea, setBandArea] = useState<any>();
    // const [bandAreaHighlighted, setBandAreaHighlighted] = useState<any>();

    const { platformName } = useContext(BrandContext);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [circleSeries, setCircleSeries] = useState<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [limitCircleSeries, setLimitCircleSeries] = useState<any>();
    const [circleSeriesHighlighted, setCircleSeriesHighlighted] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useState<any>();

    const lineSeries = createLinearLineSeries(
        scaleData?.xScale,
        scaleData?.yScale,
        denomInBase,
        drawSettings['Brush'].line,
    );

    const liquidityLineSeries = createLinearLineSeries(
        scaleData?.xScale,
        scaleData?.yScale,
        denomInBase,
        { color: 'rgba(95, 255, 242, 0.7)', lineWidth: 1.5, dash: [0, 0] },
    );

    const triangleLimit = d3fc
        .seriesCanvasPoint()
        .xScale(scaleData.xScale)
        .yScale(scaleData.yScale)
        /* eslint-disable @typescript-eslint/no-explicit-any */
        .crossValue((d: any) => d.x)
        /* eslint-disable @typescript-eslint/no-explicit-any */
        .mainValue((d: any) => d.y)
        .size(90)
        .type(d3.symbolTriangle);

    function createScaleForBandArea(x: number, x2: number) {
        const newXScale = scaleData?.xScale.copy();

        newXScale.range([scaleData?.xScale(x), scaleData?.xScale(x2)]);

        return newXScale;
    }

    const { userLimitOrdersByPool, userPositionsByPool } =
        useContext(GraphDataContext);

    useEffect(() => {
        if (userTransactionData && circleScale && scaleData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const circleSerieArray: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const limitCircleSerieArray: any[] = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bandAreaArray: any[] = [];
            if (showHistorical) {
                userLimitOrdersByPool.limitOrders.forEach(
                    (limitOrder, index) => {
                        if (limitOrder.claimableLiq > 0) {
                            const circleSerie = createCircle(
                                scaleData?.xScale,
                                scaleData?.yScale,
                                circleScale(limitOrder.totalValueUSD),
                                1,
                                denomInBase,
                                false,
                                false,
                                (denomInBase && !limitOrder.isBid) ||
                                    (!denomInBase && limitOrder.isBid),
                                '--accent2',
                                ['futa'].includes(platformName)
                                    ? '--negative'
                                    : '--accent4',
                            );

                            limitCircleSerieArray.push({
                                serie: circleSerie,
                                index: index,
                            });
                        }
                    },
                );

                setLimitCircleSeries(() => {
                    return limitCircleSerieArray;
                });
            }

            if (showSwap) {
                userTransactionData.forEach((order) => {
                    const circleSerie = createCircle(
                        scaleData?.xScale,
                        scaleData?.yScale,
                        circleScale(order.totalValueUSD),
                        1,
                        denomInBase,
                        false,
                        false,
                        (denomInBase && !order.isBuy) ||
                            (!denomInBase && order.isBuy),
                        '--accent1',
                        ['futa'].includes(platformName)
                            ? '--negative'
                            : '--accent5',
                    );

                    circleSerieArray.push(circleSerie);
                });

                setCircleSeries(() => {
                    return circleSerieArray;
                });

                setCircleSeriesHighlighted(() => {
                    return circleSerieArray;
                });
            }

            if (showLiquidity && userPositionsByPool) {
                userPositionsByPool.positions.forEach((order) => {
                    const newBandScale = createScaleForBandArea(
                        order?.timeFirstMint * 1000,
                        order?.latestUpdateTime * 1000,
                    );

                    const bandArea = createBandArea(
                        newBandScale,
                        scaleData?.yScale,
                        denomInBase,
                        { background: { color: 'rgba(95, 255, 242, 0.15)' } },
                    );

                    bandAreaArray.push(bandArea);
                });

                setBandArea(() => {
                    return bandAreaArray;
                });
            }
        }
    }, [
        userTransactionData,
        userPositionsByPool,
        userLimitOrdersByPool,
        circleScale,
        showHistorical,
        showSwap,
        showLiquidity,
        scaleData,
    ]);

    // useEffect(() => {
    //     if (
    //         hoveredOrderHistory &&
    //         scaleData &&
    //     ) {
    //         if (hoveredOrderHistory.orderType === 'liquidity') {
    //             const newBandScale = createScaleForBandArea(
    //                 hoveredOrderHistory?.tsStart.getTime() * 1000,
    //                 hoveredOrderHistory?.tsEnd.getTime() * 1000,
    //             );

    //             const bandArea = createBandArea(
    //                 newBandScale,
    //                 scaleData?.yScale,
    //                 denomInBase,
    //                 'rgba(95, 255, 242, 0.15)',
    //             );

    //             setBandAreaHighlighted(() => {
    //                 return bandArea;
    //             });
    //         }
    //     }
    // }, [userTransactionData, hoveredOrderHistory]);

    useEffect(() => {
        const canvas = d3
            .select(d3OrderCanvas.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        if (scaleData) {
            d3.select(d3OrderCanvas.current)
                .on('draw', () => {
                    setCanvasResolution(canvas);

                    // if (isHoveredOrderHistory && hoveredOrderHistory) {
                    //     if (
                    //         showLiquidity &&
                    //         liquidityLineSeries &&
                    //         bandAreaHighlighted !== undefined &&
                    //         hoveredOrderHistory.orderType === 'liquidity'
                    //     ) {
                    //         const highlightedLines: Array<lineData[]> = [[]];

                    //         highlightedLines.push(
                    //             [
                    //                 {
                    //                     x:
                    //                         hoveredOrderHistory.tsStart.getTime() *
                    //                         1000,
                    //                     y: hoveredOrderHistory.orderPrice,
                    //                     denomInBase: denomInBase,
                    //                 },
                    //                 {
                    //                     x:
                    //                         hoveredOrderHistory.tsEnd.getTime() *
                    //                         1000,
                    //                     y: hoveredOrderHistory.orderPrice,
                    //                     denomInBase: denomInBase,
                    //                 },
                    //             ],
                    //             [
                    //                 {
                    //                     x:
                    //                         hoveredOrderHistory.tsStart.getTime() *
                    //                         1000,
                    //                     y: hoveredOrderHistory.orderPriceCompleted,
                    //                     denomInBase: denomInBase,
                    //                 },
                    //                 {
                    //                     x:
                    //                         hoveredOrderHistory.tsEnd.getTime() *
                    //                         1000,
                    //                     y: hoveredOrderHistory.orderPriceCompleted,
                    //                     denomInBase: denomInBase,
                    //                 },
                    //             ],
                    //         );

                    //         highlightedLines.forEach((lineData) => {
                    //             liquidityLineSeries(lineData);

                    //             liquidityLineSeries.decorate(
                    //                 (context: CanvasRenderingContext2D) => {
                    //                     context.strokeStyle =
                    //                         'rgba(95, 255, 242, 0.6)';
                    //                 },
                    //             );
                    //         });

                    //         const range = [
                    //             scaleData?.xScale(
                    //                 hoveredOrderHistory?.tsStart.getTime() *
                    //                     1000,
                    //             ),
                    //             scaleData.xScale(
                    //                 hoveredOrderHistory?.tsEnd.getTime() * 1000,
                    //             ),
                    //         ];

                    //         bandAreaHighlighted.xScale().range(range);

                    //         const bandData = {
                    //             fromValue: hoveredOrderHistory.orderPrice,
                    //             toValue:
                    //                 hoveredOrderHistory.orderPriceCompleted,
                    //             denomInBase: denomInBase,
                    //         } as bandLineData;

                    //         bandAreaHighlighted([bandData]);
                    //     }
                    // }

                    if (showHistorical && userLimitOrdersByPool) {
                        userLimitOrdersByPool.limitOrders.forEach(
                            (limitOrder, index) => {
                                if (
                                    limitOrder.claimableLiq > 0 &&
                                    limitCircleSeries &&
                                    limitCircleSeries.length > 0
                                ) {
                                    const circleData = [
                                        {
                                            x: limitOrder.crossTime * 1000,
                                            y: denomInBase
                                                ? limitOrder.invLimitPriceDecimalCorrected
                                                : limitOrder.limitPriceDecimalCorrected,
                                            denomInBase: denomInBase,
                                        },
                                    ];

                                    limitCircleSeries.find((serie: any) => {
                                        if (serie.index === index) {
                                            serie.serie(circleData);
                                        }
                                    });
                                }

                                if (limitOrder.claimableLiq === 0) {
                                    const lineData: lineData[] = [];

                                    lineData.push({
                                        x: limitOrder.timeFirstMint * 1000,
                                        y: denomInBase
                                            ? limitOrder.invLimitPriceDecimalCorrected
                                            : limitOrder.limitPriceDecimalCorrected,
                                        denomInBase: denomInBase,
                                    });
                                    lineData.push({
                                        x:
                                            new Date().getTime() +
                                            5 * 86400 * 1000,
                                        y: denomInBase
                                            ? limitOrder.invLimitPriceDecimalCorrected
                                            : limitOrder.limitPriceDecimalCorrected,
                                        denomInBase: denomInBase,
                                    });

                                    lineSeries.decorate(
                                        (context: CanvasRenderingContext2D) => {
                                            context.setLineDash([4, 2]);
                                            context.strokeStyle =
                                                (denomInBase &&
                                                    !limitOrder.isBid) ||
                                                (!denomInBase &&
                                                    limitOrder.isBid)
                                                    ? 'rgba(115, 113, 252)'
                                                    : 'rgba(205, 193, 255)';
                                        },
                                    );

                                    lineSeries(lineData);

                                    if (ctx) ctx.setLineDash([0, 0]);

                                    ctx?.restore();

                                    if (triangleLimit) {
                                        triangleLimit.decorate(
                                            (
                                                context: CanvasRenderingContext2D,
                                            ) => {
                                                // context.setLineDash([0, 0]);
                                                const rotateDegree = 90;
                                                context.rotate(
                                                    (rotateDegree * Math.PI) /
                                                        180,
                                                );

                                                context.strokeStyle =
                                                    (denomInBase &&
                                                        !limitOrder.isBid) ||
                                                    (!denomInBase &&
                                                        limitOrder.isBid)
                                                        ? 'rgba(115, 113, 252)'
                                                        : 'rgba(205, 193, 255)';

                                                context.fillStyle =
                                                    (denomInBase &&
                                                        !limitOrder.isBid) ||
                                                    (!denomInBase &&
                                                        limitOrder.isBid)
                                                        ? 'rgba(115, 113, 252)'
                                                        : 'rgba(205, 193, 255)';
                                            },
                                        );

                                        triangleLimit([
                                            {
                                                x:
                                                    limitOrder.timeFirstMint *
                                                    1000,
                                                y: denomInBase
                                                    ? limitOrder.invLimitPriceDecimalCorrected
                                                    : limitOrder.limitPriceDecimalCorrected,
                                            },
                                        ]);
                                    }
                                }
                            },
                        );
                    }

                    if (showSwap && userTransactionData) {
                        userTransactionData.forEach((order, index) => {
                            if (
                                circleSeries &&
                                circleSeries.length > 0 &&
                                order.entityType === 'swap'
                            ) {
                                const circleData = [
                                    {
                                        x: order.txTime * 1000,
                                        y: denomInBase
                                            ? order.swapInvPriceDecimalCorrected
                                            : order.swapPriceDecimalCorrected,
                                        denomInBase: denomInBase,
                                    },
                                ];

                                circleSeries[index](circleData);

                                if (
                                    hoveredOrderHistory &&
                                    isHoveredOrderHistory &&
                                    circleSeriesHighlighted.length > 0 &&
                                    hoveredOrderHistory.entityType === 'swap' &&
                                    hoveredOrderHistory.txId === order.txId &&
                                    (selectedOrderHistory === undefined ||
                                        hoveredOrderHistory.txId !==
                                            selectedOrderHistory.txId)
                                ) {
                                    const circleDataHg = [
                                        {
                                            x:
                                                hoveredOrderHistory.txTime *
                                                1000,
                                            y: denomInBase
                                                ? order.swapInvPriceDecimalCorrected
                                                : order.swapPriceDecimalCorrected,
                                            denomInBase: denomInBase,
                                        },
                                    ];

                                    circleSeriesHighlighted[index](
                                        circleDataHg,
                                    );
                                }

                                if (
                                    selectedOrderHistory &&
                                    isSelectedOrderHistory &&
                                    circleSeriesHighlighted.length > 0 &&
                                    selectedOrderHistory.entityType ===
                                        'swap' &&
                                    selectedOrderHistory.txId === order.txId
                                ) {
                                    const circleDataHg = [
                                        {
                                            x:
                                                selectedOrderHistory.txTime *
                                                1000,
                                            y: denomInBase
                                                ? order.swapInvPriceDecimalCorrected
                                                : order.swapPriceDecimalCorrected,
                                            denomInBase: denomInBase,
                                        },
                                    ];

                                    circleSeriesHighlighted[index](
                                        circleDataHg,
                                    );
                                }
                            }
                        });
                    }

                    if (userPositionsByPool && showLiquidity) {
                        userPositionsByPool.positions.forEach(
                            (order, index) => {
                                if (bandArea && liquidityLineSeries) {
                                    const range = [
                                        scaleData?.xScale(
                                            order?.timeFirstMint * 1000,
                                        ),
                                        scaleData.xScale(
                                            order?.latestUpdateTime * 1000,
                                        ),
                                    ];

                                    if (bandArea[index] !== undefined) {
                                        bandArea[index].xScale().range(range);
                                    }

                                    const bandData = {
                                        fromValue: denomInBase
                                            ? order.bidTickInvPriceDecimalCorrected
                                            : order.bidTickPriceDecimalCorrected,
                                        toValue: denomInBase
                                            ? order.askTickInvPriceDecimalCorrected
                                            : order.askTickPriceDecimalCorrected,
                                        denomInBase: denomInBase,
                                    } as bandLineData;

                                    bandArea[index]([bandData]);

                                    const lineData: lineData[][] = [];

                                    lineData.push([
                                        {
                                            x: order.timeFirstMint * 1000,
                                            y: denomInBase
                                                ? order.askTickInvPriceDecimalCorrected
                                                : order.askTickPriceDecimalCorrected,
                                            denomInBase: denomInBase,
                                        },
                                        {
                                            x:
                                                (order.latestUpdateTime +
                                                    3600 * 4) *
                                                1000,
                                            y: denomInBase
                                                ? order.askTickInvPriceDecimalCorrected
                                                : order.askTickPriceDecimalCorrected,
                                            denomInBase: denomInBase,
                                        },
                                    ]);

                                    lineData.push([
                                        {
                                            x: order.timeFirstMint * 1000,
                                            y: denomInBase
                                                ? order.bidTickInvPriceDecimalCorrected
                                                : order.bidTickPriceDecimalCorrected,
                                            denomInBase: denomInBase,
                                        },
                                        {
                                            x:
                                                (order.latestUpdateTime +
                                                    3600 * 4) *
                                                1000,
                                            y: denomInBase
                                                ? order.bidTickInvPriceDecimalCorrected
                                                : order.bidTickPriceDecimalCorrected,
                                            denomInBase: denomInBase,
                                        },
                                    ]);

                                    lineData.forEach((line) => {
                                        liquidityLineSeries(line);
                                    });
                                }
                            },
                        );
                    }
                })
                .on('measure', () => {
                    if (lineSeries !== undefined) lineSeries.context(ctx);
                    if (triangleLimit !== undefined) triangleLimit.context(ctx);
                    if (liquidityLineSeries !== undefined)
                        liquidityLineSeries.context(ctx);
                    if (circleSeries !== undefined && circleSeries.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        circleSeries.forEach((element: any) => {
                            element.context(ctx);
                        });
                    }
                    if (
                        limitCircleSeries !== undefined &&
                        limitCircleSeries.length > 0
                    ) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        limitCircleSeries.forEach((element: any) => {
                            element.serie.context(ctx);
                        });
                    }
                    if (
                        circleSeriesHighlighted !== undefined &&
                        circleSeriesHighlighted.length > 0
                    ) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        circleSeriesHighlighted.forEach((element: any) => {
                            element.context(ctx);
                        });
                    }
                    if (bandArea !== undefined && bandArea.length > 0) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        bandArea.forEach((element: any) => {
                            element.context(ctx);
                        });
                    }
                    // if (bandAreaHighlighted !== undefined) {
                    //     bandAreaHighlighted.context(ctx);
                    // }
                });
        }

        renderCanvasArray([d3OrderCanvas]);
    }, [
        diffHashSig(userTransactionData),
        diffHashSig(userPositionsByPool),
        diffHashSig(userLimitOrdersByPool),
        lineSeries,
        triangleLimit,
        denomInBase,
        bandArea,
        circleSeries,
        limitCircleSeries,
        showHistorical,
        showLiquidity,
        showSwap,
        liquidityLineSeries,
        scaleData,
        // bandAreaHighlighted,
    ]);

    return <d3fc-canvas className='d3_order_canvas' ref={d3OrderCanvas} />;
}
