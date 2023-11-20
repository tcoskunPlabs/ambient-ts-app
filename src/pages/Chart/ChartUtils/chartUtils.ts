// eslint-disable-next-line quotes
import {
    DetailedHTMLProps,
    HTMLAttributes,
    MouseEvent,
    MutableRefObject,
} from 'react';
import * as d3 from 'd3';
import { LiquidityDataLocal } from '../../Trade/TradeCharts/TradeCharts';
import { CandleData } from '../../../App/functions/fetchCandleSeries';
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'd3fc-group': DetailedHTMLProps<
                HTMLAttributes<HTMLDivElement>,
                HTMLDivElement
            >;
            'd3fc-svg': DetailedHTMLProps<
                HTMLAttributes<HTMLDivElement>,
                HTMLDivElement
            >;
            'd3fc-canvas': DetailedHTMLProps<
                HTMLAttributes<HTMLCanvasElement | HTMLDivElement>,
                HTMLCanvasElement | HTMLDivElement
            >;
        }
    }
}

export const CHART_ANNOTATIONS_LS_KEY = 'chart_annotations';
export const defaultCandleBandwith = 5;

export type chartAnnotationData = {
    isOpenAnnotationPanel: boolean;
    drawnShapes: drawDataHistory[];
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type lineData = { x: number; y: number; denomInBase: boolean };
export type poolDataChart = {
    poolIndex: number;
    tokenA: string;
    tokenB: string;
    isTokenABase: boolean;
    denomInBase: boolean;
};
export type drawDataHistory = {
    data: lineData[];
    type: string;
    time: number;
    pool: poolDataChart;
    color: string;
    background: string;
    lineWidth: number;
    style: number[];
    showGuideLine: boolean;
    showBorder: boolean;
    showBackground: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extraData: Array<any>;
};
export type bandLineData = {
    fromValue: number;
    toValue: number;
    denomInBase: boolean;
};
export type selectedDrawnData = {
    data: drawDataHistory;
    selectedCircle: lineData | undefined;
};

export interface CandleDataChart extends CandleData {
    isFakeData: boolean;
}

export type ShareableChartData = {
    liqMode: string;
    timeframe: number;
    showTvl: boolean;
    showFeeRate: boolean;
    showVolume: boolean;
    drawData: drawDataHistory[] | undefined;
};

export type liquidityChartData = {
    liqAskData: LiquidityDataLocal[];
    liqBidData: LiquidityDataLocal[];
    depthLiqBidData: LiquidityDataLocal[];
    depthLiqAskData: LiquidityDataLocal[];
    topBoundary: number;
    lowBoundary: number;
    liqTransitionPointforCurve: number;
    liqTransitionPointforDepth: number;
};

export type scaleData = {
    xScale: d3.ScaleLinear<number, number>;
    xScaleTime: d3.ScaleTime<number, number>;
    yScale: d3.ScaleLinear<number, number>;
    volumeScale: d3.ScaleLinear<number, number>;
    xExtent: [number, number];
};

export type crosshair = {
    x: number | Date;
    y: number | string;
};
export type chartItemStates = {
    showTvl: boolean;
    showVolume: boolean;
    showFeeRate: boolean;
    liqMode: string;
};

export type lineValue = {
    name: string;
    value: number;
};

export interface SubChartValue {
    name: string;
    value: number | undefined;
}

export type zoomUtils = {
    zoom: d3.ZoomBehavior<Element, unknown>;
    xAxisZoom: d3.ZoomBehavior<Element, unknown>;
};

export const fibLevels = [
    { level: 0, active: true, color: '#787b86' },
    { level: 0.236, active: true, color: '#f23645' },
    { level: 0.382, active: true, color: '#ff9800' },
    { level: 0.5, active: true, color: '#4caf50' },
    { level: 0.618, active: true, color: '#089981' },
    { level: 0.786, active: true, color: '#00bcd4' },
    { level: 1, active: true, color: '#787b86' },
    { level: 1.272, active: false, color: '#ff9800' },
    { level: 1.414, active: false, color: '#f23645' },
    { level: 1.618, active: true, color: '#2962ff' },
    { level: 2, active: false, color: '#089981' },
    { level: 2.272, active: false, color: '#ff9800' },
    { level: 2.414, active: false, color: '#4caf50' },
    { level: 2.618, active: true, color: '#f23645' },
    { level: 3, active: false, color: '#00bcd4' },
    { level: 3.272, active: false, color: '#787b86' },
    { level: 3.414, active: false, color: '#2962ff' },
    { level: 3.618, active: true, color: '#9c27b0' },
    { level: 4, active: false, color: '#f23645' },
    { level: 4.236, active: true, color: '#e91e63' },
    { level: 4.272, active: false, color: '#9c27b0' },
    { level: 4.414, active: false, color: '#e91e63' },
    { level: 4.618, active: false, color: '#ff9800' },
    { level: 4.764, active: false, color: '#089981' },
];

export function setCanvasResolution(canvas: HTMLCanvasElement) {
    const ratio = window.devicePixelRatio < 1 ? 1 : window.devicePixelRatio;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    if (canvas !== null) {
        const width = canvas.width;
        const height = canvas.height;
        canvas.width = width * ratio;
        canvas.height = height * ratio;

        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        context.scale(ratio, ratio);
    }
}

export function renderCanvasArray(
    canvasArray: MutableRefObject<HTMLDivElement | HTMLCanvasElement | null>[],
) {
    canvasArray.forEach((canvas) => {
        if (canvas && canvas.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const container = d3.select(canvas.current).node() as any;
            if (container) container.requestRedraw();
        }
    });
}

export const renderSubchartCrCanvas = () => {
    const feeRateCrCanvas = d3
        .select('#fee_rate_chart')
        .select('#d3CanvasCrosshair');

    if (feeRateCrCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nd = feeRateCrCanvas.node() as any;
        if (nd) nd.requestRedraw();
    }

    const tvlCrCanvas = d3.select('#tvl_chart').select('#d3CanvasCrosshair');

    if (tvlCrCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nd = tvlCrCanvas.node() as any;
        if (nd) nd.requestRedraw();
    }

    const tvlYaxisCanvas = d3.select('#tvl_chart').select('#y-axis-canvas_tvl');

    if (tvlYaxisCanvas) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nd = tvlYaxisCanvas.node() as any;
        if (nd) nd.requestRedraw();
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function standardDeviation(arr: any, usePopulation = false) {
    const mean =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        arr.reduce((acc: any, val: any) => acc + val, 0) / arr.length;
    return Math.sqrt(
        arr
            .reduce(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (acc: any, val: any) => acc.concat((val - mean) ** 2),
                [],
            )
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .reduce((acc: any, val: any) => acc + val, 0) /
            (arr.length - (usePopulation ? 0 : 1)),
    );
}

export function fillLiqAdvanced(
    standardDeviation: number,
    scaleData: scaleData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    liquidityData: any,
) {
    const border = scaleData?.yScale.domain()[1];

    const filledTickNumber = Math.min(border / standardDeviation, 150);

    standardDeviation =
        filledTickNumber === 150
            ? (border - liquidityData?.liqBidData[0]?.liqPrices) / 150
            : standardDeviation;

    if (scaleData !== undefined) {
        if (
            border + standardDeviation >=
            liquidityData?.liqBidData[0]?.liqPrices
        ) {
            for (let index = 0; index < filledTickNumber; index++) {
                liquidityData?.liqBidData.unshift({
                    activeLiq: 30,
                    liqPrices:
                        liquidityData?.liqBidData[0]?.liqPrices +
                        standardDeviation,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                });

                liquidityData?.depthLiqBidData.unshift({
                    activeLiq: liquidityData?.depthLiqBidData[1]?.activeLiq,
                    liqPrices:
                        liquidityData?.depthLiqBidData[0]?.liqPrices +
                        standardDeviation,
                    deltaAverageUSD: 0,
                    cumAverageUSD: 0,
                });
            }
        }
    }
}

export function formatTimeDifference(startDate: Date, endDate: Date): string {
    const timeDifference = endDate.getTime() - startDate.getTime();
    const secondsDifference = Math.floor(timeDifference / 1000);

    const days = Math.floor(secondsDifference / 86400);
    const hours = Math.floor((secondsDifference % 86400) / 3600);
    const minutes = Math.floor((secondsDifference % 3600) / 60);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else {
        return `${hours}h ${minutes}m`;
    }
}

export function calculateFibRetracement(
    lineData: lineData[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fibLevels: Array<any>,
) {
    const retracementIsUp = lineData[0].y > lineData[1].y;

    const pointLevel = lineData[1].y;
    const secondLevel = lineData[0].y;

    const diff = Math.abs(pointLevel - secondLevel);

    const fibLineData: Array<
        {
            x: number;
            y: number;
            denomInBase: boolean;
            color: string;
            level: number;
        }[]
    > = [];

    fibLevels.forEach((level) => {
        if (level.active) {
            fibLineData.push([
                {
                    x: lineData[0].x,
                    y:
                        pointLevel +
                        diff * level.level * (retracementIsUp ? 1 : -1),
                    denomInBase: lineData[0].denomInBase,
                    color: level.color,
                    level: level.level,
                },
                {
                    x: lineData[1].x,
                    y:
                        pointLevel +
                        diff * level.level * (retracementIsUp ? 1 : -1),
                    denomInBase: lineData[0].denomInBase,
                    color: level.color,
                    level: level.level,
                },
            ]);
        }
    });

    fibLineData.sort((a, b) =>
        retracementIsUp ? a[0].y - b[0].y : b[0].y - a[0].y,
    );

    return fibLineData;
}

export function calculateFibRetracementBandAreas(
    lineData: lineData[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fibLevels: Array<any>,
) {
    const retracementIsUp = lineData[0].y > lineData[1].y;

    const pointLevel = lineData[1].y;
    const secondLevel = lineData[0].y;

    const diff = Math.abs(pointLevel - secondLevel);

    const fibLineData: Array<{
        fromValue: number;
        toValue: number;
        denomInBase: boolean;
        color: string;
    }> = [];

    const activeFibLevels = fibLevels.filter((level) => level.active);

    activeFibLevels.reduce((prev, curr) => {
        if (curr.active) {
            fibLineData.push({
                fromValue:
                    pointLevel + diff * prev.level * (retracementIsUp ? 1 : -1),
                toValue:
                    pointLevel + diff * curr.level * (retracementIsUp ? 1 : -1),
                denomInBase: lineData[0].denomInBase,
                color: curr.color,
            });
        }

        return curr;
    });

    fibLineData.sort((a, b) =>
        retracementIsUp ? a.fromValue - b.fromValue : b.fromValue - a.fromValue,
    );

    return fibLineData;
}

export function getXandYLocationForChart(
    event: MouseEvent<HTMLDivElement>,
    rect: DOMRect,
) {
    let offsetY = event.clientY - rect?.top;
    let offsetX = event.clientX - rect?.left;

    if (event instanceof TouchEvent) {
        offsetY = event.targetTouches[0].clientY - rect?.top;
        offsetX = event.targetTouches[0].clientX - rect?.left;
    }

    return { offsetX: offsetX, offsetY: offsetY };
}
