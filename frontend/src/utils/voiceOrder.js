// Phân tích câu khách nói (đã chuyển thành chữ) thành danh sách món + số lượng, dựa trên thực đơn.
// Ví dụ: "cho hai phở bò với một ly trà đá" -> Phở bò x2, Trà đá x1.

const DIGITS = { một: 1, mốt: 1, hai: 2, ba: 3, bốn: 4, tư: 4, năm: 5, lăm: 5, sáu: 6, bảy: 7, bẩy: 7, tám: 8, chín: 9 };
const DIGITS_PLAIN = { mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, lam: 5, sau: 6, bay: 7, tam: 8, chin: 9 };

// Từ chỉ đơn vị đứng giữa số lượng và tên món: "hai ly trà đá"
const CLASSIFIERS = new Set(["ly", "cốc", "phần", "suất", "xuất", "bát", "tô", "đĩa", "dĩa", "chai", "lon", "cái", "chén", "ấm", "bình", "miếng", "con", "trái", "quả"]);
const CLASSIFIERS_PLAIN = new Set(["ly", "coc", "phan", "suat", "xuat", "bat", "to", "dia", "chai", "lon", "cai", "chen", "binh", "mieng", "con", "trai", "qua"]);

// Từ đệm, không mang nghĩa món ăn; cũng là ranh giới giữa các món
const FILLERS = new Set(["cho", "tôi", "mình", "em", "anh", "chị", "lấy", "gọi", "thêm", "và", "với", "nữa", "nhé", "nha", "ạ", "ơi", "món", "đặt", "muốn", "thì", "là", "có", "luôn", "giúp"]);
const FILLERS_PLAIN = new Set(["cho", "toi", "minh", "em", "anh", "chi", "lay", "goi", "them", "va", "voi", "nua", "nhe", "nha", "a", "oi", "mon", "dat", "muon", "thi", "la", "co", "luon", "giup"]);

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
 * Trả về { items: [{ ...dish, quantity }], ambiguous: [{ quantity, phrase, options }], unmatched: [phrase] }
 */
export const parseVoiceOrder = (transcript, dishes = []) => {
  const tokens = tokenize(transcript);
  const menu = dishes
    .map((dish) => ({ dish, words: tokenize(dish.name ?? dish.dishName).filter((t) => !t.sep) }))
    .filter((m) => m.words.length > 0);

  const items = [];
  const ambiguous = [];
  const unmatched = [];
  let numberWords = [];
  let unknownWords = [];
  let lastDefaulted = null; // món vừa nhận mà chưa nói số lượng, để nhận số lượng nói sau tên món

  const takeQuantity = () => {
    const quantity = parseVietnameseNumber(numberWords);
    numberWords = [];
    return quantity;
  };
  const flushUnknown = () => {
    if (unknownWords.length) unmatched.push(unknownWords.join(" "));
    unknownWords = [];
  };
  // Ranh giới (từ đệm, dấu câu, hết câu): số lượng còn treo thuộc về món vừa nói trước đó
  const closeSegment = () => {
    flushUnknown();
    const quantity = takeQuantity();
    if (quantity && lastDefaulted) lastDefaulted.quantity += quantity - 1;
    lastDefaulted = null;
  };
  const addItem = (dish) => {
    const spoken = takeQuantity();
    const quantity = spoken || 1;
    let item = items.find((it) => it.dishId === dish.dishId);
    if (item) item.quantity += quantity;
    else items.push((item = { ...dish, quantity }));
    lastDefaulted = spoken ? null : item;
  };

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.sep) {
      closeSegment();
      i++;
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
      addItem(best.dish);
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
    if (isFiller(token)) {
      closeSegment();
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
      addItem(candidates[0]);
      i += longest;
      continue;
    }
    if (candidates.length > 1) {
      flushUnknown();
      const phrase = tokens.slice(i, i + longest).map((t) => t.raw).join(" ");
      ambiguous.push({ quantity: takeQuantity() || 1, phrase, options: candidates });
      lastDefaulted = null;
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

  return { items, ambiguous, unmatched };
};
