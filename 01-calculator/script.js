// Scientific calculator — no eval(). Builds an expression string as the
// user types, then evaluates it with a small hand-written tokenizer +
// recursive-descent parser that respects operator precedence,
// parentheses, functions (sin/cos/tan/log/ln/sqrt), constants (π, e),
// factorial, percent, and implicit multiplication like "2π" or "3(4+1)".

// ---------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------

const FUNCTION_NAMES = ["sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt"];

function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === " ") {
      i++;
      continue;
    }

    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const numStr = input.slice(i, j);
      if ((numStr.match(/\./g) || []).length > 1) {
        throw new Error("Invalid number");
      }
      tokens.push({ type: "NUM", value: parseFloat(numStr) });
      i = j;
      continue;
    }

    if (/[a-zA-Z]/.test(ch)) {
      let j = i;
      while (j < input.length && /[a-zA-Z]/.test(input[j])) j++;
      const word = input.slice(i, j);
      if (FUNCTION_NAMES.includes(word)) {
        tokens.push({ type: "FUNC", value: word });
      } else if (word === "e") {
        tokens.push({ type: "NUM", value: Math.E });
      } else {
        throw new Error(`Unknown identifier: ${word}`);
      }
      i = j;
      continue;
    }

    if (ch === "π") {
      tokens.push({ type: "NUM", value: Math.PI });
      i++;
      continue;
    }

    if ("+-*/^%!()".includes(ch)) {
      tokens.push({ type: ch });
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${ch}`);
  }

  return tokens;
}

// ---------------------------------------------------------------------
// Recursive-descent parser
//   expression := term (('+' | '-') term)*
//   term       := unary (('*' | '/' | <implicit>) unary)*
//   unary      := '-' unary | '+' unary | power
//   power      := postfix ('^' unary)?           (right-associative)
//   postfix    := primary ('!' | '%')*
//   primary    := NUM | FUNC '(' expression ')' | '(' expression ')'
// ---------------------------------------------------------------------

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  next() {
    return this.tokens[this.pos++];
  }

  expect(type) {
    const token = this.next();
    if (!token || token.type !== type) {
      throw new Error(`Expected '${type}'`);
    }
    return token;
  }

  startsPrimary(token) {
    return !!token && (token.type === "NUM" || token.type === "FUNC" || token.type === "(");
  }

  parseExpression() {
    let value = this.parseTerm();
    while (this.peek() && (this.peek().type === "+" || this.peek().type === "-")) {
      const op = this.next().type;
      const rhs = this.parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  parseTerm() {
    let value = this.parseUnary();
    while (this.peek() && (this.peek().type === "*" || this.peek().type === "/" || this.startsPrimary(this.peek()))) {
      if (this.peek().type === "*" || this.peek().type === "/") {
        const op = this.next().type;
        const rhs = this.parseUnary();
        value = op === "*" ? value * rhs : value / rhs;
      } else {
        // Implicit multiplication, e.g. "2π" or "3(4+1)" or "2sin(30)"
        const rhs = this.parseUnary();
        value = value * rhs;
      }
    }
    return value;
  }

  parseUnary() {
    if (this.peek() && this.peek().type === "-") {
      this.next();
      return -this.parseUnary();
    }
    if (this.peek() && this.peek().type === "+") {
      this.next();
      return this.parseUnary();
    }
    return this.parsePower();
  }

  parsePower() {
    let base = this.parsePostfix();
    if (this.peek() && this.peek().type === "^") {
      this.next();
      const exponent = this.parseUnary();
      base = Math.pow(base, exponent);
    }
    return base;
  }

  parsePostfix() {
    let value = this.parsePrimary();
    while (this.peek() && (this.peek().type === "!" || this.peek().type === "%")) {
      const op = this.next().type;
      value = op === "!" ? factorial(value) : value / 100;
    }
    return value;
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "NUM") {
      this.next();
      return token.value;
    }

    if (token.type === "FUNC") {
      this.next();
      this.expect("(");
      const arg = this.parseExpression();
      this.expect(")");
      return applyFunction(token.value, arg);
    }

    if (token.type === "(") {
      this.next();
      const value = this.parseExpression();
      this.expect(")");
      return value;
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }
}

function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) throw new Error("n! needs a non-negative integer");
  if (n > 170) throw new Error("Number too large");
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function applyFunction(name, arg) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const useDeg = angleMode === "DEG";

  switch (name) {
    case "sin":
      return Math.sin(useDeg ? toRad(arg) : arg);
    case "cos":
      return Math.cos(useDeg ? toRad(arg) : arg);
    case "tan":
      return Math.tan(useDeg ? toRad(arg) : arg);
    case "asin":
      return useDeg ? toDeg(Math.asin(arg)) : Math.asin(arg);
    case "acos":
      return useDeg ? toDeg(Math.acos(arg)) : Math.acos(arg);
    case "atan":
      return useDeg ? toDeg(Math.atan(arg)) : Math.atan(arg);
    case "log":
      if (arg <= 0) throw new Error("log of non-positive number");
      return Math.log10(arg);
    case "ln":
      if (arg <= 0) throw new Error("ln of non-positive number");
      return Math.log(arg);
    case "sqrt":
      if (arg < 0) throw new Error("sqrt of negative number");
      return Math.sqrt(arg);
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

function evaluateExpression(str) {
  const tokens = tokenize(str);
  if (tokens.length === 0) throw new Error("Empty expression");
  const parser = new Parser(tokens);
  const result = parser.parseExpression();
  if (parser.pos !== tokens.length) throw new Error("Unexpected trailing input");
  return result;
}

// ---------------------------------------------------------------------
// UI state and wiring
// ---------------------------------------------------------------------

const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const modeToggle = document.getElementById("modeToggle");
const sciButtons = document.querySelectorAll(".key.sci");
const angleToggle = document.getElementById("angleToggle");

let currentExpr = "";
let justEvaluated = false;
let lastAnswer = 0;
let angleMode = "DEG"; // or "RAD"

function updateDisplay() {
  resultEl.textContent = currentExpr === "" ? "0" : currentExpr;
}

function formatNumber(value) {
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

function insertText(text, { fresh = false } = {}) {
  if (justEvaluated) {
    if (!fresh) {
      // continuing from the previous result (e.g. pressing "+")
    } else {
      // Starting an unrelated new number — drop the old expression so the
      // top line never shows a stale "X = " above input that isn't part of it.
      currentExpr = "";
      expressionEl.textContent = "";
    }
    justEvaluated = false;
  }
  currentExpr += text;
  updateDisplay();
}

function clearAll() {
  currentExpr = "";
  justEvaluated = false;
  expressionEl.textContent = "";
  updateDisplay();
}

function deleteLast() {
  if (justEvaluated) {
    currentExpr = "";
    justEvaluated = false;
  } else {
    currentExpr = currentExpr.slice(0, -1);
  }
  updateDisplay();
}

function insertPercent() {
  insertText("%", { fresh: false });
}

function insertAns() {
  insertText(formatNumber(lastAnswer), { fresh: true });
}

function toggleAngleMode() {
  angleMode = angleMode === "DEG" ? "RAD" : "DEG";
  angleToggle.textContent = angleMode;
}

function evaluate() {
  if (currentExpr === "") return;
  try {
    const result = evaluateExpression(currentExpr);
    if (!isFinite(result)) throw new Error("Math error");
    expressionEl.textContent = `${currentExpr} =`;
    lastAnswer = result;
    currentExpr = formatNumber(result);
    justEvaluated = true;
    updateDisplay();
  } catch (err) {
    expressionEl.textContent = `${currentExpr} =`;
    resultEl.textContent = "Error";
    currentExpr = "";
    justEvaluated = true;
  }
}

function toggleScientific() {
  const turningOn = sciButtons[0].hidden;
  sciButtons.forEach((btn) => {
    btn.hidden = !turningOn;
  });
  modeToggle.textContent = turningOn ? "Basic" : "Scientific";
  modeToggle.classList.toggle("active", turningOn);
}

document.querySelectorAll(".key").forEach((button) => {
  button.addEventListener("click", () => {
    const { insert, action, fresh } = button.dataset;

    if (insert !== undefined) {
      insertText(insert, { fresh: fresh !== undefined });
      return;
    }

    if (action === "decimal") insertText(".", { fresh: false });
    else if (action === "clear") clearAll();
    else if (action === "delete") deleteLast();
    else if (action === "percent") insertPercent();
    else if (action === "ans") insertAns();
    else if (action === "angle") toggleAngleMode();
    else if (action === "equals") evaluate();
    else if (action === "toggle-mode") toggleScientific();
  });
});

document.addEventListener("keydown", (e) => {
  if (/[0-9.]/.test(e.key)) insertText(e.key, { fresh: /[0-9]/.test(e.key) });
  else if ("+-*/^()".includes(e.key)) insertText(e.key, { fresh: e.key === "(" });
  else if (e.key === "%") insertPercent();
  else if (e.key === "Enter" || e.key === "=") evaluate();
  else if (e.key === "Backspace") deleteLast();
  else if (e.key === "Escape") clearAll();
});

updateDisplay();
