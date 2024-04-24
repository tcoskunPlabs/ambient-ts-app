import { CandleDataIF } from '../../../ambient-utils/types';

export function filterCandleWithTransaction(data: CandleDataIF[]) {
    const filteredByNonTransaction = data
        .sort((a, b) => a.time - b.time)
        .map((item, index, array) => {
            let isShowData = false;

            if (
                index === 0 ||
                index === array.length - 1 ||
                index === array.length - 2
            ) {
                isShowData = true;
            }

            const previousTvlData = index > 0 ? array[index - 1].tvlData : null;

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
