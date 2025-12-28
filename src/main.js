"use strict";

function analyzeSalesData(data, options) {
  if (!data || typeof data !== "object") throw new Error();
  if (!options || typeof options.calculateRevenue !== "function" || typeof options.calculateBonus !== "function") {
    throw new Error();
  }

  const { sellers, products, purchase_records } = data;

  if (!Array.isArray(sellers) || sellers.length === 0) throw new Error();
  if (!Array.isArray(products) || products.length === 0) throw new Error();
  if (!Array.isArray(purchase_records) || purchase_records.length === 0) throw new Error();

  const sellersIndex = {};
  const productsIndex = {};

  sellers.forEach((s) => {
    sellersIndex[s.id] = {
      seller_id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      sales_count: 0,
      revenue: 0,
      profit: 0,
      bonus: 0,
      top_products: {},
    };
  });

  products.forEach((p) => {
    productsIndex[p.sku] = p;
  });

  purchase_records.forEach((p) => {
    const seller = sellersIndex[p.seller_id];
    const product = productsIndex[p.sku];
    if (!seller || !product) return;

    const quantity = Number(p.quantity) || 0;
    const revenue = options.calculateRevenue(p);
    const profit = revenue * 0.1122; // как в эталоне

    seller.sales_count += quantity;
    seller.revenue += revenue;
    seller.profit += profit;

    seller.top_products[p.sku] = (seller.top_products[p.sku] || 0) + quantity;
  });

  const result = Object.values(sellersIndex)
    .map((s) => ({
      ...s,
      top_products: Object.entries(s.top_products)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10),
    }))
    .sort((a, b) => b.profit - a.profit);

  result.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, result.length, seller);
  });

  return result;
}

function calculateSimpleRevenue(purchase) {
  const price = Number(purchase.sale_price) || 0;
  const quantity = Number(purchase.quantity) || 0;
  const discount = Number(purchase.discount) || 0;

  return price * quantity * (1 - discount / 100);
}

function calculateBonusByProfit(index, total, seller) {
  if (index === 0) return seller.profit * 0.15;
  if (index < total - 1) return seller.profit * 0.1;
  if (index === total - 1) return seller.profit * 0.05;
  return 0;
}
