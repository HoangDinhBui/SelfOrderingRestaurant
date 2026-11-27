import { describe, expect, it } from "vitest";
import { parseVietnameseNumber, parseVoiceOrder } from "./voiceOrder";

const MENU = [
  { dishId: 1, name: "Phở bò" },
  { dishId: 2, name: "Phở gà" },
  { dishId: 3, name: "Trà đá" },
  { dishId: 4, name: "Trà đá chanh" },
  { dishId: 5, name: "Cơm tấm sườn" },
  { dishId: 6, name: "Sinh tố bơ" },
  { dishId: 7, name: "Coca Cola (lon)" },
];

const picked = (result) => result.items.map((it) => [it.dishId, it.quantity]);

describe("parseVietnameseNumber", () => {
  it.each([
    ["một", 1],
    ["hai", 2],
    ["bốn", 4],
    ["tư", 4],
    ["mười", 10],
    ["mười hai", 12],
    ["mười lăm", 15],
    ["hai mươi", 20],
    ["hai mươi mốt", 21],
    ["3", 3],
  ])("%s -> %i", (text, value) => {
    expect(parseVietnameseNumber(text.split(" "))).toBe(value);
  });

  it("trả về null khi không phải số", () => {
    expect(parseVietnameseNumber(["phở"])).toBeNull();
  });
});

describe("parseVoiceOrder", () => {
  it("nhận nhiều món kèm số lượng bằng chữ", () => {
    const result = parseVoiceOrder("cho hai phở bò với một trà đá", MENU);
    expect(picked(result)).toEqual([
      [1, 2],
      [3, 1],
    ]);
    expect(result.ambiguous).toEqual([]);
    expect(result.unmatched).toEqual([]);
  });

  it("nhận số viết bằng chữ số", () => {
    expect(picked(parseVoiceOrder("3 cơm tấm sườn", MENU))).toEqual([[5, 3]]);
  });

  it("không nói số lượng thì mặc định 1", () => {
    expect(picked(parseVoiceOrder("phở gà", MENU))).toEqual([[2, 1]]);
  });

  it("bỏ qua từ chỉ đơn vị như ly, phần, bát", () => {
    const result = parseVoiceOrder("hai ly trà đá và một phần cơm tấm sườn", MENU);
    expect(picked(result)).toEqual([
      [3, 2],
      [5, 1],
    ]);
  });

  it("số lượng nói sau tên món", () => {
    const result = parseVoiceOrder("phở bò hai bát, trà đá", MENU);
    expect(picked(result)).toEqual([
      [1, 2],
      [3, 1],
    ]);
  });

  it("chọn tên món dài nhất khớp được", () => {
    expect(picked(parseVoiceOrder("một trà đá chanh", MENU))).toEqual([[4, 1]]);
  });

  it("cộng dồn khi gọi lại cùng một món", () => {
    const result = parseVoiceOrder("một phở bò, thêm hai phở bò nữa", MENU);
    expect(picked(result)).toEqual([[1, 3]]);
  });

  it("không phân biệt hoa thường và dấu", () => {
    expect(picked(parseVoiceOrder("HAI PHO BO", MENU))).toEqual([[1, 2]]);
  });

  it("phân biệt bò và bơ khi có dấu", () => {
    expect(picked(parseVoiceOrder("sinh tố bơ", MENU))).toEqual([[6, 1]]);
  });

  it("chịu được lỗi nhận dạng một ký tự", () => {
    expect(picked(parseVoiceOrder("hai sing tố bơ", MENU))).toEqual([[6, 2]]);
  });

  it("bỏ qua dấu ngoặc trong tên món", () => {
    expect(picked(parseVoiceOrder("hai coca cola lon", MENU))).toEqual([[7, 2]]);
  });

  it("chỉ nói phần đầu tên món, khớp một món thì nhận luôn", () => {
    expect(picked(parseVoiceOrder("hai cơm tấm", MENU))).toEqual([[5, 2]]);
  });

  it("chỉ nói phần đầu tên món, khớp nhiều món thì hỏi lại", () => {
    const result = parseVoiceOrder("hai phở", MENU);
    expect(result.items).toEqual([]);
    expect(result.ambiguous).toHaveLength(1);
    expect(result.ambiguous[0].quantity).toBe(2);
    expect(result.ambiguous[0].options.map((d) => d.dishId)).toEqual([1, 2]);
  });

  it("trả lại phần không hiểu được, giữ nguyên dấu", () => {
    const result = parseVoiceOrder("cho em một bánh mì và hai trà đá nhé", MENU);
    expect(picked(result)).toEqual([[3, 2]]);
    expect(result.unmatched).toEqual(["bánh mì"]);
  });

  it("câu rỗng hoặc menu rỗng không lỗi", () => {
    expect(parseVoiceOrder("", MENU)).toEqual({ items: [], ambiguous: [], unmatched: [] });
    expect(parseVoiceOrder("hai phở bò", [])).toEqual({ items: [], ambiguous: [], unmatched: ["phở bò"] });
  });
});
