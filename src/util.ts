const WOFF = 'application/font-woff'
const JPEG = 'image/jpeg'
const mimes: { [key: string]: string } = {
  woff: WOFF,
  woff2: WOFF,
  ttf: 'application/font-truetype',
  eot: 'application/vnd.ms-fontobject',
  png: 'image/png',
  jpg: JPEG,
  jpeg: JPEG,
  gif: 'image/gif',
  tiff: 'image/tiff',
  svg: 'image/svg+xml',
}

export function getExtension(url: string): string {
  const match = /\.([^./]*?)$/g.exec(url)
  return match ? match[1] : ''
}

export function getMimeType(url: string): string {
  const extension = getExtension(url).toLowerCase()
  return mimes[extension] || ''
}

export function fetchWithTimeout(
  window: Window,
  url: string,
  timeoutInMs = 3000,
): Promise<Response> {
  const fetchAbortController = new AbortController()
  const fetchTimeoutId = setTimeout(() => {
    fetchAbortController.abort()
    console.warn(
      `Fetch exceeded the defined timeout of ${timeoutInMs}ms. Requested url was ${url}`,
    )
  }, timeoutInMs)
  return window
    .fetch(url, {
      signal: fetchAbortController.signal,
    })
    .finally(() => clearTimeout(fetchTimeoutId))
}

export function resolveUrl(
  url: string,
  baseUrl: string | null,
  document: Document,
  window: Window,
): string {
  // url is absolute already
  if (url.match(/^[a-z]+:\/\//i)) {
    return url
  }

  // url is absolute already, without protocol
  if (url.match(/^\/\//)) {
    return window.location.protocol + url
  }

  // dataURI, mailto:, tel:, etc.
  if (url.match(/^[a-z]+:/i)) {
    return url
  }

  const doc = document.implementation.createHTMLDocument()
  const base = doc.createElement('base')
  const a = doc.createElement('a')

  doc.head.appendChild(base)
  doc.body.appendChild(a)

  if (baseUrl) {
    base.href = baseUrl
  }

  a.href = url

  return a.href
}

export function isDataUrl(url: string) {
  return url.search(/^(data:)/) !== -1
}

export function makeDataUrl(content: string, mimeType: string) {
  return `data:${mimeType};base64,${content}`
}

export function parseDataUrlContent(dataURL: string) {
  return dataURL.split(/,/)[1]
}

export const uuid = (function uuid() {
  // generate uuid for className of pseudo elements.
  // We should not use GUIDs, otherwise pseudo elements sometimes cannot be captured.
  let counter = 0

  // ref: http://stackoverflow.com/a/6248722/2519373
  const random = () =>
    // eslint-disable-next-line no-bitwise
    `0000${((Math.random() * 36 ** 4) << 0).toString(36)}`.slice(-4)

  return () => {
    counter += 1
    return `u${random()}${counter}`
  }
})()

export const delay =
  <T>(ms: number) =>
  (args: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(args), ms))

export function toArray<T>(arrayLike: any): T[] {
  const arr: T[] = []

  for (let i = 0, l = arrayLike.length; i < l; i += 1) {
    arr.push(arrayLike[i])
  }

  return arr
}

function px(node: HTMLElement, styleProperty: string, window: Window) {
  const val = window.getComputedStyle(node).getPropertyValue(styleProperty)
  return parseFloat(val.replace('px', ''))
}

export function getNodeWidth(node: HTMLElement, window: Window) {
  const leftBorder = px(node, 'border-left-width', window)
  const rightBorder = px(node, 'border-right-width', window)
  return node.clientWidth + leftBorder + rightBorder
}

export function getNodeHeight(node: HTMLElement, window: Window) {
  const topBorder = px(node, 'border-top-width', window)
  const bottomBorder = px(node, 'border-bottom-width', window)
  return node.clientHeight + topBorder + bottomBorder
}

export function getPixelRatio(window: Window) {
  let ratio

  let FINAL_PROCESS
  try {
    FINAL_PROCESS = process
  } catch (e) {
    // pass
  }

  const val =
    FINAL_PROCESS && FINAL_PROCESS.env
      ? FINAL_PROCESS.env.devicePixelRatio
      : null
  if (val) {
    ratio = parseInt(val, 10)
    if (Number.isNaN(ratio)) {
      ratio = 1
    }
  }
  return ratio || window.devicePixelRatio || 1
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  window: Window,
): Promise<Blob | null> {
  if (canvas.toBlob) {
    return new Promise((resolve) => canvas.toBlob(resolve))
  }

  return new Promise((resolve) => {
    const binaryString = window.atob(canvas.toDataURL().split(',')[1])
    const len = binaryString.length
    const binaryArray = new Uint8Array(len)

    for (let i = 0; i < len; i += 1) {
      binaryArray[i] = binaryString.charCodeAt(i)
    }

    resolve(new Blob([binaryArray], { type: 'image/png' }))
  })
}

export function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.crossOrigin = 'anonymous'
    img.decoding = 'sync'
    img.src = url
  })
}

export async function svgToDataURL(svg: SVGElement): Promise<string> {
  return Promise.resolve()
    .then(() => new XMLSerializer().serializeToString(svg))
    .then(encodeURIComponent)
    .then((html) => `data:image/svg+xml;charset=utf-8,${html}`)
}

export async function nodeToDataURL(
  node: HTMLElement,
  width: number,
  height: number,
  document: Document,
): Promise<string> {
  const xmlns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(xmlns, 'svg')
  const foreignObject = document.createElementNS(xmlns, 'foreignObject')

  svg.setAttribute('width', `${width}`)
  svg.setAttribute('height', `${height}`)
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

  foreignObject.setAttribute('width', '100%')
  foreignObject.setAttribute('height', '100%')
  foreignObject.setAttribute('x', '0')
  foreignObject.setAttribute('y', '0')
  foreignObject.setAttribute('externalResourcesRequired', 'true')

  svg.appendChild(foreignObject)
  foreignObject.appendChild(node)

  return svgToDataURL(svg)
}
