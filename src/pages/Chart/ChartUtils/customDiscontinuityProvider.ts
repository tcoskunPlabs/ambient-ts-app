type Range = [number, number];

export interface DiscontinuityProvider {
    distance(start: number, end: number): number;
    offset(location: number | Date, offset: number): number | Date;
    clampUp(d: number | Date): number | Date;
    clampDown(d: number | Date): number | Date;
    copy(): DiscontinuityProvider;
}

const customDiscontinuityProvider = (
    ...ranges: Range[]
): DiscontinuityProvider => {
    const inRange = (number: number, range: Range): boolean =>
        number > range[0] && number < range[1];

    const surroundsRange = (inner: Range, outer: Range): boolean =>
        inner[0] >= outer[0] && inner[1] <= outer[1];

    const add = (value: number | Date, offset: number): number | Date =>
        value instanceof Date
            ? new Date(value.getTime() + offset)
            : value + offset;

    const identity: DiscontinuityProvider = {
        distance(start, end) {
            start = identity.clampUp(start) as number;
            end = identity.clampDown(end) as number;

            const surroundedRanges = ranges.filter((r) =>
                surroundsRange(r, [start, end]),
            );
            const rangeSizes = surroundedRanges.map((r) => r[1] - r[0]);

            return (
                end -
                start -
                rangeSizes.reduce((total, current) => total + current, 0)
            );
        },

        offset(location, offset) {
            if (offset > 0) {
                let currentLocation = identity.clampUp(location) as number;
                let offsetRemaining = offset;
                while (offsetRemaining > 0) {
                    const futureRanges = ranges
                        .filter((r) => r[0] > currentLocation)
                        .sort((a, b) => a[0] - b[0]);
                    if (futureRanges.length) {
                        const nextRange = futureRanges[0];
                        const delta = nextRange[0] - currentLocation;
                        if (delta > offsetRemaining) {
                            currentLocation = add(
                                currentLocation,
                                offsetRemaining,
                            ) as number;
                            offsetRemaining = 0;
                        } else {
                            currentLocation = nextRange[1];
                            offsetRemaining -= delta;
                        }
                    } else {
                        currentLocation = add(
                            currentLocation,
                            offsetRemaining,
                        ) as number;
                        offsetRemaining = 0;
                    }
                }
                return currentLocation;
            } else {
                let currentLocation = identity.clampDown(location) as number;
                let offsetRemaining = offset;
                while (offsetRemaining < 0) {
                    const futureRanges = ranges
                        .filter((r) => r[1] < currentLocation)
                        .sort((a, b) => b[0] - a[0]);
                    if (futureRanges.length) {
                        const nextRange = futureRanges[0];
                        const delta = nextRange[1] - currentLocation;
                        if (delta < offsetRemaining) {
                            currentLocation = add(
                                currentLocation,
                                offsetRemaining,
                            ) as number;
                            offsetRemaining = 0;
                        } else {
                            currentLocation = nextRange[0];
                            offsetRemaining -= delta;
                        }
                    } else {
                        currentLocation = add(
                            currentLocation,
                            offsetRemaining,
                        ) as number;
                        offsetRemaining = 0;
                    }
                }
                return currentLocation;
            }
        },

        clampUp(d) {
            return ranges.reduce(
                (value, range) =>
                    inRange(value as number, range) ? range[1] : value,
                d,
            );
        },

        clampDown(d) {
            return ranges.reduce(
                (value, range) =>
                    inRange(value as number, range) ? range[1] : value,
                d,
            );
        },

        copy() {
            return { ...identity };
        },
    };

    return identity;
};

export default customDiscontinuityProvider;
