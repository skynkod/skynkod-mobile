import * as WebBrowser from 'expo-web-browser'

// Where to buy a product. Links search the retailer for the product; when an
// affiliate ID is set in .env.local the link earns a commission. Commission
// never changes a verdict, and the app always says so next to the links.
//   EXPO_PUBLIC_AMAZON_TAG       Amazon Associates tag (amazon.fr)
//   EXPO_PUBLIC_AWIN_ID          Awin publisher ID (Sephora, Lookfantastic)
//   EXPO_PUBLIC_YESSTYLE_RCO     YesStyle affiliate code
const AMAZON_TAG = process.env.EXPO_PUBLIC_AMAZON_TAG
const AWIN_ID = process.env.EXPO_PUBLIC_AWIN_ID
const YESSTYLE_RCO = process.env.EXPO_PUBLIC_YESSTYLE_RCO

// Awin merchant IDs, from each programme's page once approved.
const AWIN_MERCHANTS = {
  sephora: process.env.EXPO_PUBLIC_AWIN_SEPHORA,
  lookfantastic: process.env.EXPO_PUBLIC_AWIN_LOOKFANTASTIC,
}

const viaAwin = (merchant, url) =>
  AWIN_ID && AWIN_MERCHANTS[merchant]
    ? `https://www.awin1.com/cread.php?awinmid=${AWIN_MERCHANTS[merchant]}&awinaffid=${AWIN_ID}&ued=${encodeURIComponent(url)}`
    : url

const KBEAUTY = /cosrx|beauty of joseon|anua|round lab|skin1004|torriden|isntree|some by mi|laneige|innisfree|klairs|medicube|mixsoon|etude|purito|haruharu|i'm from/i

export const RETAILERS = [
  { id: 'sephora', name: 'Sephora', link: q => viaAwin('sephora', `https://www.sephora.fr/recherche?q=${encodeURIComponent(q)}`) },
  { id: 'lookfantastic', name: 'Lookfantastic', link: q => viaAwin('lookfantastic', `https://www.lookfantastic.fr/search?q=${encodeURIComponent(q)}`) },
  { id: 'amazon', name: 'Amazon', link: q => `https://www.amazon.fr/s?k=${encodeURIComponent(q)}${AMAZON_TAG ? `&tag=${AMAZON_TAG}` : ''}` },
  { id: 'yesstyle', name: 'YesStyle', kbeautyOnly: true, link: q => `https://www.yesstyle.com/en/list.html?q=${encodeURIComponent(q)}${YESSTYLE_RCO ? `&rco=${YESSTYLE_RCO}` : ''}` },
]

// Retailers that make sense for this product (YesStyle only for K-beauty).
export const retailersFor = product =>
  RETAILERS.filter(r => !r.kbeautyOnly || KBEAUTY.test(`${product?.brand || ''}`))

export const openRetailer = (retailer, product) =>
  WebBrowser.openBrowserAsync(retailer.link(`${product.brand || ''} ${product.name || ''}`.trim()))
