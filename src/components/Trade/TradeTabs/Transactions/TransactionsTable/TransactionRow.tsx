import styles from '../Transactions.module.css';
import { ITransaction } from '../../../../../utils/state/graphDataSlice';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { useProcessTransaction } from '../../../../../utils/hooks/useProcessTransaction';
import TransactionsMenu from '../../../../Global/Tabs/TableMenu/TableMenuComponents/TransactionsMenu';
import { DefaultTooltip } from '../../../../Global/StyledTooltip/StyledTooltip';
import { NavLink } from 'react-router-dom';
// import { AiOutlineDash } from 'react-icons/ai';
import NoTokenIcon from '../../../../Global/NoTokenIcon/NoTokenIcon';
interface TransactionRowPropsIF {
    tx: ITransaction;

    currentTxActiveInTransactions: string;
    setCurrentTxActiveInTransactions: Dispatch<SetStateAction<string>>;
    isShowAllEnabled: boolean;
    showSidebar: boolean;
    ipadView: boolean;
    showColumns: boolean;
    blockExplorer: string | undefined;
    closeGlobalModal: () => void;

    openGlobalModal: (content: React.ReactNode) => void;
    isOnPortfolioPage: boolean;
}
export default function TransactionRow(props: TransactionRowPropsIF) {
    const {
        showColumns,
        ipadView,
        tx,
        showSidebar,
        blockExplorer,
        // openGlobalModal,
        // closeGlobalModal,
        currentTxActiveInTransactions,
        setCurrentTxActiveInTransactions,
        isShowAllEnabled,
        isOnPortfolioPage,
    } = props;

    const {
        txHash,
        txHashTruncated,
        userNameToDisplay,
        quoteTokenLogo,
        baseTokenLogo,
        baseDisplay,
        quoteDisplay,
        ownerId,
        // isOrderFilled,
        truncatedDisplayPrice,
        truncatedLowDisplayPrice,
        truncatedHighDisplayPrice,
        sideType,

        type,
        usdValue,
        baseTokenSymbol,
        quoteTokenSymbol,
        isOwnerActiveAccount,
        ensName,
        baseTokenCharacter,
        quoteTokenCharacter,
        isDenomBase,
        // orderMatchesSelectedTokens,
    } = useProcessTransaction(tx);

    const sideCharacter = isDenomBase ? baseTokenCharacter : quoteTokenCharacter;

    const sideTypeStyle = `${sideType}_style`;

    const openDetailsModal = () => console.log('opening detail modal');

    const activeTransactionStyle =
        tx.id === currentTxActiveInTransactions ? styles.active_transaction_style : '';

    const userPositionStyle =
        userNameToDisplay === 'You' && isShowAllEnabled ? styles.border_left : null;

    const usernameStyle = ensName || isOwnerActiveAccount ? 'gradient_text' : 'base_color';

    const txDomId = tx.id === currentTxActiveInTransactions ? `tx-${tx.id}` : '';

    function scrollToDiv() {
        const element = document.getElementById(txDomId);

        element?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }

    useEffect(() => {
        tx.id === currentTxActiveInTransactions ? scrollToDiv() : null;
    }, [currentTxActiveInTransactions]);

    const IDWithTooltip = (
        <DefaultTooltip
            interactive
            title={txHash}
            placement={'right-end'}
            arrow
            enterDelay={400}
            leaveDelay={200}
        >
            <li onClick={openDetailsModal} data-label='id' className='base_color'>
                {txHashTruncated}
            </li>
        </DefaultTooltip>
    );

    const walletWithTooltip = (
        <DefaultTooltip
            interactive
            title={
                <div>
                    <p>{ownerId}</p>
                    <NavLink to={`/${ownerId}`}>View Account</NavLink>
                </div>
            }
            placement={'right-end'}
            arrow
            enterDelay={400}
            leaveDelay={200}
        >
            <li
                onClick={openDetailsModal}
                data-label='wallet'
                className={usernameStyle}
                style={{ textTransform: 'lowercase' }}
            >
                {userNameToDisplay}
            </li>
        </DefaultTooltip>
    );

    const baseTokenLogoComponent =
        baseTokenLogo !== '' ? (
            <DefaultTooltip
                interactive
                title={
                    <div>
                        <p>{baseTokenSymbol}</p>
                        {/* <NavLink to={`/${ownerId}`}>View Account</NavLink> */}
                    </div>
                }
                placement={'top'}
                arrow
                enterDelay={400}
                leaveDelay={200}
            >
                <img src={baseTokenLogo} alt='base token' width='15px' />
            </DefaultTooltip>
        ) : (
            <DefaultTooltip
                interactive
                title={
                    <div>
                        <p>{baseTokenSymbol}</p>
                        {/* <NavLink to={`/${ownerId}`}>View Account</NavLink> */}
                    </div>
                }
                placement={'top'}
                arrow
                enterDelay={400}
                leaveDelay={200}
            >
                <NoTokenIcon tokenInitial={tx.baseSymbol.charAt(0)} width='30px' />
            </DefaultTooltip>
        );

    const quoteTokenLogoComponent =
        quoteTokenLogo !== '' ? (
            <DefaultTooltip
                interactive
                title={
                    <div>
                        <p>{quoteTokenSymbol}</p>
                        {/* <NavLink to={`/${ownerId}`}>View Account</NavLink> */}
                    </div>
                }
                placement={'top'}
                arrow
                enterDelay={400}
                leaveDelay={200}
            >
                <img src={quoteTokenLogo} alt='quote token' width='15px' />
            </DefaultTooltip>
        ) : (
            <DefaultTooltip
                interactive
                title={
                    <div>
                        <p>{quoteTokenSymbol}</p>
                        {/* <NavLink to={`/${ownerId}`}>View Account</NavLink> */}
                    </div>
                }
                placement={'top'}
                arrow
                enterDelay={400}
                leaveDelay={200}
            >
                <NoTokenIcon tokenInitial={tx.quoteSymbol.charAt(0)} width='30px' />
            </DefaultTooltip>
        );

    // portfolio page li element ---------------
    const accountTokenImages = (
        <li className={styles.token_images_account}>
            {baseTokenLogoComponent}
            {quoteTokenLogoComponent}
            {/* <p>hello</p> */}
        </li>
    );

    const poolName = (
        <li className='base_color'>
            {baseTokenSymbol} / {quoteTokenSymbol}
        </li>
    );
    // end of portfolio page li element ---------------
    return (
        <ul
            className={`${styles.row_container} ${activeTransactionStyle} ${userPositionStyle}`}
            onClick={() =>
                tx.id === currentTxActiveInTransactions
                    ? null
                    : setCurrentTxActiveInTransactions('')
            }
            id={txDomId}
        >
            {isOnPortfolioPage && accountTokenImages}
            {isOnPortfolioPage && !showSidebar && poolName}
            {!showColumns && IDWithTooltip}
            {!showColumns && walletWithTooltip}
            {showColumns && (
                <li data-label='id'>
                    <p className='base_color'>{txHashTruncated}</p>{' '}
                    <p className={usernameStyle} style={{ textTransform: 'lowercase' }}>
                        {userNameToDisplay}
                    </p>
                </li>
            )}
            {!ipadView &&
                (tx.entityType === 'liqchange' ? (
                    tx.positionType === 'ambient' ? (
                        <li onClick={openDetailsModal} data-label='price' className={sideTypeStyle}>
                            ambient
                        </li>
                    ) : (
                        <li onClick={openDetailsModal} data-label='price' className={sideTypeStyle}>
                            <p>{truncatedLowDisplayPrice}</p>
                            <p>{truncatedHighDisplayPrice}</p>
                        </li>
                    )
                ) : (
                    <li onClick={openDetailsModal} data-label='price' className={sideTypeStyle}>
                        {truncatedDisplayPrice || '…'}
                    </li>
                ))}

            {!showColumns && (
                <li onClick={openDetailsModal} data-label='side' className={sideTypeStyle}>
                    {tx.entityType === 'liqchange' || tx.entityType === 'limitOrder'
                        ? `${sideType}`
                        : `${sideType} ${sideCharacter}`}
                </li>
            )}
            {!showColumns && (
                <li onClick={openDetailsModal} data-label='type' className={sideTypeStyle}>
                    {type}
                </li>
            )}
            {showColumns && !ipadView && (
                <li data-label='side-type' className={sideTypeStyle}>
                    <p>{sideType}</p>
                    <p>{type}</p>
                </li>
            )}
            <li onClick={openDetailsModal} data-label='value' className='gradient_text'>
                {' '}
                {usdValue}
            </li>

            {!showColumns && (
                <li onClick={openDetailsModal} data-label={baseTokenSymbol} className='color_white'>
                    <p>{baseDisplay}</p>
                </li>
            )}
            {!showColumns && (
                <li
                    onClick={openDetailsModal}
                    data-label={quoteTokenSymbol}
                    className='color_white'
                >
                    <p>{quoteDisplay}</p>
                </li>
            )}
            {showColumns && (
                <li data-label={baseTokenSymbol + quoteTokenSymbol} className='color_white'>
                    <p className={styles.align_center}>
                        {' '}
                        {baseTokenLogoComponent}
                        {baseDisplay}{' '}
                    </p>

                    <p className={styles.align_center}>
                        {' '}
                        {quoteTokenLogoComponent}
                        {quoteDisplay}
                    </p>
                </li>
            )}

            <li data-label='menu'>
                {/* <OrdersMenu limitOrder={limitOrder} {...orderMenuProps} /> */}
                <TransactionsMenu
                    userPosition={userNameToDisplay === 'You'}
                    tx={tx}
                    blockExplorer={blockExplorer}
                    showSidebar={props.showSidebar}
                    openGlobalModal={props.openGlobalModal}
                    closeGlobalModal={props.closeGlobalModal}
                    isOnPortfolioPage={props.isOnPortfolioPage}
                />
            </li>
        </ul>
    );
}
