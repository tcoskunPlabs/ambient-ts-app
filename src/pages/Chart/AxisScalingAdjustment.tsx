// import * as d3 from 'd3';
// import {
//     useContext,
//     useEffect,

//     useMemo,
// } from 'react';

// import { PoolContext } from '../../contexts/PoolContext';
// import './Chart.css';

// import { candleTimeIF } from '../../App/hooks/useChartSettings';
// import {
//     diffHashSigChart,
//     diffHashSigScaleData,

// } from '../../ambient-utils/dataLayer';

// import {
//     CandleDataIF,
//     CandlesByPoolAndDurationIF,
//     TransactionIF,
// } from '../../ambient-utils/types';

// import {
//     CandleDataChart,

//     chartItemStates,
//     checkShowLatestCandle,

//     getInitialDisplayCandleCount,

//     getMinTimeWithTransaction,

//     liquidityChartData,
//     scaleData,

// } from './ChartUtils/chartUtils';

// import { updatesIF } from '../../utils/hooks/useUrlParams';

// import { TradeDataContext } from '../../contexts/TradeDataContext';

// import Chart from './Chart';
// import { xAxisBuffer } from './ChartUtils/chartConstants';
// import { useMediaQuery } from '@material-ui/core';
// import { filterCandleWithTransaction } from './ChartUtils/discontinuityScaleUtils';

// interface propsIF {
//     isTokenABase: boolean;
//     liquidityData: liquidityChartData | undefined;
//     changeState: (
//         isOpen: boolean | undefined,
//         candleData: CandleDataIF | undefined,
//     ) => void;
//     denomInBase: boolean;
//     chartItemStates: chartItemStates;
//     setCurrentData: React.Dispatch<
//         React.SetStateAction<CandleDataIF | undefined>
//     >;
//     setCurrentVolumeData: React.Dispatch<
//         React.SetStateAction<number | undefined>
//     >;
//     isCandleAdded: boolean | undefined;
//     setIsCandleAdded: React.Dispatch<boolean>;
//     scaleData: scaleData | undefined;
//     poolPriceNonDisplay: number | undefined;
//     selectedDate: number | undefined;
//     setSelectedDate: React.Dispatch<number | undefined>;
//     rescale: boolean | undefined;
//     setRescale: React.Dispatch<React.SetStateAction<boolean>>;
//     latest: boolean | undefined;
//     setLatest: React.Dispatch<React.SetStateAction<boolean>>;
//     reset: boolean | undefined;
//     setReset: React.Dispatch<React.SetStateAction<boolean>>;
//     showLatest: boolean | undefined;
//     setShowLatest: React.Dispatch<React.SetStateAction<boolean>>;
//     setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>;
//     liquidityScale: d3.ScaleLinear<number, number> | undefined;
//     liquidityDepthScale: d3.ScaleLinear<number, number> | undefined;
//     candleTime: candleTimeIF;
//     unparsedData: CandlesByPoolAndDurationIF;
//     prevPeriod: number;
//     candleTimeInSeconds: number | undefined;
//     updateURL: (changes: updatesIF) => void;
//     userTransactionData: Array<TransactionIF> | undefined;
// }

// export default function AxisScalingAdjustment(props: propsIF) {
//     const {
//         isTokenABase,
//         scaleData,
//         poolPriceNonDisplay,
//         selectedDate,
//         setSelectedDate,

//         liquidityData,
//         liquidityScale,
//         liquidityDepthScale,
//         unparsedData,
//         prevPeriod,
//         updateURL,
//         userTransactionData,
//         isCandleAdded,
//         setIsCandleAdded

//     } = props;

//     const currentPool = useContext(TradeDataContext);
//     const { isDenomBase } = currentPool;

//     const {  poolPriceDisplay: poolPriceWithoutDenom } =
//     useContext(PoolContext);

//     const period = unparsedData.duration;

//     const isShowLatestCandle = useMemo(() => {
//         return checkShowLatestCandle(period, scaleData?.xScale);
//     }, [period, diffHashSigScaleData(scaleData, 'x')]);

// const unparsedCandleData = useMemo(() => {
//     const data =filterCandleWithTransaction( unparsedData.candles)
//         .sort((a, b) => b.time - a.time)
//         .map((item) => ({
//             ...item,
//             isFakeData: false,
//         }));

