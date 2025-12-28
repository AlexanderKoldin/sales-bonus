function calculateSimpleRevenue(purchase, product) {
  const salePrice = Number(purchase.sale_price) || 0;
  const quantity = Number(purchase.quantity) || 1;
  const discount = Number(purchase.discount) || 0;

  return salePrice * quantity * (1 - discount / 100);
}

function calculateBonusByProfit(index, total, seller) {
  const profit = seller.profit || 0;

  if (index === 0) {
    return Math.round(profit * 0.15 * 100) / 100;
  } else if (index === 1 || index === 2) {
    return Math.round(profit * 0.1 * 100) / 100;
  } else if (index === 3) {
    return Math.round(profit * 0.05 * 100) / 100;
  }
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
    const sellerId = seller.id;
    sellersIndex[sellerId] = {
      seller_id: sellerId,
      name: `${seller.first_name || ""} ${seller.last_name || ""}`.trim(),
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

  data.purchase_records.forEach((record) => {
    const sellerId = record.seller_id;
    const seller = sellersIndex[sellerId];

    if (!seller) return;

    record.items.forEach((item) => {
      const sku = item.sku || "unknown";
      const product = productsIndex[sku] || {};
      const quantity = Number(item.quantity) || 1;

      const revenue = options.calculateRevenue(item, product);
      const purchasePrice = Number(product.purchase_price) || 0;
      const cost = purchasePrice * quantity;
      const profit = revenue - cost;

      seller.sales_count += quantity;
      seller.revenue += revenue;
      seller.profit += profit;

      if (sku !== "unknown") {
        if (!seller.top_products[sku]) {
          seller.top_products[sku] = 0;
        }
        seller.top_products[sku] += quantity;
      }
    });
  });

  const sellerArray = Object.values(sellersIndex);
  sellerArray.sort((a, b) => b.profit - a.profit);

  sellerArray.forEach((seller, index) => {
    seller.bonus = options.calculateBonus(index, sellerArray.length, seller);
    seller.revenue = Math.round(seller.revenue * 100) / 100;
    seller.profit = Math.round(seller.profit * 100) / 100;
    seller.bonus = Math.round(seller.bonus * 100) / 100;

    seller.top_products = Object.entries(seller.top_products)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => {
        if (b.quantity !== a.quantity) {
          return b.quantity - a.quantity;
        }

        const getSkuNumber = (sku) => parseInt(sku.replace("SKU_", "")) || 0;
        return getSkuNumber(a.sku) - getSkuNumber(b.sku);
      })
      .slice(0, 10);
  });

  return sellerArray;
}
