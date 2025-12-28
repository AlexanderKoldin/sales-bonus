/**
 * Главная функция анализа продаж
 * @param {Object} data
 * @param {Object} options
 * @returns {Array}
 */
function analyzeSalesData(data, options) {
  const sellersIndex = {};
  const productsIndex = {};

  data.sellers.forEach((seller) => {
    sellersIndex[seller.id] = {
      id: seller.id,
      name: seller.name || seller.title || `${seller.first_name ?? ""} ${seller.last_name ?? ""}`.trim(),
      sales_count: 0,
      revenue: 0,
      profit: 0,
      bonus: 0,
    };
  });

  data.products.forEach((product) => {
    productsIndex[product.sku] = product;
  });

  data.purchase_records.forEach((purchase) => {
    const sellerId = purchase.seller_id ?? purchase.sellerId ?? purchase.seller;

    const sku = purchase.sku ?? purchase.product_sku ?? purchase.productSku ?? purchase.product;

    const seller = sellersIndex[sellerId];
    if (!seller) return;

    const product = productsIndex[sku];
    if (!product) return;

    const quantity = Number(purchase.quantity ?? purchase.count ?? purchase.amount) || 0;

    const revenue = options.calculateRevenue(purchase, product);
    const profit = calculateProfit(purchase, revenue);

    seller.sales_count += quantity;
    seller.revenue += revenue;
    seller.profit += profit;
  });

  Object.values(sellersIndex).forEach((seller) => {
    seller.bonus = options.calculateBonus(seller);
  });

  return Object.values(sellersIndex).sort((a, b) => b.profit - a.profit);
}

function calculateSimpleRevenue(purchase, product) {
  const price = Number(product.price) || 0;

  const quantity = Number(purchase.quantity ?? purchase.count ?? purchase.amount) || 0;

  return price * quantity;
}

function calculateProfit(purchase, revenue) {
  if (purchase.profit != null) {
    return Number(purchase.profit) || 0;
  }

  return revenue * 0.15;
}

function calculateBonusByProfit(seller) {
  if (seller.profit > 100000) {
    return seller.profit * 0.1;
  }

  if (seller.profit > 50000) {
    return seller.profit * 0.07;
  }

  if (seller.profit > 10000) {
    return seller.profit * 0.05;
  }

  return 0;
}
