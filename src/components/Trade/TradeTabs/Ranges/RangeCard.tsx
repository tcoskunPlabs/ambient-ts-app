import styles from './RangeCard.module.css';
import TokenQty from '../../../Global/Tabs/TokenQty/TokenQty';
import WalletAndId from '../../../Global/Tabs/WalletAndID/WalletAndId';
import RangeStatus from '../../../Global/RangeStatus/RangeStatus';
import RangeMinMax from '../../../Global/Tabs/RangeMinMax/RangeMinMax';
import Apy from '../../../Global/Tabs/Apy/Apy';
import { PositionIF } from '../../../../utils/interfaces/PositionIF';
import { ambientPosSlot, concPosSlot } from '@crocswap-libs/sdk';
import RangesMenu from '../../../Global/Tabs/TableMenu/TableMenuComponents/RangesMenu';
import { ethers } from 'ethers';
import { useEffect, Dispatch, SetStateAction } from 'react';
// import { formatAmount } from '../../../../utils/numbers';
import getUnicodeCharacter from '../../../../utils/functions/getUnicodeCharacter';

interface RangeCardProps {
    provider: ethers.providers.Provider | undefined;
    chainId: string;
    portfolio?: boolean;
    notOnTradeRoute?: boolean;
    position: PositionIF;
    isAllPositionsEnabled: boolean;
    tokenAAddress: string;
    tokenBAddress: string;
    isAuthenticated: boolean;
    account?: string;
    isDenomBase: boolean;
    lastBlockNumber: number;
    currentPositionActive: string;
    setCurrentPositionActive: Dispatch<SetStateAction<string>>;
}

