import TokenIcon from '../TokenIcon/TokenIcon';
import uriToHttp from '../../../utils/functions/uriToHttp';
import { PoolDataIF } from '../../../contexts/AnalyticsContext';
import styled, { css } from 'styled-components';

interface propsIF {
    pool: PoolDataIF;
    goToMarket: (tknA: string, tknB: string) => void;
}
interface TableCellProps {
    hidden?: boolean;
    sm?: boolean;
    lg?: boolean;
    xl?: boolean;
}
// Media queries
const media = {
    sm: '(min-width: 640px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
};
// Styles for media queries
const mediaStyles = {
    sm: css`
        @media ${media.sm} {
            display: table-cell;
        }
    `,
    lg: css`
        @media ${media.lg} {
            display: table-cell;
        }
    `,
    xl: css`
        @media ${media.xl} {
            display: table-cell;
        }
    `,
};
const FlexCenter = styled.div`
    display: flex;
    align-items: center;
`;

const TableRow = styled.tr`
    height: 40px;
    cursor: pointer;
    &:hover {
        background-color: var(--dark2);
    }
`;
const TableCell = styled.td<TableCellProps>`
    white-space: nowrap;
    color: var(--text1);
    text-align: right;

    ${({ hidden }) =>
        hidden &&
        css`
            display: none;
        `}

    ${({ sm }) => sm && mediaStyles.sm}
${({ lg }) => lg && mediaStyles.lg}
${({ xl }) => xl && mediaStyles.xl}
`;

const PoolNameWrapper = styled.p`
    margin-left: 1rem;
    @media (min-width: 640px) {
        display: none;
    }
`;

const TokenWrapper = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
`;

const FlexEnd = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
`;

const TradeButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--dark1);
    border: 1px solid var(--dark3);
    border-radius: 999px;
    cursor: pointer;
    width: 48px;
    height: 25px;

    &:hover {
        color: var(--accent1);
        border-color: var(--accent1);
    }
`;
export default function PoolRow(props: propsIF) {
    const { pool, goToMarket } = props;

    return (
        <TableRow
            onClick={() => goToMarket(pool.base.address, pool.quote.address)}
        >
            <TableCell>
                <FlexCenter>
                    <TokenWrapper>
                        <TokenIcon
                            src={uriToHttp(pool.base.logoURI)}
                            alt={'logo for token: ' + pool.base.name}
                            size='2xl'
                        />
                        <TokenIcon
                            src={uriToHttp(pool.quote.logoURI)}
                            alt={'logo for token: ' + pool.quote.name}
                            size='2xl'
                        />
                    </TokenWrapper>
                    <PoolNameWrapper>{pool.name}</PoolNameWrapper>
                </FlexCenter>
            </TableCell>
            <TableCell hidden sm>
                <p>{pool.name}</p>
            </TableCell>
            <TableCell hidden sm>
                <p>{pool.displayPrice}</p>
            </TableCell>
            <TableCell hidden sm>
                <p>
                    {!pool.tvl || pool.tvl.includes('NaN') ? '...' : pool.tvl}
                </p>
            </TableCell>
            <TableCell hidden xl>
                <p
                    style={{
                        color:
                            Number(pool.apy) > 0
                                ? 'var(--positive)'
                                : 'var(--negative)',
                    }}
                >
                    {pool.apy}
                </p>
            </TableCell>
            <TableCell>
                <p>
                    {!pool.volume || pool.volume.includes('NaN')
                        ? '...'
                        : pool.volume}
                </p>
            </TableCell>
            <TableCell hidden lg>
                <p
                    style={{
                        color:
                            pool.priceChange.includes('No') || !pool.priceChange
                                ? 'var(--text1)'
                                : pool.priceChange.startsWith('-')
                                ? 'var(--negative)'
                                : 'var(--positive)',
                    }}
                >
                    {!pool.priceChange || pool.priceChange.includes('NaN')
                        ? '...'
                        : pool.priceChange}
                </p>
            </TableCell>
            <TableCell>
                <FlexEnd>
                    <TradeButton>
                        <span style={{ padding: '0.25rem 0.5rem' }}>Trade</span>
                    </TradeButton>
                </FlexEnd>
            </TableCell>
        </TableRow>
    );
}
