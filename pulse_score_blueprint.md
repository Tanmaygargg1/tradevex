# Pulse Score — Master Blueprint Prompt

Use this prompt to resume the project in a new conversation if needed. Paste it as your first message.

---

## Context

I am a beginner (some Python, no web dev experience) building a stock signal web app called **Pulse Score** as a portfolio project to impress universities. I want you to TEACH me as we build, not just write the code for me. Explain each file and concept as we go.

---

## What we are building

A multi-page website called **Pulse Score** — a stock signal scoring system that runs entirely in the browser with no backend server. It is built with **Astro** (astro.build) and deployed to **GitHub Pages** with a custom domain.

The site has three pages:

### Page 1 — Home / screener (`/`)
- A clean hero section explaining what Pulse Score is
- A search input where the user types any US stock ticker (e.g. AAPL, TSLA)
- On submit: fetches real stock data, runs the algorithm, and displays the result
- Shows the total Pulse Score (0–100) as a large animated number
- Shows a breakdown of all 5 factor scores as a horizontal bar chart
- Shows a 90-day price chart with the 10-day and 30-day moving average lines overlaid
- Shows buy/sell signal markers on the chart at MA crossover points
- Shows key stats: current price, % change today, volume vs average

### Page 2 — How it works (`/how-it-works`)
- A full explanation of the algorithm written for a non-finance audience
- Interactive factor explainer (stepper through all 5 factors with visual examples)
- The full maths behind each factor shown clearly
- A section explaining what the score means (0–40 weak, 40–70 moderate, 70–100 strong)
- A disclaimer that this is educational, not financial advice

### Page 3 — Download Pine Script (`/pine-script`)
- Explanation of what TradingView and Pine Script are
- A syntax-highlighted code block showing the full Pine Script v6 indicator
- A copy-to-clipboard button
- A download button that downloads the .pine file
- Step-by-step instructions for adding it to TradingView

---

## The algorithm — Pulse Score (0–100)

Five factors, each scored 0–20, summed to give a total of 0–100.

### Factor 1 — Momentum (0–20 pts)
Measures how far the current price is above or below its 20-day simple moving average.

```
pct_above_avg = (close - sma_20) / sma_20 * 100
score = clamp(pct_above_avg * 2, 0, 20)
```

- If price is 10%+ above its 20-day avg → full 20 pts
- If price equals avg → ~0 pts
- If price is below avg → 0 pts (clamped)

### Factor 2 — Volume Surge (0–20 pts)
Compares today's volume to the 20-day average volume.

```
surge_ratio = volume_today / avg_volume_20d
score = clamp((surge_ratio - 1) * 10, 0, 20)
```

- 1× average volume → 0 pts
- 2× average volume → 10 pts
- 3×+ average volume → 20 pts (capped)

### Factor 3 — Trend Consistency (0–20 pts)
Counts how many of the last 10 trading days closed higher than they opened (green candles).

```
up_days = count of days where close > open, in last 10 days
score = (up_days / 10) * 20
```

- 10/10 green days → 20 pts
- 5/10 → 10 pts
- 0/10 → 0 pts

### Factor 4 — Volatility-Adjusted Strength (0–20 pts)
Measures the 5-day return relative to the stock's average daily range (ATR) — how big is the move compared to normal noise?

```
atr_20 = average of (high - low) over last 20 days
five_day_return = (close_today - close_5d_ago) / close_5d_ago * 100
avg_daily_pct_range = atr_20 / close_today * 100
strength_ratio = five_day_return / avg_daily_pct_range
score = clamp(strength_ratio * 5, 0, 20)
```

- Move = 4× the normal daily range over 5 days → 20 pts
- This makes the score comparable across volatile and stable stocks

### Factor 5 — Earnings Surprise (0–20 pts)
The SUE (Standardised Unexpected Earnings) factor. Did the company beat analyst estimates last quarter?

