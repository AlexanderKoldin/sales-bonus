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
  const coefficients = [0.15, 0.1, 0.1, 0.05, 0];
  return index < coefficients.length ? seller.revenue * coefficients[index] : 0;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  if (!data) throw new Error("No data");
  if (!data.sellers) throw new Error("No sellers");
  if (!data.products) throw new Error("No products");
  if (!data.purchase_records) throw new Error("No purchase_records");

  if (!options.calculateRevenue || !options.calculateBonus) throw new Error("Invalid options");

  const sellers = data.sellers.reduce((acc, seller) => {
    acc[seller.id] = {
      seller_id: seller.id,
      name: seller.name,
      sales_count: 0,
      revenue: 0,
      profit: 0,
      top_products: {},
    };
    return acc;
  }, {});

  data.purchase_records.forEach((purchase) => {
    const seller = sellers[purchase.seller_id];
    if (!seller) return;

    const product = data.products.find((p) => p.sku === purchase.sku);

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
