// Phân tích câu khách nói (đã chuyển thành chữ) thành các lệnh gọi món, dựa trên thực đơn.
// Ví dụ: "cho hai phở bò với một ly trà đá" -> thêm Phở bò x2, Trà đá x1
//        "bỏ phở bò, trà đá thành ba rồi chốt đơn" -> bỏ Phở bò, Trà đá = 3, đặt đơn

const DIGITS = { một: 1, mốt: 1, hai: 2, ba: 3, bốn: 4, tư: 4, năm: 5, lăm: 5, sáu: 6, bảy: 7, bẩy: 7, tám: 8, chín: 9 };
const DIGITS_PLAIN = { mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, lam: 5, sau: 6, bay: 7, tam: 8, chin: 9 };

// Từ chỉ đơn vị đứng giữa số lượng và tên món: "hai ly trà đá"
const CLASSIFIERS = new Set(["ly", "cốc", "phần", "suất", "xuất", "bát", "tô", "đĩa", "dĩa", "chai", "lon", "cái", "chén", "ấm", "bình", "miếng", "con", "trái", "quả"]);
const CLASSIFIERS_PLAIN = new Set(["ly", "coc", "phan", "suat", "xuat", "bat", "to", "dia", "chai", "lon", "cai", "chen", "binh", "mieng", "con", "trai", "qua"]);

// Từ đệm, không mang nghĩa món ăn; cũng là ranh giới giữa các món
const FILLERS = new Set(["không", "tôi", "mình", "em", "anh", "chị", "và", "với", "nữa", "nhé", "nha", "ạ", "ơi", "món", "đặt", "muốn", "thì", "là", "có", "luôn", "giúp", "rồi", "đổi", "sửa", "thôi", "dừng", "khoan", "đợi", "đi"]);
const FILLERS_PLAIN = new Set(["khong", "toi", "minh", "em", "anh", "chi", "va", "voi", "nua", "nhe", "nha", "a", "oi", "mon", "dat", "muon", "thi", "la", "co", "luon", "giup", "roi", "doi", "sua", "thoi", "dung", "khoan", "doi", "di"]);

// Chuyển về chế độ gọi thêm món
const ADD_WORDS = new Set(["thêm", "tăng", "lấy", "gọi", "cho"]);
const ADD_WORDS_PLAIN = new Set(["them", "tang", "lay", "goi", "cho"]);
// Nói kèm số mà không nêu món ("thêm một bát nữa") thì áp vào món vừa nhắc tới
const IMPLICIT_ADD_PLAIN = new Set(["them", "tang"]);
// Bỏ hẳn món (không nói số) / bớt từng phần
const REMOVE_ALL_WORDS = new Set(["bỏ", "hủy", "huỷ", "xóa", "xoá"]);
const REMOVE_ALL_WORDS_PLAIN = new Set(["huy", "xoa"]);
const REMOVE_ONE_WORDS = new Set(["bớt", "trừ", "giảm"]);
const REMOVE_ONE_WORDS_PLAIN = new Set(["bot", "tru", "giam"]);
// "phở bò thành ba": đặt lại số lượng của món vừa nói
const SET_WORDS = new Set(["thành", "còn", "lên", "xuống"]);
const SET_WORDS_PLAIN = new Set(["thanh", "con", "len", "xuong"]);
// Nói một mình (không kèm món) thì là lệnh dừng việc đặt đơn
const CANCEL_WORDS = new Set(["hủy", "huỷ", "thôi", "dừng", "khoan", "đợi", "không", "huy", "thoi", "dung", "khong"]);

// Cụm từ so theo dạng không dấu, dài trước ngắn sau
const CONFIRM_PHRASES = [["xac", "nhan"], ["chot", "don"], ["dat", "luon"], ["gui", "bep"], ["gui", "don"], ["dong", "y"], ["chot"], ["ok"], ["oke"], ["okay"], ["xong"]];
const CLEAR_TAILS = [["tat", "ca"], ["het"], ["don"]];

const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

const toToken = (raw) => {
  const lower = raw.normalize("NFC").toLowerCase();
  return { raw, lower, plain: stripAccents(lower) };
};

// Tách câu thành từ; dấu phẩy, chấm... giữ lại thành token ranh giới (sep)
const tokenize = (text) =>
  (String(text || "").match(/[\p{L}\p{N}]+|[,.;!?]/gu) || []).map((raw) =>
    /^[,.;!?]$/.test(raw) ? { sep: true } : toToken(raw),
  );

