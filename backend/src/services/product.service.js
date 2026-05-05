const { readJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

const DELIVERY_RADIUS_KM = 5;

function toCoordinate(value) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function getProductShopLocation(product = {}) {
  const latitude = toCoordinate(product.shopLatitude ?? product.shop?.latitude ?? product.latitude);
  const longitude = toCoordinate(product.shopLongitude ?? product.shop?.longitude ?? product.longitude);
  if (latitude === null || longitude === null) return null;
  return { latitude, longitude };
}

function getDistanceKm(from, to) {
  const earthRadiusKm = 6371;
  const toRadians = degrees => degrees * Math.PI / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getProducts({ search = "", category = "all", sort = "featured", latitude, longitude }) {
  let products = await readJson("products.json", []);
  const query = search.trim().toLowerCase();
  const userLocation = {
    latitude: toCoordinate(latitude),
    longitude: toCoordinate(longitude)
  };

  if (userLocation.latitude !== null && userLocation.longitude !== null) {
    products = products
      .map(product => {
        const shopLocation = getProductShopLocation(product);
        if (!shopLocation) return null;
        const distanceKm = getDistanceKm(userLocation, shopLocation);
        return distanceKm <= DELIVERY_RADIUS_KM
          ? { ...product, distanceKm: Number(distanceKm.toFixed(2)) }
          : null;
      })
      .filter(Boolean);
  }

  if (category && category !== "all") {
    products = products.filter(product => product.type === category);
  }

  if (query) {
    products = products.filter(product => {
      const searchable = `${product.name} ${product.fragrance} ${product.sub} ${product.type}`.toLowerCase();
      return searchable.includes(query);
    });
  }

  if (sort === "low") products.sort((a, b) => a.price - b.price);
  if (sort === "high") products.sort((a, b) => b.price - a.price);

  return products;
}

async function getProductById(productId) {
  const products = await readJson("products.json", []);
  const product = products.find(item => item.id === productId);
  if (!product) throw new ApiError(404, "Product not found.");
  return product;
}

module.exports = { getProducts, getProductById };
