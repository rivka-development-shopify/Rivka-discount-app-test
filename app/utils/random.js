export function randomKey(length) {
  return Array.from({length: length}).map(() => (Math.random() + 1).toString(36).substring(7).charAt(1)).join('')
}

export default {
  randomKey
}