// Chỉ dùng bảng không dấu khi chính từ đó được gõ không dấu, để "tấm" không bị hiểu là "tám"
const lookup = (token, accented, plain) => {
  if (token.lower in accented) return accented[token.lower];
  return token.lower === token.plain && token.plain in plain ? plain[token.plain] : undefined;
};
const inSet = (token, accented, plain) =>
  accented.has(token.lower) || (token.lower === token.plain && plain.has(token.plain));

const isNumberWord = (t) =>
  /^\d+$/.test(t.lower) || ["mười", "muoi", "mươi"].includes(t.lower) || lookup(t, DIGITS, DIGITS_PLAIN) !== undefined;
const isClassifier = (t) => inSet(t, CLASSIFIERS, CLASSIFIERS_PLAIN);
const isFiller = (t) => inSet(t, FILLERS, FILLERS_PLAIN);
const isAddWord = (t) => inSet(t, ADD_WORDS, ADD_WORDS_PLAIN);
const isRemoveAllWord = (t) => inSet(t, REMOVE_ALL_WORDS, REMOVE_ALL_WORDS_PLAIN);
const isRemoveOneWord = (t) => inSet(t, REMOVE_ONE_WORDS, REMOVE_ONE_WORDS_PLAIN);
const isSetWord = (t) => inSet(t, SET_WORDS, SET_WORDS_PLAIN);

// Độ dài cụm từ khớp tại vị trí start (0 nếu không khớp)
const matchPhrase = (tokens, start, phrases) => {
  for (const phrase of phrases) {
    if (phrase.every((word, k) => tokens[start + k] && !tokens[start + k].sep && tokens[start + k].plain === word)) {
      return phrase.length;
    }
  }
  return 0;
};

/** ["hai", "mươi", "mốt"] -> 21; không phải số -> null */
export const parseVietnameseNumber = (words) => {
  let value = null;
  for (const word of words) {
    const t = toToken(word);
    if (/^\d+$/.test(t.lower)) value = Number(t.lower);
    else if (t.lower === "mười" || (t.lower === "muoi" && value === null)) value = 10;
    else if (t.lower === "mươi" || t.lower === "muoi") value = (value ?? 1) * 10;
    else {
      const digit = lookup(t, DIGITS, DIGITS_PLAIN);
      if (digit === undefined) return null;
      value = value !== null && value >= 10 && value % 10 === 0 ? value + digit : digit;
    }
  }
  return value;
};

