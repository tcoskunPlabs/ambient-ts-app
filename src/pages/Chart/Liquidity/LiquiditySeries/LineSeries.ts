import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import { LiquidityRangeIF } from '../../../../App/functions/fetchPoolLiquidity';
import { getActiveLiqDepth } from './AreaSeries';
const lineSellColor = 'rgba(115, 113, 252)';
const lineBuyColor = 'rgba(205, 193, 255)';

export function createLineSeries(
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
        .seriesCanvasLine()
        .orient('horizontal')
        .curve(curve)
        .mainValue((d: LiquidityRangeIF) =>
            liqScale(getActiveLiqDepth(d, curveType, isDenomBase)),
        )
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
        .yScale(yScale)
        .decorate((context: CanvasRenderingContext2D) => {
            if (liqType === 'bid') {
                context.strokeStyle = lineSellColor;
            }
            if (liqType === 'ask') {
                context.strokeStyle = lineBuyColor;
            }
        });
}
