// import { useContext, useMemo, useState } from 'react';
// import { filterCandleWithTransaction } from './ChartUtils/discontinuityScaleUtils';
// import { timeGapsValue } from './ChartUtils/chartUtils';
// import { CandleContext } from '../../contexts/CandleContext';
// import { diffHashSigChart } from '../../ambient-utils/dataLayer';

export default function ChartScale() {
    // const [timeGaps, setTimeGaps] = useState<timeGapsValue[]>([]);

    // const { candleData: unparsedData } = useContext(CandleContext);

    // const period = unparsedData?.duration;
    // const unparsedCandleData = useMemo(() => {
    //     if (unparsedData) {
    //         const data = filterCandleWithTransaction(
    //             unparsedData.candles,
    //             period,
    //         ).sort((a, b) => b.time - a.time);

    //         if (
    //             poolPriceWithoutDenom &&
    //             data &&
    //             data.length > 0 &&
    //             isShowLatestCandle
    //         ) {
    //             const closePriceWithDenom =
    //                 data[0].invPriceCloseExclMEVDecimalCorrected;
    //             const poolPriceWithDenom = 1 / poolPriceWithoutDenom;

    //             const fakeDataOpenWithDenom = closePriceWithDenom;

    //             const fakeDataCloseWithDenom = poolPriceWithDenom;

    //             const closePrice = data[0].priceCloseExclMEVDecimalCorrected;

    //             const fakeDataOpen = closePrice;

    //             const fakeDataClose = poolPriceWithoutDenom;

    //             const placeHolderCandle = {
    //                 time: data[0].time + period,
    //                 invMinPriceExclMEVDecimalCorrected: fakeDataOpenWithDenom,
    //                 maxPriceExclMEVDecimalCorrected: fakeDataOpen,
    //                 invMaxPriceExclMEVDecimalCorrected: fakeDataCloseWithDenom,
    //                 minPriceExclMEVDecimalCorrected: fakeDataClose,
    //                 invPriceOpenExclMEVDecimalCorrected: fakeDataOpenWithDenom,
    //                 priceOpenExclMEVDecimalCorrected: fakeDataOpen,
    //                 invPriceCloseExclMEVDecimalCorrected:
    //                     fakeDataCloseWithDenom,
    //                 priceCloseExclMEVDecimalCorrected: fakeDataClose,
    //                 period: period,
    //                 tvlData: {
    //                     time: data[0].time,
    //                     tvl: data[0].tvlData.tvl,
    //                 },
    //                 volumeUSD: 0,
    //                 averageLiquidityFee: data[0].averageLiquidityFee,
    //                 minPriceDecimalCorrected: fakeDataClose,
    //                 maxPriceDecimalCorrected: 0,
    //                 priceOpenDecimalCorrected: fakeDataOpen,
    //                 priceCloseDecimalCorrected: fakeDataClose,
    //                 invMinPriceDecimalCorrected: fakeDataCloseWithDenom,
    //                 invMaxPriceDecimalCorrected: 0,
    //                 invPriceOpenDecimalCorrected: fakeDataOpenWithDenom,
    //                 invPriceCloseDecimalCorrected: fakeDataCloseWithDenom,
    //                 isCrocData: false,
    //                 isFakeData: true,
    //                 isShowData: true,
    //             };

    //             // added candle for pool price market price match
    //             if (!data[0].isFakeData) {
    //                 data.unshift(placeHolderCandle);
    //             } else {
    //                 data[0] = placeHolderCandle;
    //             }
    //         }

    //         calculateDiscontinuityRange(data);
    //         return calculateVisibleCandles(
    //             scaleData,
    //             data,
    //             period,
    //             mobileView ? 300 : 100,
    //         ) as CandleDataChart[];
    //     }
    // }, [
    //     diffHashSigChart(unparsedData?.candles),
    //     poolPriceWithoutDenom,
    //     isShowLatestCandle,
    //     isCondensedModeEnabled,
    //     diffHashSigScaleData(scaleData, 'x'),
    // ]);

    /**
     * This function processes a given data array to calculate discontinuities in time intervals and updates them.
     * @param data
     */
    // const calculateDiscontinuityRange = async (data: CandleDataChart[]) => {
    //     // timeGaps each element in the data array represents a time interval and consists of two dates: [candleDate, shiftDate].

    //     const timesToCheck = data
    //         .filter((i) => i.isShowData)
    //         .map((item) => item.time * 1000);

    //     const filterTimeGapsNotInclude = timeGaps.filter(
    //         (item) => !timesToCheck.some((time) => time === item.range[1]),
    //     );
    //     const localTimeGaps: { range: number[]; isAddedPixel: boolean }[] =
    //         structuredClone(filterTimeGapsNotInclude);
    //     let notTransactionDataTime: undefined | number = undefined;
    //     let transationDataTime: undefined | number = undefined;
    //     if (scaleData) {
    //         data.slice(isShowLatestCandle ? 2 : 1).forEach((item) => {
    //             if (notTransactionDataTime === undefined && !item.isShowData) {
    //                 notTransactionDataTime = item.time * 1000;
    //             }
    //             if (notTransactionDataTime !== undefined && item.isShowData) {
    //                 transationDataTime = item.time * 1000;
    //             }
    //             if (notTransactionDataTime && transationDataTime) {
    //                 const newRange = [
    //                     transationDataTime,
    //                     notTransactionDataTime,
    //                 ];

    //                 const isRangeExists = localTimeGaps.findIndex(
    //                     (gap: timeGapsValue) => gap.range[0] === newRange[0],
    //                 );
    //                 const isRangeExistsNoTransaction = localTimeGaps.findIndex(
    //                     (gap: timeGapsValue) => gap.range[1] === newRange[1],
    //                 );

    //                 const isSameRange = localTimeGaps.some(
    //                     (gap: timeGapsValue) =>
    //                         gap.range[0] === newRange[0] &&
    //                         gap.range[1] === newRange[1],
    //                 );

    //                 if (!isSameRange) {
    //                     if (isRangeExists !== -1) {
    //                         localTimeGaps[isRangeExists].range[1] =
    //                             notTransactionDataTime;
    //                         localTimeGaps[isRangeExists].isAddedPixel = false;
    //                     } else if (isRangeExistsNoTransaction !== -1) {
    //                         localTimeGaps[isRangeExistsNoTransaction].range[0] =
    //                             transationDataTime;
    //                         localTimeGaps[
    //                             isRangeExistsNoTransaction
    //                         ].isAddedPixel = false;
    //                     } else {
    //                         localTimeGaps.push({
    //                             range: newRange,
    //                             isAddedPixel: false,
    //                         });
    //                     }
    //                 }

    //                 notTransactionDataTime = undefined;
    //                 transationDataTime = undefined;
    //             }
    //         });

    //         setTimeGaps(localTimeGaps);
    //     }
    // };

    return <div>ChartScale</div>;
}
