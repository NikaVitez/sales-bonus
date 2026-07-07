/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const discount = 1 - (purchase.discount / 100);
    return purchase.sale_price * purchase.quantity * discount;
}

 /**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    // @TODO: Расчет бонуса от позиции в рейтинге
    
    if (index === 0) {
        return seller.profit * 0.15;
    } else if (index === 1 || index === 2) {
        return seller.profit * 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        return seller.profit * 0.05;
    }
}

 /**
   Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных

    if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные о продавцах');
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Некорректные входные данные о продуктах');
    }
    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Некорректные входные данные о продажах');
    }
    if (!options|| typeof options.calculateRevenue !== 'function' || typeof options.calculateBonus !== 'function') {
        throw new Error('Необходимые функции для расчетов не переданы');  
    }

    // @TODO: Проверка наличия опций
    
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const { calculateRevenue, calculateBonus } = options;

    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item]));


    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id]; 
        if (seller) {
            seller.sales_count += 1; 
        }

        record.items.forEach(item => {
            const product = productIndex[item.sku];             
            if (seller && product) {
                const cost = product.purchase_price * item.quantity;
                const revenue = calculateRevenue(item, product);
                const itemProfit = revenue - cost;
                seller.revenue = +(seller.revenue + revenue).toFixed(2);;
                seller.profit = seller.profit + itemProfit;

                if (!seller.products_sold[item.sku]) {
                    seller.products_sold[item.sku] = 0;
                }
                seller.products_sold[item.sku] += item.quantity;
            }
        });
    });

    sellerStats.sort((a, b) => b.profit - a.profit); 
    const totalSellers = sellerStats.length;
    
    sellerStats.forEach((seller, index) => {
        seller.profit = +seller.profit.toFixed(2);
        seller.bonus = calculateBonus(index, totalSellers, seller);
        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({ sku, quantity }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: seller.profit,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}
