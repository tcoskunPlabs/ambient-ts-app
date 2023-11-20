import React, { createContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    chartSettingsMethodsIF,
    useChartSettings,
} from '../App/hooks/useChartSettings';
import useChatApi from '../components/Chat/Service/ChatApi';
import { ShareableChartData } from '../pages/Chart/ChartUtils/chartUtils';

type TradeTableState = 'Expanded' | 'Collapsed' | undefined;

interface ChartHeights {
    current: number;
    saved: number;
    min: number;
    max: number;
    default: number;
}

interface ChartContextIF {
    chartSettings: chartSettingsMethodsIF;
    isFullScreen: boolean;
    setIsFullScreen: (val: boolean) => void;
    setChartHeight: (val: number) => void;
    chartHeights: ChartHeights;
    isEnabled: boolean;
    canvasRef: React.MutableRefObject<null>;
    chartCanvasRef: React.MutableRefObject<null>;
    tradeTableState: TradeTableState;
    setIsReadOnlyChart: React.Dispatch<boolean>;
    isReadOnlyChart: boolean;
    userSharebaleData: ShareableChartData | undefined;
}

export const ChartContext = createContext<ChartContextIF>({} as ChartContextIF);

export const ChartContextProvider = (props: { children: React.ReactNode }) => {
    // 2:1 ratio of the window height subtracted by main header and token info header
    const CHART_MAX_HEIGHT = window.innerHeight - 160;
    const CHART_MIN_HEIGHT = 4;
    const CHART_DEFAULT_HEIGHT = Math.floor((CHART_MAX_HEIGHT * 2) / 3);
    let CHART_SAVED_HEIGHT = CHART_DEFAULT_HEIGHT;
    const { getChartValues } = useChatApi();

    // Fetch alternative default height from local storage if it exists
    const CHART_SAVED_HEIGHT_LOCAL_STORAGE =
        localStorage.getItem('savedChartHeight');

    if (CHART_SAVED_HEIGHT_LOCAL_STORAGE) {
        CHART_SAVED_HEIGHT = parseInt(CHART_SAVED_HEIGHT_LOCAL_STORAGE);
    }

    const [isReadOnlyChart, setIsReadOnlyChart] = useState(false);
    const [userSharebaleData, setUserSharebaleData] =
        useState<ShareableChartData>();

    const [chartHeights, setChartHeights] = useState<{
        current: number;
        saved: number;
        min: number;
        max: number;
        default: number;
    }>({
        current: CHART_SAVED_HEIGHT,
        saved: CHART_SAVED_HEIGHT,
        min: CHART_MIN_HEIGHT,
        max: CHART_MAX_HEIGHT,
        default: CHART_DEFAULT_HEIGHT,
    });

    // the max size is based on the max height, and is subtracting the minimum size of table and the padding around the drag bar
    useEffect(() => {
        const updateDimension = () => {
            setChartHeights({
                ...chartHeights,
                min: CHART_MIN_HEIGHT,
                max: CHART_MAX_HEIGHT,
                default: CHART_DEFAULT_HEIGHT,
            });
        };
        window.addEventListener('resize', updateDimension);
        return () => {
            window.removeEventListener('resize', updateDimension);
        };
    }, [window.innerHeight, chartHeights]);

    const { pathname: currentLocation } = useLocation();

    const canvasRef = useRef(null);
    const chartCanvasRef = useRef(null);

    const [fullScreenChart, setFullScreenChart] = useState(false);
    const setChartHeight = (val: number) => {
        if (val > CHART_MIN_HEIGHT && val < CHART_MAX_HEIGHT) {
            localStorage.setItem('savedChartHeight', val.toString());
        }

        setChartHeights({
            ...chartHeights,
            current: val,
            saved:
                val > CHART_MIN_HEIGHT && val < CHART_MAX_HEIGHT
                    ? val
                    : chartHeights.saved,
            default: CHART_DEFAULT_HEIGHT,
        });
    };

    const tradeTableState: TradeTableState =
        chartHeights.current === chartHeights.min
            ? 'Expanded'
            : chartHeights.current === chartHeights.max
            ? 'Collapsed'
            : undefined;

    const isChartEnabled =
        !!process.env.REACT_APP_CHART_IS_ENABLED &&
        process.env.REACT_APP_CHART_IS_ENABLED.toLowerCase() === 'false'
            ? false
            : true;
    const chartSettings = useChartSettings();

    const chartContext = {
        chartSettings,
        isFullScreen: fullScreenChart,
        setIsFullScreen: setFullScreenChart,
        chartHeights,
        setChartHeight,
        isEnabled: isChartEnabled,
        canvasRef,
        chartCanvasRef,
        tradeTableState,
        setIsReadOnlyChart,
        isReadOnlyChart,
        userSharebaleData,
    };

    useEffect(() => {
        if (!currentLocation.startsWith('/trade')) {
            setFullScreenChart(false);
        }
    }, [currentLocation]);

    const getParamFromPathname = () => {
        const parts = currentLocation.split('&');
        const paramIndex = parts.findIndex((part) => part.includes('chart'));

        if (paramIndex !== -1) {
            return parts[paramIndex];
        }

        return null;
    };

    useEffect(() => {
        const chart = getParamFromPathname()?.split('chart')[1];
        if (chart) {
            setIsReadOnlyChart(true);
            getChartValues(chart).then((result) => {
                setFullScreenChart(true);
                if (result.status === 'OK') {
                    const res = result.chart;
                    const data = {
                        liqMode: res.liqMode,
                        timeframe: res.timeframe,
                        showTvl: res.showTvl,
                        showFeeRate: res.showFeeRate,
                        showVolume: res.showVolume,
                        drawData: res.drawData,
                    };

                    setUserSharebaleData(data);
                } else {
                    setIsReadOnlyChart(false);
                }
            });
        } else {
            setIsReadOnlyChart(false);
        }
    }, [currentLocation]);

    return (
        <ChartContext.Provider value={chartContext}>
            {props.children}
        </ChartContext.Provider>
    );
};
