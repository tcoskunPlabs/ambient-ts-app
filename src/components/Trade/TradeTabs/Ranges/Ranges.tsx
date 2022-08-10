import styles from './Ranges.module.css';
import RangeCard from './RangeCard';
import { graphData } from '../../../../utils/state/graphDataSlice';
import { useAppSelector } from '../../../../utils/hooks/reduxToolkit';
import { useMoralis } from 'react-moralis';
import RangeCardHeader from './RangeCardHeader';
// import { Dispatch, SetStateAction } from 'react';
import { ethers } from 'ethers';

interface RangesProps {
    isShowAllEnabled: boolean;
    portfolio?: boolean;
    notOnTradeRoute?: boolean;
    graphData: graphData;
    lastBlockNumber: number;
    provider: ethers.providers.Provider | undefined;

    expandTradeTable: boolean;
    // setExpandTradeTable: Dispatch<SetStateAction<boolean>>;
}
export default function Ranges(props: RangesProps) {
    const { provider, portfolio, notOnTradeRoute, isShowAllEnabled, graphData, expandTradeTable } =
        props;

    const { account, isAuthenticated } = useMoralis();

    const tradeData = useAppSelector((state) => state.tradeData);

    const isDenomBase = tradeData.isDenomBase;

    const tokenAAddress = tradeData.tokenA.address;
    const tokenBAddress = tradeData.tokenB.address;

    const userPositions = graphData?.positionsByUser?.positions;
    const poolPositions = graphData?.positionsByPool?.positions;

    const RangesDisplay = isShowAllEnabled
        ? poolPositions.map((position, idx) => (
              <RangeCard
                  provider={provider}
                  key={idx}
                  portfolio={portfolio}
                  notOnTradeRoute={notOnTradeRoute}
                  position={position}
                  isAllPositionsEnabled={isShowAllEnabled}
                  tokenAAddress={tokenAAddress}
                  tokenBAddress={tokenBAddress}
                  account={account ?? undefined}
                  isAuthenticated={isAuthenticated}
                  isDenomBase={isDenomBase}
                  lastBlockNumber={props.lastBlockNumber}
              />
          ))
        : //   .reverse()
          userPositions.map((position, idx) => (
              <RangeCard
                  provider={provider}
                  key={idx}
                  portfolio={portfolio}
                  notOnTradeRoute={notOnTradeRoute}
                  position={position}
                  isAllPositionsEnabled={isShowAllEnabled}
                  tokenAAddress={tokenAAddress}
                  tokenBAddress={tokenBAddress}
                  account={account ?? undefined}
                  isAuthenticated={isAuthenticated}
                  isDenomBase={isDenomBase}
                  lastBlockNumber={props.lastBlockNumber}
                  userPosition
              />
          ));
    //   .reverse();

    return (
        <div className={styles.container}>
            <RangeCardHeader />
            <div
                className={styles.item_container}
                style={{ height: expandTradeTable ? '100%' : '220px' }}
            >
                {RangesDisplay}
            </div>
        </div>
    );
}
