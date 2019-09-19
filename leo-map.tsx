export class LeoMap<K extends Keyable, V> implements Map<K, V> {

    private readonly valueMap: Map<string, V>;
    private readonly keyMap: Map<string, K>;

    constructor() {
        this.valueMap = new Map();
        this.keyMap = new Map();
    }

    clear(): void {
        this.valueMap.clear();
        this.keyMap.clear();
    }

    delete(key: K): boolean {
        return this.valueMap.delete(key.toKey());
        return this.keyMap.delete(key.toKey());
    }

    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        this.valueMap.forEach((value, keyString, map) => {
            callbackfn(value, this.keyMap.get(keyString)!, this);
        });
    }

    get(key: K): V | undefined {
        return this.valueMap.get(key.toKey());
    }

    has(key: K): boolean {
        return this.valueMap.has(key.toKey());
    }

    set(key: K, value: V): this {
        this.valueMap.set(key.toKey(), value);
        this.keyMap.set(key.toKey(), key);

        return this;
    }

    keys(): IterableIterator<K> {
        return this.keyMap.values();
    }

    values(): IterableIterator<V> {
        return this.valueMap.values();
    }

    get size(): number {
        return this.valueMap.size;
    }

    get [Symbol.toStringTag](): string {
        throw new Error("not implemented");
    }

    [Symbol.iterator](): IterableIterator<[K, V]> {
        throw new Error("not implemented");
    }

    entries(): IterableIterator<[K, V]> {
        throw new Error("not implemented");
    }

    getOrDefault(key: K, defaultValue: V): V {
        const value = this.valueMap.get(key.toKey());

        if (value === undefined) {
            return defaultValue;
        }

        return value;
    }

    putIfAbsent(key: K, value: V): V {
        const curValue = this.valueMap.get(key.toKey());

        if (curValue === undefined) {
            this.set(key, value);
            return value;
        }

        return curValue;
    }

    compute(key: K, ifPresent: (cur: V) => V, ifAbsent: () => V): V {
        const curValue = this.valueMap.get(key.toKey());

        if (curValue) {
            const newValue = ifPresent(curValue);
            this.set(key, newValue);
            return newValue;
        } else {
            const newValue = ifAbsent();
            this.set(key, newValue);
            return newValue;
        }
    }
}

export interface Keyable {
    toKey(): string;
}
