const { readJson } = require("../lib/jsonStore");
const { env } = require("../config/env");

function normalizeTerms(values = []) {
  return values
    .flatMap(value => String(value || "").toLowerCase().split(/\s+/))
    .filter(Boolean);
}

function scoreProduct(product, context) {
  const wishlist = new Set(context.wishlistIds || []);
  const cart = new Set(context.cartProductIds || []);
  const viewed = new Set(context.viewedProductIds || []);
  const terms = normalizeTerms(context.searchTerms || []);
  const searchable = `${product.name} ${product.type} ${product.sub} ${product.fragrance}`.toLowerCase();
  let score = Number(product.rating || 0);

  if (wishlist.has(product.id)) score += 8;
  if (viewed.has(product.id)) score += 5;
  if (cart.has(product.id)) score -= 10;
  if ((context.preferredCategories || []).includes(product.type)) score += 4;
  score += terms.filter(term => searchable.includes(term)).length * 3;
  if (String(product.tag || "").toLowerCase().includes("deal")) score += 2;

  return score;
}

async function getPersonalizedExperience(context = {}) {
  const products = await readJson("products.json", []);
  const scored = products
    .map(product => ({ ...product, personalizationScore: scoreProduct(product, context) }))
    .sort((a, b) => b.personalizationScore - a.personalizationScore || Number(b.rating || 0) - Number(a.rating || 0));

  const recommendedProducts = scored.slice(0, 6);
  const topCategory = recommendedProducts[0]?.type || "produce";
  const banners = [
    {
      id: "fresh-fast",
      title: "Fresh stock near you",
      text: "Browse fast-moving groceries from the live catalog and restock your cart quickly.",
      cta: "Shop now",
      href: "shop.html",
      segment: topCategory
    },
    {
      id: "free-delivery",
      title: "Free delivery above Rs. 499",
      text: "Add staples, dairy, snacks, or home care refills to unlock free delivery.",
      cta: "Complete cart",
      href: "cart.html",
      segment: "value"
    }
  ];

  const offers = recommendedProducts.slice(0, 3).map(product => ({
    id: `offer-${product.id}`,
    productId: product.id,
    title: `${product.name} pick`,
    text: `Recommended from your ${product.type} aisle activity.`,
    price: product.price
  }));

  return {
    banners,
    offers,
    recommendedProducts,
    config: {
      cdnBaseUrl: env.cdnBaseUrl,
      googleAnalyticsId: env.googleAnalyticsId,
      heatmapEnabled: env.heatmapEnabled,
      sessionRecordingEnabled: env.sessionRecordingEnabled
    }
  };
}

module.exports = { getPersonalizedExperience };
