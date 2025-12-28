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

  const sellersIndex = {};
  data.sellers.forEach((seller) => {
    sellersIndex[seller.id] = seller;
    sellersIndex[seller.seller_id] = seller;
  });

  const sellers = {};
  data.sellers.forEach((seller) => {
    sellers[seller.id || seller.seller_id] = {
      seller_id: seller.id || seller.seller_id,
      name: seller.name,
      sales_count: 0,
      revenue: 0,
      profit: 0,
      top_products: {},
    };
  });

  const productsIndex = data.products.reduce((acc, product) => {
    acc[product.sku] = product;
    return acc;
  }, {});

  data.purchase_records.forEach((purchase) => {
    const sellerId = purchase.seller_id || purchase.sellerId;
    const seller = sellers[sellerId];

    if (!seller) return;

    const product = productsIndex[purchase.sku] || {};

    seller.sales_count += Number(purchase.quantity) || 0;
    const revenue = options.calculateRevenue(purchase, product);
    seller.revenue += Number(revenue) || 0;
    seller.profit += Number(purchase.profit) || 0;

    const sku = purchase.sku || "unknown";
    seller.top_products[sku] = (seller.top_products[sku] || 0) + (Number(purchase.quantity) || 0);
  });

  const sellerArray = Object.values(sellers);
  sellerArray.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  sellerArray.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerArray.length, seller);
  });

  sellerArray.forEach((seller) => {
    seller.top_products = Object.entries(seller.top_products)
      .sort(([, a], [, b]) => (b || 0) - (a || 0))
      .slice(0, 3)
      .map(([sku, quantity]) => ({ sku, quantity }));
  });

  return sellerArray;
}
