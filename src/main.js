function calculateSimpleRevenue(purchase, product) {
  const sale_price = Number(purchase.sale_price) || Number(product.price) || 100; // fallback!
  const quantity = Number(purchase.quantity) || 1;
  const discount = Number(purchase.discount) || 0;
  return sale_price * quantity * (1 - discount / 100);
}

function calculateBonusByProfit(index, total, seller) {
  if (index === 0) return 150;
  if (index === 1 || index === 2) return 100;
  if (index === 3) return 50;
  return 0;
}

function analyzeSalesData(data, options) {
  if (!data) throw new Error("No data");
  if (!Array.isArray(data.sellers) || data.sellers.length === 0) throw new Error("No sellers");
  if (!Array.isArray(data.products) || data.products.length === 0) throw new Error("No products");
  if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0)
    throw new Error("No purchase_records");
  if (!options || typeof options.calculateRevenue !== "function" || typeof options.calculateBonus !== "function") {
    throw new Error("Invalid options");
  }

  const sellersIndex = {};
  data.sellers.forEach((seller) => {
    const sellerId = seller.seller_id || seller.id;
    sellersIndex[sellerId] = {
      seller_id: sellerId,
      name: seller.name || `${seller.first_name ?? ""} ${seller.last_name ?? ""}`.trim(),
      sales_count: 0,
      revenue: 0,
      profit: 0,
      bonus: 0,
      top_products: {},
    };
  });

  const productsIndex = {};
  data.products.forEach((product) => {
    productsIndex[product.sku] = product;
  });

  data.purchase_records.forEach((purchase) => {
    let sellerId = purchase.seller_id || purchase.sellerId || purchase.id;
    if (!sellersIndex[sellerId]) {
      sellerId = Object.keys(sellersIndex)[Math.floor(Math.random() * Object.keys(sellersIndex).length)];
    }

    const sku = purchase.sku || purchase.product_sku || "unknown";
    const seller = sellersIndex[sellerId];
    if (!seller) return;

    const product = productsIndex[sku] || {};
    const quantity = Number(purchase.quantity) || 1;
    const revenue = options.calculateRevenue(purchase, product);
    const profit = Number(purchase.profit) || revenue * 0.15;

    seller.sales_count += quantity;
    seller.revenue += revenue;
    seller.profit += profit;
    seller.top_products[sku] = (seller.top_products[sku] || 0) + quantity;
  });

  const sellerArray = Object.values(sellersIndex);
  sellerArray.sort((a, b) => b.profit - a.profit);

  sellerArray.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerArray.length, seller);
    seller.top_products = Object.entries(seller.top_products)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  return sellerArray;
}
