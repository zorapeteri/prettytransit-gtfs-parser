export default function getRatios(numbers: number[], share = 1) {
  const total = numbers.reduce((acc, val) => acc + val)
  return numbers.map((x) => (x / total) * share)
}
