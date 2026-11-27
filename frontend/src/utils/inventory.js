/**
 * Món còn đủ nguyên liệu trong kho để bán không.
 * Món chưa khai báo công thức (chưa có dish_ingredients) thì không biết thiếu gì, nên vẫn cho bán.
 */
export const hasSufficientIngredients = (dishId, dishIngredients, inventory) =>
  dishIngredients
    .filter((di) => di.dishId === dishId)
    .every((req) => {
      const item = inventory.find((inv) => inv.ingredientId === req.ingredientId);
      return Boolean(item) && item.remainingQuantity >= req.quantity;
    });
