import { LiquidityDataLocal } from '../../../Trade/TradeCharts/TradeCharts';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { LiquidityRangeIF } from '../../../../App/functions/fetchPoolLiquidity';

const liqAskColor = 'rgba(205, 193, 255, 0.3)';
const liqBidColor = 'rgba(115, 113, 252, 0.3)';

export function getActiveLiqDepth(
    data: LiquidityRangeIF,
    type: 'depth' | 'curve',
    isDenomBase: boolean,
) {
    if (type === 'curve') {
        return data.activeLiq;
    } else {
        if (isDenomBase) {
            return data.cumBidLiq ? data.cumBidLiq : data.cumAskLiq;
        }

        return data.cumAskLiq ? data.cumAskLiq : data.cumBidLiq;
    }
}

export function createAreaSeries(
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    curve: any,
) {
    return d3fc
        .seriesCanvasArea()
        .orient('horizontal')
        .curve(curve)
        .decorate((context: CanvasRenderingContext2D) => {
            // context.fillStyle = 'transparent';
        })
        .mainValue((d: LiquidityDataLocal) => d.activeLiq)
        .crossValue((d: LiquidityDataLocal) => {
            return d.liqPrices;
        })
        .xScale(xScale)
        .yScale(yScale);
}

export function createAreaSeriesLiquidity(
    liqScale: d3.ScaleLinear<number, number>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    liqType: 'bid' | 'ask',
    isDenomBase: boolean,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    curve: any,
    curveType: 'curve' | 'depth',
) {
    return d3fc
        .seriesCanvasArea()
        .orient('horizontal')
        .curve(curve)
        .decorate((context: CanvasRenderingContext2D) => {
            if (liqType === 'bid') {
                context.fillStyle = liqBidColor;
            }
            if (liqType === 'ask') {
                context.fillStyle = liqAskColor;
            }
        })
        .mainValue((d: LiquidityRangeIF) => {
            return liqScale(getActiveLiqDepth(d, curveType, isDenomBase));
        })
        .crossValue((d: LiquidityRangeIF) => {
            if (liqType === 'bid') {
                return isDenomBase
                    ? d.upperBoundInvPriceDecimalCorrected
                    : d.lowerBoundPriceDecimalCorrected;
            }
            if (liqType === 'ask') {
                return isDenomBase
                    ? d.lowerBoundInvPriceDecimalCorrected
                    : d.upperBoundPriceDecimalCorrected;
            }
        })
        .xScale(xScale)
        .yScale(yScale);
}

export function createAreaSeriesLiquidityBid(
    liqScale: d3.ScaleLinear<number, number>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    curve: any,
    isDenomBase: boolean,
) {
    return d3fc
        .seriesCanvasArea()
        .orient('horizontal')
        .curve(curve)
        .decorate((context: CanvasRenderingContext2D) => {
            context.fillStyle = liqBidColor;
        })
        .mainValue((d: LiquidityRangeIF) => {
            return liqScale(d.activeLiq);
        })
        .crossValue((d: LiquidityRangeIF) => {
            return isDenomBase
                ? d.upperBoundInvPriceDecimalCorrected
                : d.lowerBoundPriceDecimalCorrected;
        })
        .xScale(xScale)
        .yScale(yScale);
}

export function createAreaSeriesLiquidityAsk(
    liqScale: d3.ScaleLinear<number, number>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    curve: any,
    isDenomBase: boolean,
) {
    return d3fc
        .seriesCanvasArea()
        .orient('horizontal')
        .curve(curve)
        .decorate((context: CanvasRenderingContext2D) => {
            context.fillStyle = liqAskColor;
        })
        .mainValue((d: LiquidityRangeIF) => liqScale(d.activeLiq))
        .crossValue((d: LiquidityRangeIF) =>
            isDenomBase
                ? d.lowerBoundInvPriceDecimalCorrected
                : d.upperBoundPriceDecimalCorrected,
        )
        .xScale(xScale)
        .yScale(yScale);
}

// export function decorateForLiquidityArea(
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     series: any,
//     threshold: number,
//     isDenomBase: boolean,
// ) {
//     series.decorate(
//         (context: CanvasRenderingContext2D, d: LiquidityRangeIF[]) => {
//             const liqPrice = isDenomBase
//                 ? d[0].lowerBoundInvPriceDecimalCorrected
//                 : d[0].upperBoundPriceDecimalCorrected;
//             if (liqPrice > threshold) {
//                 context.fillStyle = liqBidColor;
//             } else {
//                 context.fillStyle = liqAskColor;
//             }
//         },
//     );
// }
