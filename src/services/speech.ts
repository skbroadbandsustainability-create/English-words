/**
 * 단어 발음을 들려준다. 사전 API가 준 실제 발음 오디오가 있으면 그걸 재생하고,
 * 없거나 재생이 실패하면 브라우저 내장 음성 합성(TTS)으로 읽어준다.
 */
export function playPronunciation(word: string, audioUrl?: string) {
  if (audioUrl) {
    const audio = new Audio(audioUrl)
    audio.play().catch(() => speakWord(word))
    return
  }
  speakWord(word)
}

function speakWord(word: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}
