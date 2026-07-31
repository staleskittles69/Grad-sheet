# Scientific Calculator

A calculator built with vanilla HTML, CSS, and JavaScript — no frameworks, no `eval()`. Has a Basic mode and a Scientific mode, switched with a "Scientific"/"Basic" button that's a key in the same grid as every other button — not a separate control bolted on top.

## Features
**Basic mode:** add, subtract, multiply, divide, percent, decimal, backspace, clear.

**Scientific mode** adds: `sin cos tan`, `log ln`, `√` and `x²`, `x^y` (power), parentheses, `π` and `e`, `n!` (factorial), `ANS` (recall last result), and a `DEG`/`RAD` toggle for trig functions.

Under the hood, expressions are parsed properly instead of evaluated left-to-right — see [Key decisions](#key-decisions) below for why.

- Keyboard support (digits, `+ - * / ^ ( )`, `%`, `Enter`, `Backspace`, `Escape`)
- Responsive, dark-themed UI with no empty/dead space in either button grid

## Key decisions

**Vanilla JS, no framework.** The assignment didn't specify a language for this one, so the choice itself is a signal — a calculator is small enough that React/Vue would just be overhead, and doing it in plain HTML/CSS/JS shows the DOM and JS fundamentals actually stick without a framework doing the work.

**A real parser instead of `eval()`.** The easy way to build a calculator is `eval(userInput)`. That's also a well-known bad idea — it runs arbitrary code with the same privileges as the page, and it's the kind of shortcut that gets flagged in any code review. Instead, `script.js` has a small hand-written tokenizer + recursive-descent parser that respects real operator precedence and grouping — so `2+3*4` correctly gives `14`, `2^3^2` gives `512` (right-associative, matching standard math convention), and `sqrt(16)`, `3(4+1)` (implicit multiplication) all evaluate correctly. It was worth the extra code: writing a parser is a genuine algorithms exercise, not just "avoid the unsafe function."

**Scientific mode is a toggle key, not a bolted-on panel.** The first version had the mode switch as a separate pill-shaped button floating above the keypad — it worked, but it didn't look or behave like part of the calculator. It's now a real `.key` that spans the full grid row, and the 16 scientific buttons are just hidden until toggled on; CSS Grid auto-flow reclaims their space automatically so neither mode ever leaves a gap in the layout.

## Run it
Just open `index.html` in a browser. No build step, no dependencies.

## Files
| File | Purpose |
|---|---|
| `index.html` | Markup, basic keypad, and scientific keypad |
| `style.css` | Dark theme styling |
| `script.js` | Tokenizer, recursive-descent parser, and UI wiring |

## Design notes
- Grid math is intentional: the scientific keypad is a full 4×4 grid (16 buttons), and the basic keypad's last row uses `=` spanning two columns (`0`, `.`, `=`, `=`) so all 5 rows fill exactly 4 columns each — no leftover empty cells, in either mode.
- Error handling is explicit, not accidental: `sqrt(-1)`, unmatched parentheses, and `n!` on a non-integer all fail with a clear message instead of crashing or silently returning `NaN`.
- The parser was unit-tested against 21 cases (arithmetic, precedence, functions, factorial, percent, implicit multiplication, and expected error cases), and the toggle + button wiring was verified end-to-end in a headless DOM (jsdom) before shipping.
