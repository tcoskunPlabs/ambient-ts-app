import styles from '../SidebarSearchResults.module.css';
import { TransactionIF } from '../../../../../utils/interfaces/exports';
import { getTxType, getTxValue } from './functions/exports';

interface propsIF {
    tx: TransactionIF;
    handleClick: (tx: TransactionIF) => void;
}

export default function TxLI(props: propsIF) {
    const { tx, handleClick } = props;

    // type of transaction in human-readable format
    const txType = getTxType(tx.entityType);

    // value of transaction in human-readable format
    const txValue = getTxValue(
        tx.valueUSD,
        tx.totalValueUSD,
        tx.totalFlowUSD
    );

    // TODO:   @Junior  please refactor the top-level element of this JSX return
    // TODO:   @Junior  ... to return an <li> element, and refactor parent to
    // TODO:   @Junior  ... render them inside an <ol> element

    return (
        <div className={styles.card_container} onClick={() => handleClick(tx)}>
            <div>{tx.baseSymbol} / {tx.quoteSymbol}</div>
            <div>{txType}</div>
            <div className={styles.status_display}>{txValue}</div>
        </div>
    );
}