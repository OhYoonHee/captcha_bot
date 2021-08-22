export class Mep<T, V> extends Map<T, V> {
    toArray() : {key : T, value : V}[] {
        return Array.from(this, ([key, value]) => ({key, value}));
    }
}