const editDistanceAtMostOne = (a, b) => {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

// Điểm khớp một từ: đúng cả dấu 3, đúng khi bỏ dấu 2, sai một ký tự 1, không khớp 0
const tokenScore = (spoken, dishWord) => {
  if (spoken.lower === dishWord.lower) return 3;
  if (spoken.plain === dishWord.plain) return 2;
  if (dishWord.plain.length >= 3 && editDistanceAtMostOne(spoken.plain, dishWord.plain)) return 1;
  return 0;
};

// Số từ liên tiếp từ vị trí start khớp với đầu tên món, kèm tổng điểm
const matchPrefix = (tokens, start, dishWords) => {
  let length = 0;
  let score = 0;
  while (length < dishWords.length && start + length < tokens.length) {
    const token = tokens[start + length];
    const s = token.sep ? 0 : tokenScore(token, dishWords[length]);
    if (s === 0) break;
    score += s;
    length++;
  }
  return { length, score };
};

/**
 * dishes: [{ dishId, name | dishName, ... }]
 * Trả về {
 *   ops: [{ type: "add" | "remove" | "set", dish, quantity } | { type: "clear" }] theo thứ tự nói,
 *        remove có quantity null nghĩa là bỏ hẳn món; dish null khi không nêu tên món
 *        ("giảm một bát", "hủy"), áp vào món vừa nhắc tới,
 *   ambiguous: [{ type, quantity, phrase, options }]  món nói thiếu tên khớp nhiều món,
 *   unmatched: [phrase], confirm: đặt đơn luôn, cancel: nói "hủy"/"thôi" mà không nêu tên món
 * }
 */
export const parseVoiceCommand = (transcript, dishes = []) => {
  const tokens = tokenize(transcript);
  const menu = dishes
    .map((dish) => ({ dish, words: tokenize(dish.name ?? dish.dishName).filter((t) => !t.sep) }))
    .filter((m) => m.words.length > 0);

  const ops = [];
  const ambiguous = [];
  const unmatched = [];
  let confirm = false;
  let sawCancelWord = false;
  let mode = "add"; // add | remove
  let removeOne = false; // "bớt": không nói số thì bớt 1
  let keepRemove = false; // "không lấy phở bò": chữ "lấy" sau "không" không chuyển về gọi thêm
  let numberWords = [];
  let unknownWords = [];
  let lastDefaulted = null; // lệnh vừa nhận mà chưa nói số lượng, để nhận số lượng nói sau tên món
  let lastDish = null;
  let setTarget = null; // món đang chờ số lượng mới sau "thành"/"còn"
  let implicit = false; // vừa có lệnh bỏ/bớt/thêm mà chưa nêu món

  const takeQuantity = () => {
    const quantity = parseVietnameseNumber(numberWords);
    numberWords = [];
    return quantity;
  };
  const flushUnknown = () => {
    if (unknownWords.length) unmatched.push(unknownWords.join(" "));
    unknownWords = [];
  };
  const resolveSet = () => {
    const quantity = takeQuantity();
    if (quantity !== null) ops.push({ type: "set", dish: setTarget, quantity });
    setTarget = null;
  };
  // Ranh giới (từ đệm, dấu câu, hết câu): số lượng còn treo thuộc về lệnh vừa nói trước đó
  const closeSegment = () => {
    flushUnknown();
    if (implicit) {
      implicit = false;
      const spoken = takeQuantity();
      if (mode === "remove" || spoken) ops.push({ type: mode, dish: null, quantity: spoken || defaultQuantity() });
    }
    if (setTarget) resolveSet();
    const quantity = takeQuantity();
    if (quantity && lastDefaulted) lastDefaulted.quantity = quantity;
    lastDefaulted = null;
  };
  const defaultQuantity = () => (mode === "add" ? 1 : removeOne ? 1 : null);
  const addOp = (dish) => {
    implicit = false;
    if (setTarget) resolveSet();
    const spoken = takeQuantity();
    const op = { type: mode, dish, quantity: spoken || defaultQuantity() };
    ops.push(op);
    lastDefaulted = spoken ? null : op;
    lastDish = dish;
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.sep) {
      closeSegment();
      i++;
      continue;
    }

    const confirmLength = matchPhrase(tokens, i, CONFIRM_PHRASES);
    if (confirmLength) {
      closeSegment();
      confirm = true;
      i += confirmLength;
      continue;
    }
    if (isRemoveAllWord(token) || token.plain === "bo") {
      const tail = matchPhrase(tokens, i + 1, CLEAR_TAILS);
      if (tail) {
        closeSegment();
        ops.push({ type: "clear" });
        i += 1 + tail;
        continue;
      }
    }
    const resetLength = matchPhrase(tokens, i, [["lam", "lai"]]);
    if (resetLength) {
      closeSegment();
      ops.push({ type: "clear" });
      i += resetLength;
      continue;
    }

    // 1. Khớp trọn tên món, ưu tiên tên dài nhất rồi điểm cao nhất
    let best = null;
    for (const m of menu) {
      const { length, score } = matchPrefix(tokens, i, m.words);
      if (length !== m.words.length) continue;
      if (!best || length > best.length || (length === best.length && score > best.score)) {
        best = { dish: m.dish, length, score };
      }
    }
    if (best) {
      flushUnknown();
      addOp(best.dish);
      i += best.length;
      continue;
    }

    if (isNumberWord(token)) {
      flushUnknown();
      if (numberWords.length && parseVietnameseNumber([...numberWords, token.raw]) === null) closeSegment();
      numberWords.push(token.raw);
      i++;
      continue;
    }
    if (isClassifier(token)) {
      i++;
      continue;
    }
    if (isSetWord(token) && lastDish) {
      flushUnknown();
      numberWords = [];
      lastDefaulted = null;
      implicit = false;
      setTarget = lastDish;
      i++;
      continue;
    }
    // "không lấy/gọi/cần ..." là bỏ món; "không" đứng riêng (phở không hành) chỉ là từ đệm
    const next = tokens[i + 1];
    const isDontWant = token.plain === "khong" && next && !next.sep && ["lay", "goi", "can"].includes(next.plain);
    if (isRemoveAllWord(token) || isRemoveOneWord(token) || isDontWant) {
      // "giảm bớt hai": hai từ lệnh liền nhau là một lệnh
      if (implicit && numberWords.length === 0) implicit = false;
      closeSegment();
      if (CANCEL_WORDS.has(token.lower)) sawCancelWord = true;
      mode = "remove";
      removeOne = isRemoveOneWord(token);
      keepRemove = isDontWant;
      implicit = true;
      i++;
      continue;
    }
    if (isAddWord(token)) {
      if (keepRemove) {
        keepRemove = false;
        i++;
        continue;
      }
      if (implicit && numberWords.length === 0) implicit = false;
      closeSegment();
      mode = "add";
      implicit = IMPLICIT_ADD_PLAIN.has(token.plain);
      i++;
      continue;
    }
    if (keepRemove && token.plain === "can") {
      keepRemove = false;
      i++;
      continue;
    }
    if (isFiller(token)) {
      closeSegment();
      if (CANCEL_WORDS.has(token.lower)) sawCancelWord = true;
      i++;
      continue;
    }

    // 2. Chỉ nói phần đầu tên món: một món khớp thì nhận, nhiều món thì để khách chọn
    let longest = 0;
    let candidates = [];
    for (const m of menu) {
      const { length } = matchPrefix(tokens, i, m.words);
      if (length === 0 || length < longest) continue;
      if (length > longest) candidates = [];
      longest = length;
      candidates.push(m.dish);
    }
    if (candidates.length === 1) {
      flushUnknown();
      addOp(candidates[0]);
      i += longest;
      continue;
    }
    if (candidates.length > 1) {
      flushUnknown();
      const phrase = tokens.slice(i, i + longest).map((t) => t.raw).join(" ");
      ambiguous.push({ type: mode, quantity: takeQuantity() || defaultQuantity(), phrase, options: candidates });
      lastDefaulted = null;
      implicit = false;
      i += longest;
      continue;
    }

    // 3. Không hiểu: gom lại để báo cho khách
    numberWords = [];
    lastDefaulted = null;
    unknownWords.push(token.raw);
    i++;
  }
  closeSegment();

  const namedDish = ops.some((op) => op.type === "clear" || op.dish) || ambiguous.length > 0;
  const cancel = sawCancelWord && !namedDish && !confirm;
  return { ops, ambiguous, unmatched, confirm, cancel };
};

