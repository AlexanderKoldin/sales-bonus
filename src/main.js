/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  return purchase.quantity * purchase.sale_price * (1 - purchase.discount / 100);
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  if (index === 0) return 150;
  if (index === 1 || index === 2) return 100;
  if (index === 3) return 50;
  return 0;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  if (!data) throw new Error("No data");
  if (!data.sellers || data.sellers.length === 0) throw new Error("No sellers");
  if (!data.products || data.products.length === 0) throw new Error("No products");
  if (!data.purchase_records || data.purchase_records.length === 0) throw new Error("No purchase_records");
  if (!options || !options.calculateRevenue || !options.calculateBonus) throw new Error("Invalid options");

  const sellersIndex = data.sellers.reduce((acc, seller) => {
    acc[seller.id] = seller;
    return acc;
  }, {});

  const sellers = {};
  Object.keys(sellersIndex).forEach((id) => {
    const seller = sellersIndex[id];
    sellers[id] = {
      seller_id: id,
      name: seller.name,
      sales_count: 0,
      revenue: 0,
      profit: 0,
      top_products: {},
    };
  });

  data.purchase_records.forEach((purchase) => {
    const sellerId = purchase.seller_id;
    const seller = sellers[sellerId];
    if (!seller) return;

    const product = data.products.find((p) => p.sku === purchase.sku) || {};

    seller.sales_count += purchase.quantity;
    const revenue = options.calculateRevenue(purchase, product);
    seller.revenue += revenue;
    seller.profit += purchase.profit || 0;

    seller.top_products[purchase.sku] = (seller.top_products[purchase.sku] || 0) + purchase.quantity;
  });

  const sellerArray = Object.values(sellers);
  sellerArray.sort((a, b) => b.revenue - a.revenue);

  sellerArray.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerArray.length, seller);
  });

  sellerArray.forEach((seller) => {
    seller.top_products = Object.entries(seller.top_products)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sku, quantity]) => ({ sku, quantity }));
  });

  return sellerArray;
}
