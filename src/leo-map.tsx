import {Keyable} from "./keyable";

export class LeoMap<K extends Keyable, V> implements Map<K, V> {

    private readonly valueMap: Map<string, V>;
    private readonly keyMap: Map<string, K>;

    constructor(existingMap?: LeoMap<K, V>) {
        this.valueMap = new Map();
        this.keyMap = new Map();

        if (existingMap !== undefined) {
            existingMap.forEach((v, k) => {
                this.set(k, v);
            });
        }
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

    compute(key: K, ifPresent: (cur: V) => V | undefined, ifAbsent: () => V | undefined): V | undefined {
        const curValue = this.valueMap.get(key.toKey());

        if (curValue) {
            const newValue = ifPresent(curValue);
            if (newValue) {
                this.set(key, newValue);
            } else {
                this.delete(key);
            }
            return newValue;
        } else {
            const newValue = ifAbsent();
            if (newValue) {
                this.set(key, newValue);
            } else {
                this.delete(key);
            }
            return newValue;
        }
    }

    computeForEach(computefn: (value: V, key: K, map: Map<K, V>) => V): void {
        this.valueMap.forEach((value, keyString, map) => {
            const key = this.keyMap.get(keyString)!;
            this.set(key, computefn(value, key, this));
        });
    }

    map(mapperfn: (value: V, key: K) => [K, V]): LeoMap<K, V> {
        const newMap = new LeoMap<K, V>();
        this.forEach((v, k) => {
            const mapped = mapperfn(v, k);
            newMap.set(mapped[0], mapped[1]);
        });
        return newMap;
    }
}
