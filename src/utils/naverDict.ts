/** 네이버 영어사전에서 해당 단어를 검색하는 페이지 링크를 만든다. (공식 API가 아니라 검색 URL) */
export function naverDictUrl(word: string): string {
  return `https://en.dict.naver.com/#/search?query=${encodeURIComponent(word.trim())}`
}