/** Chỉ lấy các món được gọi thêm, cộng dồn theo món: { items: [{ ...dish, quantity }], ambiguous, unmatched } */
export const parseVoiceOrder = (transcript, dishes = []) => {
  const { ops, ambiguous, unmatched } = parseVoiceCommand(transcript, dishes);
  const items = [];
  for (const op of ops) {
    if (op.type !== "add") continue;
    const item = items.find((it) => it.dishId === op.dish.dishId);
    if (item) item.quantity += op.quantity;
    else items.push({ ...op.dish, quantity: op.quantity });
  }
  return { items, ambiguous: ambiguous.filter((a) => a.type === "add"), unmatched };
};

/** Áp một lệnh lên danh sách [{ dish, quantity }]; trả về danh sách mới */
export const applyVoiceOp = (draft, op) => {
  if (op.type === "clear") return [];
  const id = op.dish.dishId;
  const current = draft.find((it) => it.dish.dishId === id)?.quantity || 0;
  let next = current;
  if (op.type === "add") next = current + op.quantity;
  else if (op.type === "set") next = op.quantity;
  else if (op.type === "remove") next = op.quantity === null ? 0 : current - op.quantity;

  if (next <= 0) return draft.filter((it) => it.dish.dishId !== id);
  if (current > 0) return draft.map((it) => (it.dish.dishId === id ? { ...it, quantity: next } : it));
  return [...draft, { dish: op.dish, quantity: next }];
};

/**
 * Áp kết quả parseVoiceCommand lên danh sách món đang chọn.
 * lastDish: món vừa được nhắc tới ở câu trước; lệnh không nêu món ("giảm một bát") áp vào món đó,
 * hoặc vào món duy nhất trong danh sách. Không xác định được món thì bỏ qua và đếm vào unresolved.
 * Món nói thiếu tên khi bỏ/đổi số lượng được hiểu là món đang có trong danh sách nếu chỉ có một;
 * còn lại trả về pending để khách chọn.
 * Trả về { draft, pending, unresolved, lastDish }.
 */
export const applyVoiceCommand = (draft, command, lastDish = null) => {
  let next = draft;
  let target = lastDish;
  let unresolved = 0;
  const inList = (dish) => dish && next.some((it) => it.dish.dishId === dish.dishId);
  for (const op of command.ops) {
    if (op.type === "clear") {
      next = [];
      continue;
    }
    const dish = op.dish || (inList(target) ? target : next.length === 1 ? next[0].dish : null);
    if (!dish) {
      unresolved++;
      continue;
    }
    next = applyVoiceOp(next, { ...op, dish });
    target = dish;
  }
  const pending = [];
  for (const amb of command.ambiguous) {
    const inDraft = amb.options.filter(inList);
    if (amb.type !== "add" && inDraft.length === 1) {
      next = applyVoiceOp(next, { type: amb.type, dish: inDraft[0], quantity: amb.quantity });
      target = inDraft[0];
    } else {
      pending.push(amb);
    }
  }
  return { draft: next, pending, unresolved, lastDish: target };
};
