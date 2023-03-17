import styles from './AdvancedPriceInfo.module.css';
import { TokenPairIF } from '../../../../../utils/interfaces/exports';

interface propsIF {
    tokenPair: TokenPairIF;
    poolPriceDisplay: string;
    isDenomBase: boolean;
    isTokenABase: boolean;
    minimumSpan: number;
    isOutOfRange: boolean;
    aprPercentage: number | undefined;
    daysInRange: number | undefined;
}

export default function AdvancedPriceInfo(props: propsIF) {
    // JSX frag to display the pool price for the current pair
    const {
        tokenPair,
        poolPriceDisplay,
        isDenomBase,
        isTokenABase,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        minimumSpan,
        isOutOfRange,
        aprPercentage,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        daysInRange,
    } = props;

    const reverseDisplay = (isTokenABase && !isDenomBase) || (!isTokenABase && isDenomBase);

    const currentPrice = (
        <div className={styles.price_info_row}>
            <div>Current Price: </div>
            <div className={styles.current_price}>
                {reverseDisplay
                    ? `${poolPriceDisplay} ${tokenPair.dataTokenA.symbol} per ${tokenPair.dataTokenB.symbol}`
                    : `${poolPriceDisplay} ${tokenPair.dataTokenB.symbol} per ${tokenPair.dataTokenA.symbol}`}
            </div>
        </div>
    );

    const aprPercentageString = aprPercentage
        ? `Est. APR | ${aprPercentage.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          })}%`
        : '…';

    const estimatedAPR = isOutOfRange ? (
        <div className={styles.apr_display_out_of_range}>
            <div>Est. APR | 0%</div>
        </div>
    ) : (
        <div className={styles.apr_display_in_range}>
            <div>{aprPercentageString}</div>
        </div>
    );

    return (
        <div className={styles.price_info_container}>
            <div className={styles.price_info_content}>
                {currentPrice}
                {estimatedAPR}
            </div>
        </div>
    );
}
