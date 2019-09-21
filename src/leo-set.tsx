import {Keyable} from "./keyable";

export class LeoSet<V extends Keyable> implements Set<V> {
    private readonly keyMap: Map<string, V>;

    constructor() {
        this.keyMap = new Map();
    }

    get size(): number {
        return this.keyMap.size;
    }

    get [Symbol.toStringTag](): string {
        throw new Error('not implemented');
    }

    [Symbol.iterator](): IterableIterator<V> {
        return this.keyMap.values();
    }

    add(value: V): this {
        this.keyMap.set(value.toKey(), value);
        return this;
    }

    clear(): void {
        this.keyMap.clear();
    }

    delete(value: V): boolean {
        const hadValue = this.keyMap.has(value.toKey());
        this.keyMap.delete(value.toKey());

        return hadValue;
    }

    entries(): IterableIterator<[V, V]> {
        throw new Error('not implemented');
    }

    forEach(callbackfn: (value: V, value2: V, set: Set<V>) => void, thisArg?: any): void {
        this.keyMap.forEach((v) => {
            callbackfn(v, v, this);
        });
    }

    has(value: V): boolean {
        return this.keyMap.has(value.toKey());
    }

    keys(): IterableIterator<V> {
        return this.keyMap.values();
    }

    values(): IterableIterator<V> {
        return this.keyMap.values();
    }
}