export default function RangeCard(props: RangeCardProps) {
    const {
        provider,
        chainId,
        position,
        // isAllPositionsEnabled,
        tokenAAddress,
        tokenBAddress,
        // account,
        // notOnTradeRoute,
        // isAuthenticated,
        account,
        lastBlockNumber,
        currentPositionActive,
        setCurrentPositionActive,
    } = props;

    // -------------------------------POSITION HASH------------------------

    let posHash;
    if (position.positionType == 'ambient') {
        posHash = ambientPosSlot(position.user, position.base, position.quote, 36000);
    } else {
        posHash = concPosSlot(
            position.user,
            position.base,
            position.quote,
            position.bidTick,
            position.askTick,
            36000,
        );
    }

    // -------------------------------END OF POSITION HASH------------------------

    // -----------------------------POSITIONS RANGE--------------------
    const isPositionInRange = position.isPositionInRange;

    // ----------------------------------END OF POSITIONS RANGE-------------------

    // --------------------SELECTED TOKEN FUNCTIONALITY---------------------------
    // const ownerId = position ? position.user : null;

    const positionBaseAddressLowerCase = position.base.toLowerCase();
    const positionQuoteAddressLowerCase = position.quote.toLowerCase();

    const tokenAAddressLowerCase = tokenAAddress.toLowerCase();
    const tokenBAddressLowerCase = tokenBAddress.toLowerCase();

    const positionMatchesSelectedTokens =
        (positionBaseAddressLowerCase === tokenAAddressLowerCase ||
            positionQuoteAddressLowerCase === tokenAAddressLowerCase) &&
        (positionBaseAddressLowerCase === tokenBAddressLowerCase ||
            positionQuoteAddressLowerCase === tokenBAddressLowerCase);

    const accountAddress = account ? account.toLowerCase() : null;
    const userMatchesConnectedAccount = accountAddress === position.user.toLowerCase();

    // const positionOwnedByConnectedAccount = ownerId === accountAddress;

    // -------------------- ENDSELECTED TOKEN FUNCTIONALITY---------------------------

    // ---------------------------------POSITIONS MIN AND MAX RANGE--------------------

    const baseTokenCharacter = position.baseSymbol ? getUnicodeCharacter(position.baseSymbol) : '';
    const quoteTokenCharacter = position.quoteSymbol
        ? getUnicodeCharacter(position.quoteSymbol)
        : '';

    const minRange = props.isDenomBase
        ? quoteTokenCharacter + position.lowRangeDisplayInBase
        : baseTokenCharacter + position.lowRangeDisplayInQuote;
    const maxRange = props.isDenomBase
        ? quoteTokenCharacter + position.highRangeDisplayInBase
        : baseTokenCharacter + position.highRangeDisplayInQuote;

    const ambientMinOrNull = position.positionType === 'ambient' ? '0' : minRange;
    const ambientMaxOrNull = position.positionType === 'ambient' ? '∞' : maxRange;

    // ---------------------------------END OF POSITIONS MIN AND MAX RANGE--------------------

    // --------------------------REMOVE RANGE PROPS-------------------------------
    const rangeDetailsProps = {
        provider: provider,
        chainId: chainId,
        poolIdx: position.poolIdx,
        isPositionInRange: isPositionInRange,
        isAmbient: position.positionType === 'ambient',
        user: position.user,
        bidTick: position.bidTick,
        askTick: position.askTick,
        baseTokenSymbol: position.baseSymbol,
        baseTokenDecimals: position.baseDecimals,
        quoteTokenSymbol: position.quoteSymbol,
        quoteTokenDecimals: position.quoteDecimals,
        lowRangeDisplay: ambientMinOrNull,
        highRangeDisplay: ambientMaxOrNull,
        baseTokenLogoURI: position.baseTokenLogoURI,
        quoteTokenLogoURI: position.quoteTokenLogoURI,
        isDenomBase: props.isDenomBase,
        baseTokenAddress: props.position.base,
        quoteTokenAddress: props.position.quote,
        lastBlockNumber: lastBlockNumber,
        positionApy: position.apy,
    };

    const positionDomId =
        position.positionStorageSlot === currentPositionActive
            ? `position-${position.positionStorageSlot}`
            : '';

    function scrollToDiv() {
        const element = document.getElementById(positionDomId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }

    useEffect(() => {
        position.positionStorageSlot === currentPositionActive ? scrollToDiv() : null;
    }, [currentPositionActive]);

    const activePositionStyle =
        position.positionStorageSlot === currentPositionActive ? styles.active_position_style : '';

    if (!positionMatchesSelectedTokens) return null;
    return (
        <li
            className={`${styles.main_container} ${activePositionStyle}`}
            onClick={() =>
                position.positionStorageSlot === currentPositionActive
                    ? null
                    : setCurrentPositionActive('')
            }
            id={positionDomId}
        >
            <div className={styles.row_container}>
                {/* ------------------------------------------------------ */}

                <WalletAndId
                    ownerId={position.user}
                    posHash={posHash as string}
                    ensName={position.ensResolution ? position.ensResolution : null}
                    isOwnerActiveAccount={userMatchesConnectedAccount}
                />

                {/* ------------------------------------------------------ */}
                <RangeMinMax min={ambientMinOrNull} max={ambientMaxOrNull} />
                {/* ------------------------------------------------------ */}

                <TokenQty
                    baseQty={position.positionLiqBaseTruncated}
                    quoteQty={position.positionLiqQuoteTruncated}
                    baseTokenSymbol={position.baseSymbol}
                    quoteTokenSymbol={position.quoteSymbol}
                />
                {/* ------------------------------------------------------ */}
                <Apy amount={position.apy ?? 0} />
                {/* ------------------------------------------------------ */}
                <RangeStatus
                    isInRange={isPositionInRange}
                    isAmbient={position.positionType === 'ambient'}
                />
            </div>

            <div className={styles.menu_container}>
                <RangesMenu
                    userMatchesConnectedAccount={userMatchesConnectedAccount}
                    rangeDetailsProps={rangeDetailsProps}
                    posHash={posHash as string}
                    positionData={position}
                />
            </div>
        </li>
    );
}
