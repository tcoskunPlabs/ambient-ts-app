import { useMemo, useRef, useState } from 'react';
import { auctionDataIF } from '../mockAuctionData';

export type auctionSorts =
    | 'createdAt'
    | 'recent'
    | 'ticker'
    | 'marketCap'
    | 'timeLeft';

export interface sortDetailsIF {
    sortBy: auctionSorts;
    isReversed: boolean;
}

export interface sortedAuctionsIF {
    data: auctionDataIF[];
    active: auctionSorts;
    isReversed: boolean;
    update: (sortType: auctionSorts) => void;
    reverse: () => void;
}

export function useSortedAuctions(unsorted: auctionDataIF[]) {
    const [sorted, setSorted] = useState<auctionDataIF[]>(unsorted);

    const DEFAULT_SORT: auctionSorts = 'recent';
    const sortDetails = useRef<sortDetailsIF>({
        sortBy: DEFAULT_SORT,
        isReversed: false,
    });

    function sortByTicker(d: auctionDataIF[]): auctionDataIF[] {
        return [...d].sort((a: auctionDataIF, b: auctionDataIF) =>
            b.ticker.localeCompare(a.ticker),
        );
    }

    function sortByCreationTime(d: auctionDataIF[]): auctionDataIF[] {
        return d;
    }

    function sortByMarketCap(d: auctionDataIF[]): auctionDataIF[] {
        console.log('sorting by market cap');
        return [...d].sort(
            (a: auctionDataIF, b: auctionDataIF) => b.marketCap - a.marketCap,
        );
    }

    function updateSort(sortType: auctionSorts): void {
        const isNewSortType: boolean = sortType !== sortDetails.current.sortBy;
        if (isNewSortType) {
            let newlySortedData: auctionDataIF[];
            sortDetails.current.sortBy = sortType;
            switch (sortType) {
                case 'ticker':
                    newlySortedData = sortByTicker(unsorted);
                    break;
                case 'marketCap':
                    newlySortedData = sortByMarketCap(unsorted);
                    break;
                case 'createdAt':
                    newlySortedData = sortByCreationTime(unsorted);
                    break;
                default:
                    newlySortedData = unsorted;
                    break;
            }
            setSorted(newlySortedData);
        }
    }

    function reverseSort(): void {
        sortDetails.current.isReversed = !sortDetails.current.isReversed;
        setSorted([...sorted].reverse());
    }

    return useMemo<sortedAuctionsIF>(() => {
        return {
            data: sorted,
            active: sortDetails.current.sortBy,
            isReversed: sortDetails.current.isReversed,
            update: updateSort,
            reverse: reverseSort,
        };
    }, [sorted]);
}
