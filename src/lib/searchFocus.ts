const HEADER_OFFSET = 88

function placeSearchHigh() {
  const box = document.getElementById('smart-search-box')
  if (!box) return
  const top = box.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top: Math.max(0, top), behavior: 'auto' })
}

/** Keeps the search box near the top so the on-screen keyboard never covers it. */
export function keepSearchVisible() {
  const again = () => placeSearchHigh()
  window.setTimeout(again, 120)
  window.setTimeout(again, 350)
  window.setTimeout(again, 700)
  const vv = window.visualViewport
  if (vv) {
    const once = () => {
      placeSearchHigh()
      vv.removeEventListener('resize', once)
    }
    vv.addEventListener('resize', once)
  }
}

export function focusSmartSearch() {
  const input = document.getElementById('smart-search')
  if (!input) return
  placeSearchHigh()
  input.focus({ preventScroll: true })
  keepSearchVisible()
}