```
surprise_pct = (actual_eps - estimated_eps) / abs(estimated_eps) * 100
score = clamp(surprise_pct * 1.5, 0, 20)
```

- Beat by 13%+ → full 20 pts
- Met exactly → 0 pts
- Missed → 0 pts (clamped)
- Data source: Yahoo Finance `earningsHistory` or `defaultKeyStatistics` endpoint

### Score interpretation
- 0–30 → Weak / no signal
- 31–50 → Below average
- 51–70 → Moderate signal
- 71–85 → Strong signal
- 86–100 → Very strong signal

---

## Data source

All data comes from **Yahoo Finance** via this free endpoint pattern (no API key needed):

```
https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?interval=1d&range=3mo
```

For earnings data:
```
https://query1.finance.yahoo.com/v10/finance/quoteSummary/{TICKER}?modules=earningsHistory,defaultKeyStatistics
```

**CORS issue:** Yahoo Finance blocks direct browser requests. Solution: use a lightweight public CORS proxy or deploy a Cloudflare Worker (free) that forwards the request. The Cloudflare Worker is 10 lines of code and lives at a URL like `https://pulse-proxy.yourname.workers.dev/?ticker=AAPL`.

The Cloudflare Worker code:
```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ticker = url.searchParams.get('ticker');
    const type = url.searchParams.get('type') || 'chart';
    
    let yahooUrl;
    if (type === 'chart') {
      yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=3mo`;
    } else if (type === 'summary') {
      yahooUrl = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=earningsHistory,defaultKeyStatistics`;
    }

    const response = await fetch(yahooUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
```

---

## Tech stack

| Layer | Tool | Why |
|---|---|---|
| Framework | Astro 4.x | Static output, perfect for GitHub Pages, beginner-friendly |
| Styling | Plain CSS + CSS variables | No build complexity, easy to understand |
| Charts | Chart.js (CDN) | Simple, well-documented, works in browser |
| Data | Yahoo Finance (via proxy) | Free, no API key, real data |
| Deployment | GitHub Pages | Free, custom domain support |
| Proxy | Cloudflare Workers (free tier) | Handles CORS, 10-line deploy |
| Pine Script | TradingView Pine Script v6 | Downloadable from the site |

---

## Project file structure

```
pulse-score/
├── public/
│   ├── favicon.svg
│   └── pulse-signal.pine          ← downloadable Pine Script file
├── src/
│   ├── layouts/
│   │   └── Base.astro              ← shared HTML shell, nav, footer
│   ├── pages/
│   │   ├── index.astro             ← home / screener
│   │   ├── how-it-works.astro      ← algorithm explainer
│   │   └── pine-script.astro       ← Pine Script download page
│   ├── components/
│   │   ├── Screener.astro          ← ticker search + result display
│   │   ├── ScoreDisplay.astro      ← the big score number + bars
│   │   ├── PriceChart.astro        ← Chart.js price + MA chart
│   │   ├── FactorExplainer.astro   ← interactive stepper
│   │   └── CodeBlock.astro         ← syntax highlighted code + copy btn
│   ├── scripts/
│   │   ├── pulse.js                ← the algorithm (pure JS functions)
│   │   └── yahoo.js                ← data fetching + parsing
│   └── styles/
│       └── global.css              ← CSS variables, reset, typography
├── astro.config.mjs
└── package.json
```

---

## Design aesthetic

- Dark background: `#0a0a0b`
- Accent colour: `#c8f135` (sharp yellow-green — stands out, memorable)
- Secondary accent: `#7cf0c8` (teal-mint)
- Danger/sell: `#f0604c`
- Font: Syne (headings, display) + Space Mono (numbers, code, data)
- Feel: terminal-inspired but clean. Like a Bloomberg terminal crossed with a modern SaaS product
- No gradients on backgrounds. Sharp borders. Generous whitespace.
- Score colours: red below 40, amber 40–70, green above 70

---

## Pine Script v6 indicator (full code to put in public/pulse-signal.pine)

```pine
//@version=6
indicator(
     title            = "Pulse Score Signal",
     shorttitle       = "Pulse",
     overlay          = true,
     max_labels_count = 500
     )

// ── Inputs ─────────────────────────────────────────────────────
fast_len     = input.int(10, minval=2,  maxval=200, title="Fast MA",  group="Moving averages")
slow_len     = input.int(30, minval=5,  maxval=500, title="Slow MA",  group="Moving averages")
ma_type      = input.string("SMA", options=["SMA","EMA"],             title="MA type", group="Moving averages")
vol_mult     = input.float(2.0, minval=1.0, maxval=5.0, step=0.1,    title="Volume surge threshold (×avg)", group="Filters")
show_labels  = input.bool(true,  title="Show BUY / SELL labels",      group="Visuals")
show_shading = input.bool(true,  title="Shade background",            group="Visuals")
show_table   = input.bool(true,  title="Show dashboard",              group="Visuals")

// ── Calculations ────────────────────────────────────────────────
fast_ma = ma_type == "EMA" ? ta.ema(close, fast_len) : ta.sma(close, fast_len)
slow_ma = ma_type == "EMA" ? ta.ema(close, slow_len) : ta.sma(close, slow_len)

// Volume surge filter
avg_vol     = ta.sma(volume, 20)
vol_surge   = volume > avg_vol * vol_mult

// Trend consistency (last 10 bars)
up_count = 0
for i = 0 to 9
    if close[i] > open[i]
        up_count += 1
consistency = up_count / 10.0

// Volatility-adjusted strength
atr_20      = ta.atr(20)
ret_5d      = (close - close[5]) / close[5] * 100
avg_range   = atr_20 / close * 100
vol_adj_str = avg_range > 0 ? ret_5d / avg_range : 0

// Momentum
momentum    = (close - ta.sma(close, 20)) / ta.sma(close, 20) * 100

// Score components (each 0–20)
s_momentum  = math.min(math.max(momentum * 2, 0), 20)
s_volume    = vol_surge ? 20.0 : math.min(math.max((volume / avg_vol - 1) * 10, 0), 20)
s_consist   = consistency * 20
s_volstr    = math.min(math.max(vol_adj_str * 5, 0), 20)

pulse_score = s_momentum + s_volume + s_consist + s_volstr

// Crossover signals
bullish_cross = ta.crossover(fast_ma,  slow_ma)
bearish_cross = ta.crossunder(fast_ma, slow_ma)
is_bullish    = fast_ma > slow_ma

// ── Visuals ─────────────────────────────────────────────────────
plot(fast_ma, title="Fast MA", color=color.new(#7cf0c8, 0), linewidth=2)
plot(slow_ma, title="Slow MA", color=color.new(#f0b84c, 0), linewidth=2)

bull_bg = color.new(color.green, 92)
bear_bg = color.new(color.red,   92)
bgcolor(show_shading ? (is_bullish ? bull_bg : bear_bg) : na)

if bullish_cross and show_labels
    label.new(bar_index, low,
              text      = "BUY  " + str.tostring(math.round(pulse_score)),
              style     = label.style_label_up,
              color     = color.new(#c8f135, 5),
              textcolor = #0a0a0b,
              size      = size.normal,
              yloc      = yloc.belowbar)

if bearish_cross and show_labels
    label.new(bar_index, high,
              text      = "SELL  " + str.tostring(math.round(pulse_score)),
              style     = label.style_label_down,
              color     = color.new(#f0604c, 5),
              textcolor = color.white,
              size      = size.normal,
              yloc      = yloc.abovebar)

// Dashboard table
if show_table and barstate.islast
    var table dash = table.new(
         position     = position.top_right,
         columns      = 2,
         rows         = 7,
         bgcolor      = color.new(#0a0a0b, 20),
         border_color = color.new(color.white, 70),
         border_width = 1)

    cell(c, r, txt, clr) =>
        table.cell(dash, c, r, txt,
                   text_color = clr,
                   text_size  = size.small,
                   bgcolor    = color.new(#0a0a0b, 20))

    score_color = pulse_score >= 70 ? #c8f135 : pulse_score >= 40 ? #f0b84c : #f0604c
    sig_txt     = is_bullish ? "▲  BULLISH" : "▼  BEARISH"
    sig_clr     = is_bullish ? #c8f135      : #f0604c

    cell(0,0,"PULSE SCORE",color.gray), cell(1,0,str.tostring(math.round(pulse_score)) + " / 100", score_color)
    cell(0,1,"Signal",     color.gray), cell(1,1,sig_txt,  sig_clr)
    cell(0,2,"Momentum",   color.gray), cell(1,2,str.tostring(math.round(s_momentum))  + " / 20", color.white)
    cell(0,3,"Volume",     color.gray), cell(1,3,str.tostring(math.round(s_volume))    + " / 20", color.white)
    cell(0,4,"Consistency",color.gray), cell(1,4,str.tostring(math.round(s_consist))   + " / 20", color.white)
    cell(0,5,"Vol.strength",color.gray),cell(1,5,str.tostring(math.round(s_volstr))    + " / 20", color.white)
    cell(0,6,"Price",      color.gray), cell(1,6,str.tostring(close, format.mintick),   color.white)

alertcondition(bullish_cross, title="Pulse BUY",  message="Pulse Score BUY — {{ticker}} | Score: {{plot_0}}")
alertcondition(bearish_cross, title="Pulse SELL", message="Pulse Score SELL — {{ticker}} | Score: {{plot_0}}")
```

---

## Teaching approach

**Do not just write all the code.** Instead:

1. Explain what we are about to build and why
2. Write the code together, one file at a time
3. After each file, explain every meaningful line — what it does and why it is written that way
4. Ask me to try things myself before revealing the answer when appropriate
5. Flag when something is a concept I should research further (e.g. "look up CSS custom properties")
6. If I get stuck, give hints before full solutions

## Build order

1. Set up Astro project locally (`npm create astro@latest`)
2. Configure `astro.config.mjs` for GitHub Pages static output
3. Build `global.css` — design tokens, reset, typography
4. Build `Base.astro` layout — HTML shell, nav, footer
5. Build `yahoo.js` — data fetching functions
6. Build `pulse.js` — the algorithm in pure JS
7. Build `index.astro` + `Screener.astro` — the main screener page
8. Build `ScoreDisplay.astro` — score number + factor bars
9. Build `PriceChart.astro` — Chart.js integration
10. Build `how-it-works.astro` — explainer page
11. Build `pine-script.astro` + `CodeBlock.astro` — Pine Script page
12. Deploy to GitHub Pages + custom domain setup
13. Deploy Cloudflare Worker proxy

## Hosting setup

- GitHub repo: push the whole project, run `astro build`, commit the `dist/` folder OR use GitHub Actions to auto-build on push
- GitHub Pages: set source to `dist/` folder or Actions output
- Custom domain: add a `CNAME` file in `public/` with the domain name, then point DNS A record to GitHub Pages IPs (185.199.108.153 etc) or CNAME record to `username.github.io`
- Astro config needs `site` and `base` set correctly for GitHub Pages

## Important notes for the AI assistant

- The user is learning, not just shipping. Prioritise explanation over speed.
- When writing code, always say what file it goes in and where in that file.
- Always explain imports — the user does not know what they are yet.
- Never skip steps. If something requires the terminal, show the exact command.
- If a concept appears that is tangential but important (like "what is a Promise"), give a one-paragraph plain English explanation inline.
- The user's skill level: comfortable reading Python, never written JavaScript or HTML beyond basics, never used a terminal for web development.
- Do not assume any prior knowledge of npm, Node.js, package managers, or build tools.
