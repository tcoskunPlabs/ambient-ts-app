/* eslint-disable @typescript-eslint/no-unused-vars */
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import React, {
    Dispatch,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { filterCandleWithTransaction } from './ChartUtils/discontinuityScaleUtils';
import { CandleContext } from '../../contexts/CandleContext';
import {
    CandleDataIF,
    CandlesByPoolAndDurationIF,
    TransactionIF,
} from '../../ambient-utils/types';
import { TradeDataContext } from '../../contexts/TradeDataContext';
import { PoolContext } from '../../contexts/PoolContext';
import {
    diffHashSigChart,
    diffHashSigScaleData,
} from '../../ambient-utils/dataLayer';
import {
    CandleDataChart,
    chartItemStates,
    checkShowLatestCandle,
    liquidityChartData,
    scaleData,
    timeGapsValue,
} from './ChartUtils/chartUtils';
import Chart from './Chart';
import { updatesIF } from '../../utils/hooks/useUrlParams';

interface propsIF {
    candleData: CandlesByPoolAndDurationIF;
    scaleData: scaleData;
    liquidityData: liquidityChartData | undefined;
    chartItemStates: chartItemStates;
    changeState: (
        isOpen: boolean | undefined,
        candleData: CandleDataIF | undefined,
    ) => void;
    setCurrentData: Dispatch<SetStateAction<CandleDataIF | undefined>>;
    prevPeriod: number;
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
    liquidityScale: d3.ScaleLinear<number, number> | undefined;
    liquidityDepthScale: d3.ScaleLinear<number, number> | undefined;
    updateURL: (changes: updatesIF) => void;
    userTransactionData: Array<TransactionIF> | undefined;
    setPrevCandleCount: React.Dispatch<React.SetStateAction<number>>;
    setChartResetStatus: React.Dispatch<
        React.SetStateAction<{
            isResetChart: boolean;
        }>
    >;
    chartResetStatus: {
        isResetChart: boolean;
    };
}

export default function ChartScale(props: propsIF) {
    const {
        candleData,
        scaleData,
        liquidityData,
        prevPeriod,
        selectedDate,
        setSelectedDate,
    } = props;
    const period = candleData.duration;
    const { isDenomBase } = useContext(TradeDataContext);

    const { poolPriceDisplay: poolPriceWithoutDenom } = useContext(PoolContext);

    const { isCondensedModeEnabled } = useContext(CandleContext);

    const lastCandleData = candleData.candles?.reduce(function (prev, current) {
        return prev.time > current.time ? prev : current;
    });

    const firstCandleData = candleData.candles?.reduce(
        function (prev, current) {
            return prev.time < current.time ? prev : current;
        },
    );

    const [timeGaps, setTimeGaps] = useState<timeGapsValue[]>([]);

    const calculateVisibleCandles = (
        scaleData: scaleData | undefined,
        unparsedCandleData: CandleDataChart[],
        period: number,
        numberOfCandlesToDisplay: number,
    ) => {
        if (scaleData) {
            const xmin =
                scaleData.xScale.domain()[0] -
                period * 1000 * numberOfCandlesToDisplay;
            const xmax =
                scaleData.xScale.domain()[1] +
                period * 1000 * numberOfCandlesToDisplay;

            const filtered = unparsedCandleData.filter(
                (data: CandleDataChart) =>
                    data.time * 1000 >= xmin &&
                    data.time * 1000 <= xmax &&
                    (data.isShowData || !isCondensedModeEnabled),
            );

            return filtered;
        }
        return unparsedCandleData.filter(
            (data: CandleDataChart) =>
                data.isShowData || !isCondensedModeEnabled,
        );
    };

    const isShowLatestCandle = useMemo(() => {
        return checkShowLatestCandle(period, scaleData?.xScale);
    }, [period, diffHashSigScaleData(scaleData, 'x')]);

    const unparsedCandleData = useMemo(() => {
        const data = filterCandleWithTransaction(
            candleData.candles,
            period,
        ).sort((a, b) => b.time - a.time);

        if (
            poolPriceWithoutDenom &&
            data &&
            data.length > 0 &&
            isShowLatestCandle
        ) {
            const closePriceWithDenom =
                data[0].invPriceCloseExclMEVDecimalCorrected;
            const poolPriceWithDenom = 1 / poolPriceWithoutDenom;

            const fakeDataOpenWithDenom = closePriceWithDenom;

            const fakeDataCloseWithDenom = poolPriceWithDenom;

            const closePrice = data[0].priceCloseExclMEVDecimalCorrected;

            const fakeDataOpen = closePrice;

            const fakeDataClose = poolPriceWithoutDenom;

            const placeHolderCandle = {
                time: data[0].time + period,
                invMinPriceExclMEVDecimalCorrected: fakeDataOpenWithDenom,
                maxPriceExclMEVDecimalCorrected: fakeDataOpen,
                invMaxPriceExclMEVDecimalCorrected: fakeDataCloseWithDenom,
                minPriceExclMEVDecimalCorrected: fakeDataClose,
                invPriceOpenExclMEVDecimalCorrected: fakeDataOpenWithDenom,
                priceOpenExclMEVDecimalCorrected: fakeDataOpen,
                invPriceCloseExclMEVDecimalCorrected: fakeDataCloseWithDenom,
                priceCloseExclMEVDecimalCorrected: fakeDataClose,
                period: period,
                tvlData: {
                    time: data[0].time,
                    tvl: data[0].tvlData.tvl,
                },
                volumeUSD: 0,
                averageLiquidityFee: data[0].averageLiquidityFee,
                minPriceDecimalCorrected: fakeDataClose,
                maxPriceDecimalCorrected: 0,
                priceOpenDecimalCorrected: fakeDataOpen,
                priceCloseDecimalCorrected: fakeDataClose,
                invMinPriceDecimalCorrected: fakeDataCloseWithDenom,
                invMaxPriceDecimalCorrected: 0,
                invPriceOpenDecimalCorrected: fakeDataOpenWithDenom,
                invPriceCloseDecimalCorrected: fakeDataCloseWithDenom,
                isCrocData: false,
                isFakeData: true,
                isShowData: true,
            };

            // added candle for pool price market price match
            if (!data[0].isFakeData) {
                data.unshift(placeHolderCandle);
            } else {
                data[0] = placeHolderCandle;
            }
        }

        return data;

        /*  calculateVisibleCandles(
            scaleData,
            data,
            period,
            0,
        ) as CandleDataChart[]; */
    }, [
        diffHashSigChart(candleData.candles),
        poolPriceWithoutDenom,
        isShowLatestCandle,
        isCondensedModeEnabled,
        diffHashSigScaleData(scaleData, 'x'),
    ]);

    const [parsedData, setParsedData] =
        useState<CandleDataChart[]>(unparsedCandleData);

    /**
     * This function processes a given data array to calculate discontinuities in time intervals and updates them.
     * @param data
     */
    const calculateDiscontinuityRange = async (data: CandleDataChart[]) => {
        // timeGaps each element in the data array represents a time interval and consists of two dates: [candleDate, shiftDate].

        const timesToCheck = data
            .filter((i) => i.isShowData)
            .map((item) => item.time * 1000);

        const filterTimeGapsNotInclude = timeGaps.filter(
            (item) => !timesToCheck.some((time) => time === item.range[1]),
        );
        const localTimeGaps: { range: number[]; isAddedPixel: boolean }[] =
            structuredClone(filterTimeGapsNotInclude);
        let notTransactionDataTime: undefined | number = undefined;
        let transationDataTime: undefined | number = undefined;
        if (scaleData) {
            data.slice(isShowLatestCandle ? 2 : 1).forEach((item) => {
                if (notTransactionDataTime === undefined && !item.isShowData) {
                    notTransactionDataTime = item.time * 1000;
                }
                if (notTransactionDataTime !== undefined && item.isShowData) {
                    transationDataTime = item.time * 1000;
                }
                if (notTransactionDataTime && transationDataTime) {
                    const newRange = [
                        transationDataTime,
                        notTransactionDataTime,
                    ];

                    const isRangeExists = localTimeGaps.findIndex(
                        (gap: timeGapsValue) => gap.range[0] === newRange[0],
                    );
                    const isRangeExistsNoTransaction = localTimeGaps.findIndex(
                        (gap: timeGapsValue) => gap.range[1] === newRange[1],
                    );

                    const isSameRange = localTimeGaps.some(
                        (gap: timeGapsValue) =>
                            gap.range[0] === newRange[0] &&
                            gap.range[1] === newRange[1],
                    );

                    if (!isSameRange) {
                        if (isRangeExists !== -1) {
                            localTimeGaps[isRangeExists].range[1] =
                                notTransactionDataTime;
                            localTimeGaps[isRangeExists].isAddedPixel = false;
                        } else if (isRangeExistsNoTransaction !== -1) {
                            localTimeGaps[isRangeExistsNoTransaction].range[0] =
                                transationDataTime;
                            localTimeGaps[
                                isRangeExistsNoTransaction
                            ].isAddedPixel = false;
                        } else {
                            localTimeGaps.push({
                                range: newRange,
                                isAddedPixel: false,
                            });
                        }
                    }

                    notTransactionDataTime = undefined;
                    transationDataTime = undefined;
                }
            });

            console.log({localTimeGaps},new Date(localTimeGaps[0].range[0]),new Date(localTimeGaps[0].range[1]));
            
            const newDiscontinuityProvider = d3fc.discontinuityRange(...localTimeGaps.map((i)=>i.range));

            scaleData.xScale.discontinuityProvider(newDiscontinuityProvider);
            setTimeGaps(localTimeGaps);
        }
    };


    useEffect(() => {
      

        console.log(scaleData.xScale.domain()[0],scaleData.xScale.domain()[1]);
        
    }, [scaleData.xScale.domain()])
    
    useEffect(() => {
        // const res = calculateVisibleCandles(
        //     scaleData,
        //     unparsedCandleData,
        //     period,
        //     0,
        // ) as CandleDataChart[];

        const showData = unparsedCandleData.filter((i) => i.isShowData);
        calculateDiscontinuityRange(unparsedCandleData);

        setParsedData(showData);
    }, [unparsedCandleData]);

    return (
        <Chart
            liquidityData={liquidityData}
            changeState={props.changeState}
            denomInBase={isDenomBase}
            chartItemStates={props.chartItemStates}
            setCurrentData={props.setCurrentData}
            scaleData={scaleData}
            period={period}
            prevPeriod={prevPeriod}
            candleTimeInSeconds={period}
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
            liquidityScale={props.liquidityScale}
            liquidityDepthScale={props.liquidityDepthScale}
            parsedData={parsedData}
            updateURL={props.updateURL}
            userTransactionData={props.userTransactionData}
            setPrevCandleCount={props.setPrevCandleCount}
            setChartResetStatus={props.setChartResetStatus}
            chartResetStatus={props.chartResetStatus}
            lastCandleData={lastCandleData}
            firstCandleData={firstCandleData}
        />
    );
}
