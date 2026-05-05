const { readJson } = require("../lib/jsonStore");
const { ApiError } = require("../lib/ApiError");

async function getProducts({ search = "", category = "all", sort = "featured" }) {
  let products = await readJson("products.json", []);
  const query = search.trim().toLowerCase();

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
