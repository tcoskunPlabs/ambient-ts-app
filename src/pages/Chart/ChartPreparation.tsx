import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
    CandleDataChart,
    chartItemStates,
    liquidityChartData,
    renderChart,
    scaleData,
    TransactionDataRange,
} from '../platformAmbient/Chart/ChartUtils/chartUtils';
import { diffHashSigChart } from '../../ambient-utils/dataLayer';
import * as d3fc from 'd3fc';
import { CandleDataIF, TransactionIF } from '../../ambient-utils/types';
import { updatesIF } from '../../utils/hooks/useUrlParams';
import Chart from '../platformAmbient/Chart/Chart';

interface propsIF {
    candleDataWithTransactionInfo: CandleDataChart[];
    scaleData: scaleData;
    period: number;
    liquidityData: liquidityChartData | undefined;
    chartItemStates: chartItemStates;
    changeState: (
        isOpen: boolean | undefined,
        candleData: CandleDataIF | undefined,
    ) => void;
    currentData: CandleDataIF | undefined;
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
    showTooltip: boolean;
    setShowTooltip: React.Dispatch<React.SetStateAction<boolean>>;
    liquidityScale: d3.ScaleLinear<number, number> | undefined;
    liquidityDepthScale: d3.ScaleLinear<number, number> | undefined;
    updateURL: (changes: updatesIF) => void;
    userTransactionData: Array<TransactionIF> | undefined;
    setPrevCandleCount: React.Dispatch<React.SetStateAction<number>>;
}
export default function ChartPreparation(props: propsIF) {
    const [timeGaps, setTimeGaps] = useState<TransactionDataRange[]>([]);

    const [parsedData, setParsedData] = useState<CandleDataChart[]>();

    const {
        scaleData,
        candleDataWithTransactionInfo,
        period,
        liquidityData,
        prevPeriod,
        selectedDate,
        setSelectedDate,
    } = props;

    /**
     * This function processes a given data array to calculate discontinuities in time intervals and updates them.
     * @param data
     */
    const calculateDiscontinuityRange = async (data: CandleDataChart[]) => {
        // timeGaps each element in the data array represents a time interval and consists of two dates: [candleDate, shiftDate].

        const localData = structuredClone(data).sort(
            (a: CandleDataChart, b: CandleDataChart) => b.time - a.time,
        );
        const timesToCheck = localData
            .filter((i) => i.isShowData)
            .map((item) => item.time * 1000);

        const filterTimeGapsNotInclude = timeGaps.filter(
            (item) =>
                !timesToCheck.some((time) => time === item.targetPositionTime),
        );
        const localTimeGaps: TransactionDataRange[] = structuredClone(
            filterTimeGapsNotInclude,
        );
        let notTransactionDataTime: undefined | number = undefined;
        let transationDataTime: undefined | number = undefined;
        if (scaleData) {
            localData.forEach((item) => {
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
                        (gap: TransactionDataRange) =>
                            gap.valueTime === newRange[0],
                    );
                    const isRangeExistsNoTransaction = localTimeGaps.findIndex(
                        (gap: TransactionDataRange) =>
                            gap.targetPositionTime === newRange[1],
                    );

                    const isSameRange = localTimeGaps.some(
                        (gap: TransactionDataRange) =>
                            gap.valueTime === newRange[0] &&
                            gap.targetPositionTime === newRange[1],
                    );

                    if (!isSameRange) {
                        if (isRangeExists !== -1) {
                            localTimeGaps[isRangeExists].targetPositionTime =
                                notTransactionDataTime;
                        } else if (isRangeExistsNoTransaction !== -1) {
                            localTimeGaps[
                                isRangeExistsNoTransaction
                            ].valueTime = transationDataTime;
                        } else {
                            localTimeGaps.push({
                                valueTime: newRange[0],
                                targetPositionTime: newRange[1],
                            });
                        }
                    }

                    notTransactionDataTime = undefined;
                    transationDataTime = undefined;
                }
            });

            const newDiscontinuityProvider = d3fc.discontinuityRange(
                ...localTimeGaps.map((i) => [
                    i.valueTime,
                    i.targetPositionTime,
                ]),
            );

            scaleData.xScale.discontinuityProvider(newDiscontinuityProvider);

            setTimeGaps(localTimeGaps);

            return localTimeGaps;
        }
    };

    useEffect(() => {
        const domain = scaleData.xScale.domain();

        const showData = candleDataWithTransactionInfo.filter(
            (i) => i.isShowData,
        );
        if (parsedData) {
            parsedData.sort((a, b) => b.time - a.time);
        }

        calculateDiscontinuityRange(candleDataWithTransactionInfo).then(
            (res) => {
                const localTimeGaps = res;

                if (parsedData) {
                    if (localTimeGaps && localTimeGaps?.length > 0) {
                        // if (
                        //     parsedData[parsedData.length - 1].time * 1000 !==
                        //     unparsedCandleData[unparsedCandleData.length - 1].time *
                        //         1000
                        // ) {

                        const showedFirstCandleTime =
                            parsedData[parsedData.length - 1].time * 1000;

                        let newShowedFirstCandleTime = showedFirstCandleTime;
                        const result = localTimeGaps
                            .map((i) => i)
                            .findIndex(
                                (a) =>
                                    a.valueTime < showedFirstCandleTime &&
                                    a.targetPositionTime >
                                        showedFirstCandleTime,
                            );

                        const needCandleCountForMin = Math.floor(
                            (showedFirstCandleTime - domain[0]) /
                                (1000 * period),
                        );

                        if (result !== -1) {
                            newShowedFirstCandleTime =
                                localTimeGaps[result].valueTime;
                        }

                        if (needCandleCountForMin > 0) {
                            const findIndexInAllData = showData.findIndex(
                                (i) =>
                                    i.time * 1000 === newShowedFirstCandleTime,
                            );

                            if (findIndexInAllData !== -1) {
                                let needCandleCount =
                                    findIndexInAllData + needCandleCountForMin;

                                let diffCandleCount = 0;
                                if (needCandleCount > showData.length) {
                                    diffCandleCount =
                                        needCandleCount - (showData.length - 1);
                                    needCandleCount = showData.length - 1;
                                }
                                const newCandleTime =
                                    showData[needCandleCount].time * 1000 -
                                    diffCandleCount * period * 1000;

                                scaleData.xScale.domain([
                                    newCandleTime,
                                    domain[1],
                                ]);
                            }
                        }

                        const showedLastCandleTime = parsedData[0].time * 1000;
                        let newShowedLastCandleTime = showedLastCandleTime;
                        const resultForMax = localTimeGaps
                            .map((i) => i)
                            .findIndex(
                                (a) =>
                                    a.valueTime < showedLastCandleTime &&
                                    a.targetPositionTime > showedLastCandleTime,
                            );

                        const needCandleCountForMax = Math.floor(
                            (domain[1] - showedLastCandleTime) /
                                (1000 * period),
                        );

                        if (resultForMax !== -1) {
                            newShowedLastCandleTime =
                                localTimeGaps[resultForMax].valueTime;
                        }

                        if (needCandleCountForMax > 0) {
                            const findIndexInAllData = showData.findIndex(
                                (i) =>
                                    i.time * 1000 === newShowedLastCandleTime,
                            );

                            if (findIndexInAllData !== -1) {
                                let needCandleCountMax =
                                    findIndexInAllData - needCandleCountForMax;

                                let diffCandleCountMax = 0;
                                if (needCandleCountMax < 0) {
                                    diffCandleCountMax = -needCandleCountMax;
                                    needCandleCountMax = 0;
                                }

                                const newCandleTimeMax =
                                    showData[needCandleCountMax].time * 1000 +
                                    diffCandleCountMax * period * 1000;

                                scaleData.xScale.domain([
                                    scaleData.xScale.domain()[0],
                                    newCandleTimeMax,
                                ]);
                            }
                        }
                    }
                }

                renderChart();
                setParsedData(showData);
            },
        );
    }, [diffHashSigChart(candleDataWithTransactionInfo)]);

    return parsedData && parsedData.length > 0 ? (
        <Chart
            liquidityData={liquidityData}
            changeState={props.changeState}
            chartItemStates={props.chartItemStates}
            currentData={props.currentData}
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
            showTooltip={props.showTooltip}
            timeGaps={timeGaps}
        />
    ) : (
        <></>
    );
}
