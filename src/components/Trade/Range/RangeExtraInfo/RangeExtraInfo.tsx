import { memo, useContext } from 'react';
import { estimateRangeAprFromPoolApr } from '../../../../ambient-utils/api';
import { getFormattedNumber } from '../../../../ambient-utils/dataLayer';
import { PoolContext } from '../../../../contexts/PoolContext';
import { TradeDataContext } from '../../../../contexts/TradeDataContext';
import { ExtraInfo } from '../../TradeModules/ExtraInfo/ExtraInfo';
interface propsIF {
    poolPriceDisplay: string;
    slippageTolerance: number;
    liquidityFee: number | undefined;
    rangeGasPriceinDollars: string | undefined;
    isTokenABase: boolean;
    showExtraInfoDropdown: boolean;
    poolApr: string | undefined;
    rangeWidthPercentage: number;
}

function RangeExtraInfo(props: propsIF) {
    const {
        rangeGasPriceinDollars,
        slippageTolerance,
        liquidityFee,
        showExtraInfoDropdown,
        poolApr,
        rangeWidthPercentage,
    } = props;

    const { isDenomBase, baseToken, quoteToken } = useContext(TradeDataContext);

    const { poolPriceDisplay, isTradeDollarizationEnabled, usdPrice } =
        useContext(PoolContext);

    const baseTokenSymbol = baseToken.symbol;
    const quoteTokenSymbol = quoteToken.symbol;

    const estRangeApr =
        poolApr && rangeWidthPercentage
            ? estimateRangeAprFromPoolApr(
                  rangeWidthPercentage / 100,
                  parseFloat(poolApr),
              )
            : 0;

    const estRangeAprString = estRangeApr
        ? getFormattedNumber({
              value: estRangeApr,
          }) + ' %'
        : '…';

    const displayPriceWithDenom =
        isDenomBase && poolPriceDisplay
            ? 1 / poolPriceDisplay
            : (poolPriceDisplay ?? 0);

    const displayPriceString = displayPriceWithDenom
        ? getFormattedNumber({
              value: displayPriceWithDenom,
          })
        : '…';

    const usdPriceDisplay = usdPrice
        ? getFormattedNumber({ value: usdPrice })
        : '…';

    const liquidityProviderFeeString = liquidityFee
        ? (liquidityFee * 100).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          }) + ' %'
        : '...';

    const extraInfo = [
        {
            title: 'Slippage Tolerance',
            tooltipTitle: 'This can be changed in settings.',
            data: `${slippageTolerance} %`,
        },
        {
            title: 'Current Provider Fee',
            tooltipTitle: `This is a dynamically updated rate to reward ${
                isDenomBase ? baseTokenSymbol : quoteTokenSymbol
            } / ${
                isDenomBase ? quoteTokenSymbol : baseTokenSymbol
            } liquidity providers.`,
            data: liquidityProviderFeeString,
        },
        {
            title: 'Estimated APR',
            tooltipTitle: `Estimated APR is based on selected range width, historical volume, fee rate, and pool
                liquidity. This value is only a historical estimate, and does not account
                for divergence loss from large price swings. Returns not
                guaranteed.`,
            data: estRangeAprString,
        },
    ];

    const conversionRateNonUsd = isDenomBase
        ? `1 ${baseTokenSymbol} ≈ ${displayPriceString} ${quoteTokenSymbol}`
        : `1 ${quoteTokenSymbol} ≈ ${displayPriceString} ${baseTokenSymbol}`;

    const conversionRateUsd = isDenomBase
        ? `1 ${baseTokenSymbol} ≈ ${usdPriceDisplay} USD`
        : `1 ${quoteTokenSymbol} ≈ ${usdPriceDisplay} USD`;

    const conversionRate = isTradeDollarizationEnabled
        ? conversionRateUsd
        : conversionRateNonUsd;

    return (
        <ExtraInfo
            extraInfo={extraInfo}
            conversionRate={conversionRate}
            gasPrice={rangeGasPriceinDollars}
            showDropdown={showExtraInfoDropdown}
        />
    );
}

export default memo(RangeExtraInfo);
