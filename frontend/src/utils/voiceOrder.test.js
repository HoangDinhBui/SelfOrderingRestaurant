import { describe, expect, it } from "vitest";
import { applyVoiceCommand, parseVietnameseNumber, parseVoiceCommand, parseVoiceOrder } from "./voiceOrder";

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

const ops = (result) =>
  result.ops.map((op) => (op.type === "clear" ? ["clear"] : [op.type, op.dish.dishId, op.quantity]));

describe("parseVoiceCommand", () => {
  it("bỏ hẳn một món", () => {
    expect(ops(parseVoiceCommand("bỏ phở bò", MENU))).toEqual([["remove", 1, null]]);
    expect(ops(parseVoiceCommand("hủy trà đá chanh", MENU))).toEqual([["remove", 4, null]]);
  });

  it("bớt một phần, có hoặc không nói số", () => {
    expect(ops(parseVoiceCommand("bớt một trà đá", MENU))).toEqual([["remove", 3, 1]]);
    expect(ops(parseVoiceCommand("bớt trà đá", MENU))).toEqual([["remove", 3, 1]]);
    expect(ops(parseVoiceCommand("bỏ hai phở bò", MENU))).toEqual([["remove", 1, 2]]);
  });

  it("không lấy món nữa", () => {
    expect(ops(parseVoiceCommand("không lấy phở bò nữa", MENU))).toEqual([["remove", 1, null]]);
  });

  it("'không' đi với yêu cầu món (không hành) không phải lệnh bỏ", () => {
    expect(ops(parseVoiceCommand("một phở bò không hành, hai trà đá", MENU))).toEqual([
      ["add", 1, 1],
      ["add", 3, 2],
    ]);
    expect(ops(parseVoiceCommand("không cần trà đá", MENU))).toEqual([["remove", 3, null]]);
  });

  it("đặt lại số lượng", () => {
    expect(ops(parseVoiceCommand("phở bò thành ba", MENU))).toEqual([["add", 1, 1], ["set", 1, 3]]);
    expect(ops(parseVoiceCommand("đổi trà đá còn một", MENU))).toEqual([["add", 3, 1], ["set", 3, 1]]);
  });

  it("bỏ nhiều món liền nhau rồi quay lại gọi thêm", () => {
    expect(ops(parseVoiceCommand("bỏ phở bò và trà đá", MENU))).toEqual([
      ["remove", 1, null],
      ["remove", 3, null],
    ]);
    expect(ops(parseVoiceCommand("bỏ phở bò, thêm hai trà đá", MENU))).toEqual([
      ["remove", 1, null],
      ["add", 3, 2],
    ]);
  });

  it("xác nhận đặt đơn", () => {
    expect(parseVoiceCommand("xác nhận", MENU)).toMatchObject({ ops: [], confirm: true });
    const result = parseVoiceCommand("hai phở bò rồi chốt đơn", MENU);
    expect(ops(result)).toEqual([["add", 1, 2]]);
    expect(result.confirm).toBe(true);
    expect(parseVoiceCommand("đặt luôn", MENU).confirm).toBe(true);
  });

  it("'đặt món' ở đầu câu chưa phải là xác nhận", () => {
    expect(parseVoiceCommand("đặt món hai phở bò", MENU).confirm).toBe(false);
  });

  it("hủy hết rồi gọi lại", () => {
    expect(ops(parseVoiceCommand("hủy hết", MENU))).toEqual([["clear"]]);
    expect(ops(parseVoiceCommand("xóa tất cả rồi lấy một trà đá", MENU))).toEqual([["clear"], ["add", 3, 1]]);
  });

  it("chỉ nói hủy thì là lệnh dừng", () => {
    expect(parseVoiceCommand("hủy", MENU)).toMatchObject({ ops: [], cancel: true });
    expect(parseVoiceCommand("phở bò", MENU).cancel).toBe(false);
  });
});

describe("applyVoiceCommand", () => {
  const dish = (id) => MENU.find((d) => d.dishId === id);
  const start = [
    { dish: dish(1), quantity: 2 },
    { dish: dish(3), quantity: 1 },
  ];
  const view = (draft) => draft.map((it) => [it.dish.dishId, it.quantity]);
  const run = (text, draft = start) => applyVoiceCommand(draft, parseVoiceCommand(text, MENU));

  it("thêm, bớt, bỏ, đặt lại", () => {
    expect(view(run("thêm một phở bò và một sinh tố bơ").draft)).toEqual([[1, 3], [3, 1], [6, 1]]);
    expect(view(run("bớt một phở bò").draft)).toEqual([[1, 1], [3, 1]]);
    expect(view(run("bỏ trà đá").draft)).toEqual([[1, 2]]);
    expect(view(run("phở bò thành năm").draft)).toEqual([[1, 5], [3, 1]]);
    expect(view(run("hủy hết").draft)).toEqual([]);
  });

  it("bớt quá số đang có thì bỏ món", () => {
    expect(view(run("bớt ba trà đá").draft)).toEqual([[1, 2]]);
  });

  it("không đổi danh sách cũ", () => {
    run("hủy hết");
    expect(view(start)).toEqual([[1, 2], [3, 1]]);
  });

  it("bỏ món nói thiếu tên: lấy món đang có trong danh sách", () => {
    const result = run("bỏ phở");
    expect(view(result.draft)).toEqual([[3, 1]]);
    expect(result.pending).toEqual([]);
  });

  it("gọi thêm món nói thiếu tên thì để khách chọn", () => {
    const result = run("hai phở");
    expect(view(result.draft)).toEqual([[1, 2], [3, 1]]);
    expect(result.pending).toHaveLength(1);
    expect(result.pending[0]).toMatchObject({ type: "add", quantity: 2 });
  });
});
