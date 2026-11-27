import { describe, expect, it } from "vitest";
import { hasSufficientIngredients } from "./inventory";

const inventory = [
  { ingredientId: 1, remainingQuantity: 50 },
  { ingredientId: 2, remainingQuantity: 0.1 },
];

describe("hasSufficientIngredients", () => {
  it("món chưa khai báo nguyên liệu vẫn được bán", () => {
    expect(hasSufficientIngredients(1, [], inventory)).toBe(true);
  });

  it("đủ mọi nguyên liệu thì bán được", () => {
    const recipe = [{ dishId: 1, ingredientId: 1, quantity: 0.2 }];
    expect(hasSufficientIngredients(1, recipe, inventory)).toBe(true);
  });

  it("thiếu một nguyên liệu thì ẩn", () => {
    const recipe = [
      { dishId: 1, ingredientId: 1, quantity: 0.2 },
      { dishId: 1, ingredientId: 2, quantity: 0.5 },
    ];
    expect(hasSufficientIngredients(1, recipe, inventory)).toBe(false);
  });

  it("nguyên liệu không có trong kho thì ẩn", () => {
    expect(hasSufficientIngredients(1, [{ dishId: 1, ingredientId: 9, quantity: 1 }], inventory)).toBe(false);
  });

  it("chỉ xét công thức của đúng món đó", () => {
    expect(hasSufficientIngredients(1, [{ dishId: 2, ingredientId: 9, quantity: 1 }], inventory)).toBe(true);
  });
});
