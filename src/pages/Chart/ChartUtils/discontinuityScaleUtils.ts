import { CandleDataIF } from '../../../ambient-utils/types';
export interface DiscontinuityProvider {
    distance(start: number, end: number): number;
    offset(location: number | Date, offset: number): number | Date;
    clampUp(d: number | Date): number | Date;
    clampDown(d: number | Date): number | Date;
    copy(): DiscontinuityProvider;
}

export function filterCandleWithTransaction(data: CandleDataIF[]) {
    const filteredByNonTransaction = data
        .sort((a, b) => a.time - b.time)
        .map((item, index, array) => {
            let isShowData = false;

            if (
                //                index === 0 ||
                index ===
                array.length - 1
            ) {
                isShowData = true;
            }

            const previousTvlData = index > 0 ? array[index - 1].tvlData : null;

            console.log(
                'item',
                item,
                new Date(item.time * 1000),
                item.volumeUSD,
                item.tvlData.tvl !== previousTvlData?.tvl,
            );

            if (
                !previousTvlData ||
                item.volumeUSD !== 0 ||
                item.tvlData.tvl !== previousTvlData.tvl
            ) {
                isShowData = true;
            }

            return {
                ...item,
                isShowData: isShowData,
                isFakeData: false,
            };
        });

    return filteredByNonTransaction.sort((a, b) => b.time - a.time);
}
