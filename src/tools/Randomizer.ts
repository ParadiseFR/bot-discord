export class Randomizer {
  public static getRandomNumber(count: number): number {
    return Math.floor(Math.random() * count)
  }

  public static getRandomElement<T>(elements: T[]): T {
    return elements[this.getRandomNumber(elements.length)]
  }

  public static getRandomElements<T>(elements: T[], count: number): T[] {
    const result: T[] = Array.from({ length: count })
    let len = elements.length
    const taken: number[] = Array.from({ length: len })
    let i = count

    while (i > 0) {
      i--
      const x = this.getRandomNumber(len)
      result[i] = elements[x in taken ? taken[x] : x]
      taken[x] = --len in taken ? taken[len] : len
    }

    return result
  }
}
