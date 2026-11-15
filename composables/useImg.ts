export function hideBrokenImage(e: Event) {
  ;(e.target as HTMLImageElement).style.display = 'none'
}

// images that error before hydration never fire the @error listener — sweep them on mount
export function useImgFallback() {
  if (import.meta.client) {
    onMounted(() => {
      for (const img of document.querySelectorAll('img')) {
        if (img.complete && img.naturalWidth === 0) img.style.display = 'none'
      }
    })
  }
  return hideBrokenImage
}
