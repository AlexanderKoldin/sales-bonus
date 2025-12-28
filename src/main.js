/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  return purchase.quantity * _product.price;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  if (index === 0) return 1000;
  if (index === 1) return 700;
  if (index === 2) return 500;
  return Math.max(100, 500 * (1 - index / total));
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  // @TODO: Проверка наличия опций
  // @TODO: Подготовка промежуточных данных для сбора статистики
  // @TODO: Индексация продавцов и товаров для быстрого доступа
  // @TODO: Расчет выручки и прибыли для каждого продавца
  // @TODO: Сортировка продавцов по прибыли
  // @TODO: Назначение премий на основе ранжирования
  // @TODO: Подготовка итоговой коллекции с нужными полями

  if (!data || !Array.isArray(data)) return [];
  if (!options.calculateRevenue || !options.calculateBonus) return [];

  const sellers = {};

  data.forEach((purchase) => {
    const sellerId = purchase.seller_id;

    if (!sellers[sellerId]) {
      sellers[sellerId] = {
        seller_id: sellerId,
        name: purchase.seller_name,
        sales_count: 0,
        revenue: 0,
        profit: 0,
        top_products: {},
      };
    }

    sellers[sellerId].sales_count += purchase.quantity;

    const productData = { price: purchase.unit_price };
    const revenue = options.calculateRevenue(purchase, productData);
    sellers[sellerId].revenue += revenue;

    const productName = purchase.product_name;
    sellers[sellerId].top_products[productName] =
      (sellers[sellerId].top_products[productName] || 0) + purchase.quantity;
  });

  const sellerArray = Object.values(sellers);
  sellerArray.sort((a, b) => b.revenue - a.revenue);

  sellerArray.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerArray.length, seller);
  });

  sellerArray.forEach((seller) => {
    seller.top_products = Object.entries(seller.top_products)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3);
  });

  return sellerArray;
}
