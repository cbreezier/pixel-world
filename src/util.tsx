export function getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
}

export function getRandomIntBetween(min: number, max: number) {
    return min + getRandomInt(max - min);
}

export function weightedRandom<T>(inputs: [number, T][]): T {
    inputs = inputs.map(input => [Math.max(input[0], 0), input[1]]);

    const total = inputs.reduce((acc, cur) => acc + cur[0], 0);

    let randomInt = getRandomInt(total);
    for (const input of inputs) {
        if (randomInt <= input[0]) {
            return input[1];
        }

        randomInt -= input[0];
    }

    console.error("Should never reach here");
    return inputs[0][1];
}

export function enforceBetween(n: number, min: number, max: number) {
    return Math.max(Math.min(n, max), min);
}
