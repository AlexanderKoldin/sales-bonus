function analyzeSalesData(data, options) {
  if (!data) throw new Error("No data");
  if (!data.sellers || data.sellers.length === 0) throw new Error("No sellers");
  if (!data.products || data.products.length === 0) throw new Error("No products");
  if (!data.purchase_records || data.purchase_records.length === 0) throw new Error("No purchase_records");
  if (!options || !options.calculateRevenue || !options.calculateBonus) throw new Error("Invalid options");


  const sellers = {};
  data.sellers.forEach((seller) => {
    const sellerId = seller.seller_id || seller.id;
    sellers[sellerId] = {
      seller_id: sellerId,
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
    const sellerId = purchase.seller_id;
    const seller = sellers[sellerId];
    if (!seller) return;

    const product = productsIndex[purchase.sku] || {};
    seller.sales_count += Number(purchase.quantity) || 0;

    const revenue = options.calculateRevenue(purchase, product);
    seller.revenue += Number(revenue) || 0;
    seller.profit += Number(revenue * 0.15) || 0;

    seller.top_products[purchase.sku] = (seller.top_products[purchase.sku] || 0) + Number(purchase.quantity || 0);
  });

  const sellerArray = Object.values(sellers); // ← ВСЕ 5!
  sellerArray.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));

  sellerArray.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerArray.length, seller);
  });

  sellerArray.forEach((seller) => {
    seller.top_products = Object.entries(seller.top_products)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([sku, quantity]) => ({ sku, quantity }));
  });

  return sellerArray;