//     if (
//         poolPriceWithoutDenom &&
//         data &&
//         data.length > 0 &&
//         isShowLatestCandle
//     ) {
//         const closePriceWithDenom =
//             data[0].invPriceCloseExclMEVDecimalCorrected;
//         const poolPriceWithDenom = 1 / poolPriceWithoutDenom;

//         const fakeDataOpenWithDenom = closePriceWithDenom;

//         const fakeDataCloseWithDenom = poolPriceWithDenom;

//         const closePrice = data[0].priceCloseExclMEVDecimalCorrected;

//         const fakeDataOpen = closePrice;

//         const fakeDataClose = poolPriceWithoutDenom;

//         const placeHolderCandle = {
//             time: data[0].time + period,
//             invMinPriceExclMEVDecimalCorrected: fakeDataOpenWithDenom,
//             maxPriceExclMEVDecimalCorrected: fakeDataOpen,
//             invMaxPriceExclMEVDecimalCorrected: fakeDataCloseWithDenom,
//             minPriceExclMEVDecimalCorrected: fakeDataClose,
//             invPriceOpenExclMEVDecimalCorrected: fakeDataOpenWithDenom,
//             priceOpenExclMEVDecimalCorrected: fakeDataOpen,
//             invPriceCloseExclMEVDecimalCorrected: fakeDataCloseWithDenom,
//             priceCloseExclMEVDecimalCorrected: fakeDataClose,
//             period: period,
//             tvlData: {
//                 time: data[0].time,
//                 tvl: data[0].tvlData.tvl,
//             },
//             volumeUSD: 0,
//             averageLiquidityFee: data[0].averageLiquidityFee,
//             minPriceDecimalCorrected: fakeDataClose,
//             maxPriceDecimalCorrected: 0,
//             priceOpenDecimalCorrected: fakeDataOpen,
//             priceCloseDecimalCorrected: fakeDataClose,
//             invMinPriceDecimalCorrected: fakeDataCloseWithDenom,
//             invMaxPriceDecimalCorrected: 0,
//             invPriceOpenDecimalCorrected: fakeDataOpenWithDenom,
//             invPriceCloseDecimalCorrected: fakeDataCloseWithDenom,
//             isCrocData: false,
//             isFakeData: true,
//             isShowData: true,
//         };

//         if (!data[0].isFakeData) {
//             data.unshift(placeHolderCandle);
//         } else {
//             data[0] = placeHolderCandle;
//         }
//     }

//     return data;

// }, [
//     diffHashSigChart(unparsedData.candles),
//     poolPriceWithoutDenom,
//     isShowLatestCandle,
// ]);

//     useEffect(() => {

//         if (scaleData) {
//             const minTime = getMinTimeWithTransaction(scaleData.xScale,unparsedCandleData,period);
//             scaleData.xScale([minTime,scaleData.xScale.domain()[1]])
//         }

//     }, []);

//       return (
//         <Chart
//             isTokenABase={isTokenABase}
//             liquidityData={liquidityData}
//             changeState={props.changeState}
//             denomInBase={isDenomBase}
//             chartItemStates={props.chartItemStates}
//             setCurrentData={props.setCurrentData}
//             setCurrentVolumeData={props.setCurrentVolumeData}
//             isCandleAdded={isCandleAdded}
//             setIsCandleAdded={setIsCandleAdded}
//             scaleData={scaleData}
//             prevPeriod={prevPeriod}
//             candleTimeInSeconds={period}
//             poolPriceNonDisplay={poolPriceNonDisplay}
//             selectedDate={selectedDate}
//             setSelectedDate={setSelectedDate}
//             rescale={props.rescale}
//             setRescale={props.setRescale}
//             latest={props.latest}
//             setLatest={props.setLatest}
//             reset={props.reset}
//             setReset={props.setReset}
//             showLatest={props.showLatest}
//             setShowLatest={props.setShowLatest}
//             setShowTooltip={props.setShowTooltip}
//             liquidityScale={liquidityScale}
//             liquidityDepthScale={liquidityDepthScale}
//             candleTime={props.candleTime}
//             unparsedData={props.unparsedData}
//             updateURL={updateURL}
//             userTransactionData={userTransactionData}
//             unparsedCandleData={unparsedCandleData}
//     />
//       )

// }
