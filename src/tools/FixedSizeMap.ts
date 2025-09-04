export class FixedSizeMap<K, V> {
  private readonly map: Map<K, V>
  private keys: K[]
  private currIndex: number

  /**
   * The max number of keys this cache can hold
   * @param size
   */
  constructor(size: number) {
    if (typeof size !== 'number' || size < 1 || !Number.isInteger(size)) {
      throw new Error('Cache size must be an integer greater than 0')
    }

    this.map = new Map()
    this.keys = Array.from({ length: size })
    this.currIndex = 0
  }

  /**
   * Adds a key and pairs it with a value
   * If this is already at maximum occupation, this will remove the oldest element.
   * @param key
   * @param value
   */
  add(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.set(key, value)
      return
    }

    if (this.keys[this.currIndex] != null) {
      this.map.delete(this.keys[this.currIndex])
    }

    this.keys[this.currIndex] = key
    this.currIndex = (this.currIndex + 1) % this.keys.length
    this.map.set(key, value)
  }

  /**
   * Checks if this cache contains a key
   * @param key
   */
  contains(key: K): boolean {
    return this.map.has(key)
  }

  /**
   * Retrieves a value from this cache corresponding to the specified key
   * @param key
   */
  get(key: K): V | undefined {
    return this.map.get(key)
  }

  /**
   * Removed the key value entry from this cache corresponding to the specified key
   * @param key
   */
  remove(key: K): void {
    this.map.delete(key)
    const index = this.keys.indexOf(key)
    if (index !== -1) {
      this.keys[index] = undefined as any
    }
  }

  clear(): void {
    this.map.clear()
    this.keys = Array.from({ length: this.keys.length })
    this.currIndex = 0
  }

  /**
   * Returns an iterator of [key, value] pairs for the cache
   */
  entries(): IterableIterator<[K, V]> {
    return this.map.entries()
  }
}
