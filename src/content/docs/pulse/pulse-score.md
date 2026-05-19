## Overview {#overview}

Pulse Score is a quantitative signal model for US equities built on top of live Yahoo Finance data. It is designed to answer one deceptively simple question: *is this stock, right now, in the kind of condition that tends to precede further price appreciation?* Rather than relying on a single metric — which any experienced trader will tell you is a recipe for false signals — Pulse aggregates five independent dimensions of price and earnings behaviour into one composite score from 0 to 100.

The design philosophy is rooted in a straightforward observation: when multiple independent factors all point in the same direction simultaneously, the probability of a sustained move in that direction increases meaningfully. A stock that is trending above its moving average, trading on high volume, closing green day after day, showing RSI in the ideal bullish zone, *and* has just beaten earnings estimates is a fundamentally different setup from one that only satisfies one of those conditions. Pulse exists to quantify that difference.

Every component of the score is computed in real time in your browser. There are no black boxes, no proprietary weightings obscured behind marketing copy, and no reliance on delayed or paywalled data. The source data is Yahoo Finance's public API, fetched through a CORS proxy chain for browser compatibility, and every calculation is visible and reproducible.

<div class="docs-callout">
<strong>Core principle:</strong> Each factor is capped at 20 points. No single dimension can dominate the composite. A stock can have exceptional momentum but poor volume — and that ambiguity will be visible in the score. The model rewards factor alignment, not extremity in one dimension.
</div>

---

## Scoring System {#scoring-system}

Five factors, each scored 0–20, are summed to produce the total Pulse Score (0–100).

| # | Factor | Max | Dimension measured |
|---|--------|-----|--------------------|
| 01 | Momentum | 20 | Price position relative to 20-day SMA |
| 02 | Volume Surge | 20 | Today's volume vs 20-day average |
| 03 | Trend Consistency | 20 | Proportion of sessions closing green over 10 days |
| 04 | RSI Quality | 20 | 14-period RSI position within the ideal bullish zone |
| 05 | Earnings Surprise | 20 | Latest EPS beat magnitude vs analyst estimate |

Each factor is scored on a continuous scale — not binary. A stock 3% above its 20-day SMA scores differently from one 8% above it. This continuity means the composite score reflects gradations of strength rather than on/off switches.

The equal 20-point cap per factor is deliberate. It prevents any one factor from making or breaking the signal alone. Momentum is one of the most well-studied phenomena in quantitative finance — but momentum alone has historically produced drawdowns of 30–40% during trend reversals. Adding volume confirmation, consistency checks, RSI quality filtering, and earnings data creates a more robust multi-dimensional filter.

---

## Momentum {#momentum}

Price momentum is the tendency for assets that have been outperforming to continue outperforming over the near term. It is one of the most extensively documented anomalies in academic finance — first formally studied by Jegadeesh and Titman in their landmark 1993 paper, and replicated across asset classes and geographies ever since.

Pulse measures momentum using the simplest and most widely understood expression of it: the distance between the current price and the 20-day simple moving average. The 20-day SMA is the arithmetic mean of the previous 20 closing prices. When a stock is trading above it, buyers have been winning on average over the past month. The further above the SMA the price sits, the stronger and more persistent that buying pressure has been.

The 20-day window was chosen because it represents approximately one trading month — long enough to smooth out single-day noise, short enough to remain relevant to near-term momentum. Shorter windows (5, 10 days) are too reactive to individual sessions. Longer windows (50, 200 days) measure structural trends operating on a completely different timescale. Twenty days hits the sweet spot for medium-term momentum that correlates with continued short-to-medium-term outperformance.

### Formula

<div class="docs-formula">pct_above = (close_today − sma_20) / sma_20 × 100
score     = clamp(pct_above × 2, 0, 20)</div>

A stock at exactly its 20-day SMA scores 0. A stock 10% above its SMA scores the maximum 20 points. The multiplier of 2 was calibrated so that genuinely strong momentum — the kind that tends to precede continued outperformance — produces high scores without requiring extreme outlier conditions. Any negative value (price below SMA) floors to zero; Pulse does not score negative momentum, it simply registers the absence of positive momentum.

### Why this works

The logic behind why stocks above their moving averages tend to continue rising is behavioural as much as technical. The SMA represents an average cost basis across the window period. When the current price is above it, the average recent buyer is sitting on a profit. Profitable holders tend not to sell aggressively, which reduces supply pressure. Meanwhile, traders who use the SMA as a reference point often view a break above it as confirmation of strength, adding buying pressure. The combination of reduced selling and increased buying creates a self-reinforcing dynamic — at least until the trend exhausts itself.

There is also a self-fulfilling element worth acknowledging: because the 20-day SMA is watched by millions of market participants simultaneously, the levels at which stocks find support or resistance near that average are partly created by participants acting on them. This does not invalidate the signal — it reinforces it. A technical level that "works" because everyone watches it is still a level that works.

---

## Volume Surge {#volume-surge}

Price tells you what happened. Volume tells you how much conviction was behind it. A stock that rises 3% on 5× its normal volume is a very different signal from one that rises 3% on 40% of normal volume. The former suggests broad participation — institutions, retail, systematic funds — all moving in the same direction simultaneously. The latter suggests thin, uncommitted buying that is easily reversed.

Volume surge compares today's volume to the 20-day average volume. The 20-day average smooths out the naturally spiky distribution of volume data, providing a reliable baseline of "what normal looks like" for this specific stock. Individual stocks vary enormously in their absolute volume levels — what constitutes elevated volume for a large-cap S&P 500 constituent is entirely different from a small-cap. By normalising to each stock's own baseline, the factor becomes universally comparable across any ticker.

### Formula

<div class="docs-formula">avg_vol_20d = average(volume, last 20 days)
surge_ratio = today_volume / avg_vol_20d
score       = clamp((surge_ratio − 1) × 10, 0, 20)</div>

A stock trading at its exact 20-day average volume scores 0 (surge ratio of 1.0, minus 1 = 0). A stock trading at 3× its average volume scores the full 20 points (ratio of 3.0, minus 1 = 2.0, times 10 = 20). Volume below the 20-day average scores 0 regardless of how low it goes — the absence of a surge is neutral, not negative.

### Why this works

The institutional footprint theory explains why volume surges matter: large funds cannot execute their orders in a single transaction without moving price against themselves. They accumulate positions over multiple sessions, and each session where they are buyers contributes to above-average volume. When you see a sustained volume surge coinciding with rising prices, you are most likely watching the footprint of a significant buyer building a position. That buyer's continued activity creates a tailwind.

Volume also acts as a false-signal filter. Many technical patterns — breakouts from ranges, bounces off support — look compelling on price charts alone but fail when executed on. Volume confirmation separates patterns where market participants are genuinely responding (high volume) from patterns that are just chart geometry with no real conviction behind them (low volume). The single most common characteristic of failed breakouts is below-average volume on the breakout candle.

---

## Trend Consistency {#trend-consistency}

While momentum measures where price is relative to its average and volume measures participation, Trend Consistency measures the internal texture of recent price action. Specifically: out of the last 10 trading sessions, how many closed green — that is, with the closing price above the opening price?

The distinction between this and momentum is subtle but important. A stock can be sitting 8% above its 20-day SMA — strong momentum score — while having spent the last three sessions declining from a higher level. The momentum factor would still score well, looking only at the current price versus the 20-day average. Trend Consistency would penalise the recent intraday weakness. Together, they paint a more complete picture of whether the bullish pressure is ongoing or fading.

### Formula

<div class="docs-formula">up_days = count of sessions where close > open, over last 10 trading days
score   = (up_days / 10) × 20</div>

A stock where every session closed green (10/10) scores the maximum 20 points. A stock with 5 out of 10 green sessions — essentially a coin-flip — scores 10 points. This 5/10 baseline is critical: in a roughly efficient market, you would expect a stock to close green about half the time by random chance. The factor is calibrated so that random-noise behaviour scores around 10, genuinely directional up-trending behaviour scores above 15, and persistent selling pressure scores below 5.

### Why this works

Ten sessions of consistent up-closes is not an accident. Each individual closing candle represents a contest between buyers and sellers across the entire trading day. When buyers consistently win that contest — session after session — it indicates persistent accumulation. Sellers are not controlling the intraday narrative. Buyers are willing to push price up to close, even when intraday volatility gives them opportunities to take profit and re-enter lower. That pattern of behaviour suggests an asymmetric balance of supply and demand that tends to persist.

Conversely, a stock that opens high and closes low repeatedly is showing that sellers are stepping in aggressively whenever price rises. That dynamic tends to continue until the structural imbalance resolves — usually through either a capitulation move down or a period of sideways digestion that exhausts the sellers.

---

## RSI Quality {#rsi-quality}

The Relative Strength Index (RSI) is one of the most widely used momentum oscillators in technical analysis. Developed by J. Welles Wilder Jr. and published in his 1978 book *New Concepts in Technical Trading Systems*, it measures the speed and magnitude of recent price changes to assess whether an asset is in overbought or oversold territory. Unlike the previous three factors, which reward positive momentum in a linear way, RSI Quality does something more nuanced: it rewards momentum that is *strong but not excessive*.

The insight behind this factor is that very high RSI readings (above 80) are not a bullish sign in the context of a new entry signal — they are a warning. When RSI has climbed to extreme levels, the stock has already made a large portion of the move, the risk/reward of entering a new long has deteriorated significantly, and mean-reversion forces — profit-taking, short-sellers targeting obvious overbought levels, options gamma effects — often push the stock back. The sweet spot for entries is RSI in the 55–75 range: strong enough to confirm an uptrend is in progress, not so stretched that the stock is primed to reverse.

### The Calculation — Wilder's Smoothed Method

RSI is calculated using Wilder's specific smoothing method, which gives more weight to recent price changes without being as reactive as a simple exponential moving average. The 14-period version is used throughout Pulse — the same period Wilder himself recommended and the one that has become the global industry standard.

<div class="docs-formula">Step 1 — Initial averages over the first 14 periods:
  avg_gain_0 = average of all positive day-over-day changes over periods 1–14
  avg_loss_0 = average of all negative changes (absolute value) over periods 1–14

Step 2 — Wilder's smoothing for all subsequent periods:
  avg_gain_n = (avg_gain_{n-1} × 13 + gain_n) / 14
  avg_loss_n = (avg_loss_{n-1} × 13 + loss_n) / 14

Step 3 — RS and RSI:
  RS  = avg_gain / avg_loss
  RSI = 100 − (100 / (1 + RS))</div>

This smoothing method is what distinguishes Wilder's RSI from a naive implementation. It creates an exponentially weighted rolling average with a decay factor of 1/14, which gives the indicator its characteristic smoothness while remaining responsive to recent price changes. RSI needs at least 15 price bars to produce its first meaningful reading, since the first 14 periods are used to seed the initial averages.

### Scoring Logic

<div class="docs-formula">RSI 55 – 75  →  20 pts   (ideal bullish zone — confirmed uptrend, no overbought risk)
RSI 40 – 55  →  linear 0 – 20 pts   (neutral to building — confirmation incomplete)
RSI 75 – 80  →  linear 20 – 0 pts   (entering overbought — entry risk rising)
RSI  > 80    →   0 pts   (extreme overbought — mean-reversion risk outweighs momentum)
RSI  < 40    →   0 pts   (bearish pressure dominates — not a favourable entry zone)</div>

### Why this design

The ideal zone of 55–75 was calibrated from the behaviour of RSI during the strongest trending phases in documented bull markets. RSI tends to oscillate between 40 and 80 during established uptrends — rarely dropping below 40 (which would indicate the trend has broken down), and rarely staying above 80 for extended periods (which signals exhaustion). The zone 55–75 captures the "healthy middle" of an uptrend: above the neutral line, above the levels seen during corrective pullbacks, but below the danger zone where mean-reversion becomes the higher-probability outcome.

Scoring zero above 80 is the most intentional and counterintuitive design decision in this factor. It runs against the instinct of many beginning traders, who interpret RSI above 80 as a sign of extraordinary strength to chase. The problem is that RSI above 80 is an extremely common precursor to short-term pullbacks. While the longer-term trend may be intact, entering at those levels means buying from early holders who are now taking profit — you are the last buyer in the chain. Pulse specifically penalises this configuration to protect users from that mistake.

### Why RSI Quality replaced Volatility-Adjusted Strength

The previous version of Factor 4 used a Volatility-Adjusted Strength metric comparing the 5-day return to the 20-day average true range. While theoretically sound, it had a material practical problem: high correlation with Factor 1 (Momentum). When momentum was strong, vol-adjusted strength was almost always also strong, because both are ultimately expressions of the same underlying phenomenon — price going up. Two factors measuring similar things reduces the diversification benefit of a composite model.

RSI Quality is genuinely orthogonal to momentum in a way that vol-adjusted strength was not. A stock can have strong momentum (price well above the 20d SMA) while having RSI above 80, which RSI Quality penalises. This creates genuine and meaningful tension in the model — exactly what a robust composite signal needs to avoid becoming a single-dimensional momentum chaser dressed up as a multi-factor system.

---

## Earnings Surprise {#earnings-surprise}

The fifth factor steps outside pure price action and into fundamental territory. It asks: did this company's most recent reported earnings per share (EPS) beat what analysts had forecast, and by how much?

The academic basis for this factor is the Standardised Unexpected Earnings (SUE) effect, first formally documented by Victor Bernard and Jacob Thomas in their landmark 1989 paper on post-earnings announcement drift (PEAD). Their finding — replicated across different markets, time periods, and geographies many times over — was that stocks beating consensus EPS estimates by a significant margin tend to systematically outperform the market for the 60–90 days following the announcement. This drift exists because the market does not immediately incorporate all the information embedded in an earnings beat. It processes it gradually over subsequent weeks, creating a predictable and exploitable directional trend.

### Why systematic drift exists

The behavioural explanation for PEAD is that analysts are systematically anchored and slow to revise their forecasts in response to better-than-expected results. When a company beats by 15%, analysts do not immediately raise their forward estimates by a commensurate amount. They anchor to their prior estimates and revise cautiously and incrementally. This creates a persistent gap between the market's expectation (anchored to old estimates) and the company's demonstrated ability to beat — a gap that closes over the following quarters as each successive result continues to surprise to the upside.

There is also a supply and demand mechanism: institutional investors who track earnings surprises systematically buy stocks with significant beats as part of their process. Not all of them can establish their full position in the first days after the announcement, so they continue buying over weeks, creating sustained buying pressure that manifests as the drift.

### Formula

<div class="docs-formula">surprise_pct = (eps_actual − eps_estimate) / |eps_estimate| × 100
score        = clamp(surprise_pct × 1.5, 0, 20)</div>

A company beating by exactly 13.3% scores the full 20 points. A company beating by 5% scores 7.5 points. A miss of any magnitude scores 0 — this factor does not produce negative scores, it registers the absence of a positive fundamental catalyst. When no earnings data is available from Yahoo Finance, the factor also scores 0.

### Interpretation nuances

An earnings surprise of 13%+ is genuinely significant — it means the collective consensus of professional analysts covering the stock was materially wrong about the company's earnings power. When a large group of experienced analysts all miss in the same direction, it typically means something about the business was not properly captured in their models — an accelerating product cycle, better-than-expected margin expansion, stronger pricing power, a new revenue stream not yet fully reflected in forecasts. The market's gradual realisation and repricing of this is what creates the PEAD. High earnings surprise scores are most powerful in combination with strong momentum and elevated volume, as that combination often indicates the market is actively pricing in the re-rating implied by the beat.

---

## Signal Generation {#signal-generation}

The Pulse Score measures *factor alignment* — how many independent dimensions of price behaviour are simultaneously pointing bullish. But the score itself is not a trade trigger. A stock can score 85 on Pulse and still be in a downtrend if the EMA crossover is negative. The score tells you the quality of a potential setup. The moving average crossover tells you the timing.

Pulse overlays an **8-day / 21-day EMA crossover** on the price chart to generate discrete BUY and SELL signals.

| Signal | Condition |
|--------|-----------|
| BUY ↑ | 8-day EMA crosses above 21-day EMA (golden cross) |
| SELL ↓ | 8-day EMA crosses below 21-day EMA (death cross) |

### Why EMA instead of SMA

Exponential moving averages weight recent price data more heavily than older data. The mathematical weighting decays exponentially — the most recent price contributes the most to the average, and each older price contributes progressively less. Simple moving averages treat every price in the window equally — a price from 20 days ago has exactly the same weight as yesterday's price.

In a trending market, this difference matters significantly. EMA reacts faster to the current state of price action because it is not dragged backwards by stale data at the same rate as SMA. When a stock begins to accelerate upward, the EMA crossover triggers earlier than the corresponding SMA crossover. When a trend reverses, the EMA signals the change sooner. Over thousands of signals across many years and tickers, this faster reaction produces meaningfully fewer whipsaw trades caught at the top of rallies or the bottom of drops — the single largest source of losses in crossover strategies.

### Why the 8 and 21 pair specifically

The numbers 8 and 21 are consecutive members of the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13, 21, 34…). Fibonacci numbers appear throughout natural phenomena and — for reasons that are partly empirical rather than purely theoretical — tend to function effectively as parameters in technical trading systems. The 8/21 pair is widely used by professional technicians for several concrete reasons:

**The gap is meaningful but not excessive.** The fast EMA (8 periods) and slow EMA (21 periods) are close enough that a crossover occurs relatively quickly when the trend changes — you are not waiting weeks for a signal you could see was coming. But they are far enough apart that random daily noise does not produce constant false crossovers, as you would get from an overly sensitive pair like 3/8.

**The sensitivity balance.** The 8-period EMA smooths approximately 8 days of price data with exponential decay; the 21-period EMA smooths 21 days. The ratio of 21/8 ≈ 2.625 is close to the square of the golden ratio (φ² ≈ 2.618). Whether or not you believe in the mathematical mysticism of Fibonacci ratios in markets, the empirical evidence for the 8/21 pair performing well across many asset types and timeframes is real and well-documented in the practitioner literature.

**It sits in the practical sweet spot.** The previous version of Pulse used SMA 10/30 — slower, less reactive, and generating signals that were often already stale by the time they fired. Very short pairs like EMA 5/13 generate too many whipsaws on daily data, trading in and out of positions at high frequency with poor net returns. EMA 8/21 strikes the balance between those extremes that most professional short-to-medium-term traders gravitate toward in practice.

### Combining score and signal

The intended use of Pulse is to use both outputs together. The score tells you whether the stock's underlying quantitative condition is strong. The crossover tells you whether the timing is right.

A BUY crossover on a stock with a Pulse Score of 75+ is a high-conviction signal. Multiple independent factors are aligned, and the short-term trend is confirming the broad quantitative picture. This is the setup the system was designed to surface.

A BUY crossover on a stock with a Pulse Score of 30 is far weaker. The crossover happened, but the broader factor picture is not supportive — volume may be thin, RSI may be oversold or extreme, momentum may still be negative. Acting on that crossover without factor alignment is trading the chart pattern in isolation, which is exactly what Pulse is designed to discourage.

Conversely, a high Pulse Score with no BUY crossover — for example, a stock scoring 80 with the 8d EMA still below the 21d — is a stock to watch, not necessarily to buy immediately. The quantitative setup is strong, but the trend direction has not confirmed it yet. Many traders use this configuration as an early-warning list: stocks to have on radar for when the crossover eventually fires.

---

## Backtesting {#backtesting}

The Pulse Backtest page simulates the 8/21 EMA crossover strategy applied mechanically to historical OHLCV data. It shows what would have happened if you had followed every signal the strategy generated over a selected period — without hindsight bias, cherry-picking, or look-ahead contamination.

### Methodology

- Historical daily OHLCV data sourced from Yahoo Finance (`v8/finance/chart` API, `interval=1d`)
- Covers the full selected period (1Y, 2Y, 5Y, or max available history)
- **Entry:** Buy at the closing price on the day the 8d EMA crosses above the 21d EMA
- **Exit:** Sell at the closing price on the day the 8d EMA crosses below the 21d EMA
- **Position sizing:** 100% of available capital per trade (fully invested, long only)
- **One position at a time:** No pyramiding or partial entries; the system is either fully in or fully out

### Signal quality filters applied in the backtest

Two additional filters sit on top of the basic crossover to reduce low-quality entries:

**50-day EMA trend filter.** A BUY signal is only executed when the stock's current price is at or above 97% of its 50-day EMA at the time of the crossover. This filter prevents the strategy from entering "bullish" short-term crossovers that occur inside long-term downtrends — the single most common source of systematic losses in pure crossover systems. When a stock has been declining for months, a brief EMA crossover is far more likely to be a dead-cat bounce than a genuine trend reversal. The 50d EMA acts as a structural trend filter: if price is significantly below it, the crossover is skipped entirely.

**RSI floor filter.** A BUY signal is only executed when the 14-period RSI is at or above 35 at crossover time. This prevents entries into extreme oversold conditions where a crossover may be generated by a brief technical bounce in the middle of a sustained downtrend, rather than a genuine change in trend direction. RSI below 35 at crossover time is a statistical warning sign that the bounce is likely to fail.

SELL signals are unfiltered — when the fast EMA crosses below the slow, the position is always exited, regardless of RSI or trend conditions. Asymmetric filtering (strict on entries, always exit on signal) is intentional: the goal is to enter fewer, higher-quality positions, but to always honour the exit signal when it fires.

### Interpreting backtest results

**Strategy return vs Buy & Hold** is the most important comparison. If the strategy significantly underperforms buy & hold over a long period on a given stock, it typically means the stock was in a sustained multi-year uptrend where constant market exposure was optimal, and the strategy was whipsawing unnecessarily in and out. If the strategy outperforms, it typically means the stock had meaningful drawdown periods that the strategy successfully sidestepped, generating better risk-adjusted outcomes even if raw return was similar.

**Win rate vs Profit factor.** A win rate above 50% feels intuitively good but is not the metric that matters most. A strategy with a 40% win rate can be highly profitable if the average winner is 3× the average loser — the expectancy is positive. Profit factor (total gains divided by total losses) is the cleaner metric: above 1.5 indicates a meaningful edge in the tested period; below 1.0 means losses exceeded gains net.

**Max drawdown** is arguably the most psychologically important metric. It tells you the largest peak-to-trough decline in the equity curve during the test period — the worst consecutive loss sequence you would have experienced had you run the strategy live. Many traders focus on return and ignore drawdown, then abandon a strategy at exactly the worst moment (deep in a drawdown) because they never honestly modelled what they would endure emotionally. A strategy with a 40% max drawdown is one that very few human traders can actually execute without deviating, regardless of what the final return says.

<div class="docs-warn">
No slippage, transaction costs, taxes, or market impact are modelled. The strategy assumes fills at the exact closing price on signal days, which is a simplification — real execution will differ, particularly for less liquid stocks. Results are hypothetical and for educational purposes only. Past performance does not guarantee future results.
</div>

---

## Score Ranges {#score-ranges}

| Score | Label | What it means |
|-------|-------|----------------|
| 86–100 | Very strong signal | Exceptional alignment across all five factors simultaneously. This is a rare configuration. Every quantitative dimension is pointing in the same direction. When this coincides with a fresh BUY crossover, it is the highest-conviction setup the model produces. |
| 71–85 | Strong signal | Multiple factors firing simultaneously with strong readings. A BUY crossover in this range is the primary intended use case of the strategy. The quantitative case for being long is well-supported. |
| 51–70 | Moderate signal | Some factors are aligned, but the picture is incomplete — one or two factors may be weak or scoring near zero. The stock is in a net-positive quantitative condition, but not all dimensions are confirming. Monitor for improvement rather than acting immediately. |
| 31–50 | Below average | Mixed signals. The majority of factors are weak or flat, and the ones that are positive may not be strong enough to overcome the drag from the weaker ones. The stock does not present a clear quantitative edge in the current data. |
| 0–30 | Weak / no signal | Very few factors are contributing positively. The stock is either in a downtrend, showing poor volume conviction, with RSI in an unfavourable zone, or some combination. There is no compelling quantitative case for being long based on current data. |

---

## Data Sources {#data-sources}

All data is sourced from Yahoo Finance's public APIs:

- **Price and OHLCV data:** `v8/finance/chart/{ticker}` — daily bars with open, high, low, close, volume, and Unix timestamps
- **Fundamentals and earnings:** `v10/finance/quoteSummary/{ticker}` — modules: earningsHistory, summaryDetail, assetProfile, financialData, defaultKeyStatistics
- **News:** `v1/finance/search` — most recent 8 headlines for the ticker

Because Yahoo Finance does not permit direct browser requests (CORS restriction), all API calls are routed through a chain of three CORS proxy services in order: corsproxy.io → allorigins.win → codetabs.com. The first available proxy is used; if one times out or errors, the system automatically falls back to the next. This chain provides resilience against individual proxy downtime or rate-limiting.

Data reflects the most recent completed trading day at market close. During market hours, data may reflect the previous close or the current intraday price depending on Yahoo's API response. Pulse is designed as a daily signal tool, not an intraday system — the factors are calibrated on daily closes and are not meaningful at shorter timeframes.

---

## Limitations {#limitations}

**Price data only for Factors 1–4.** Three of the five factors (Momentum, Volume Surge, Trend Consistency) and part of Factor 4 (RSI Quality) are derived entirely from price and volume data. Price data reflects what happened in the market, not why it happened. A stock can score 80+ on Pulse while a fundamental catastrophe is building that has not yet been reflected in price — a quiet distribution phase by insiders, an impending regulatory action, or deteriorating financials that the market has not yet priced. Pulse is not a substitute for fundamental analysis; it is a complement to it.

**Earnings data is quarterly and backward-looking.** Factor 5 uses the most recently reported quarterly EPS result. In the weeks immediately following a strong beat, the factor scores well and the PEAD signal is most active. As the next earnings date approaches months later, the factor score becomes increasingly stale — it no longer reflects current earnings momentum, only historical surprise. There is no mechanism in Pulse to automatically depreciate the earnings factor as time passes since the report date.

**Single-stock, daily timeframe.** Pulse is calibrated for individual US equity analysis on daily price bars. While the calculations will run on non-US tickers returned by Yahoo Finance, the factor calibrations (particularly the scoring multipliers for momentum and volume) are tuned to the typical behaviour of US equity markets. Results for ADRs, international listings, or very low-liquidity stocks should be interpreted with additional caution.

**Yahoo Finance API reliability.** Yahoo Finance's public API is unofficial, not covered by a service level agreement, and has historically experienced periods of outage, rate-limiting, and occasional data quality issues. Pulse includes a three-proxy fallback chain and error handling, but if Yahoo Finance's underlying data is incorrect or delayed, the Pulse Score will reflect that incorrect data without a visible warning. The earnings history data in particular is sometimes incomplete for smaller-cap or less-followed stocks. Always cross-reference with a primary data source before making any financial decision.

**No risk management framework.** Pulse signals when a setup is quantitatively favourable. It does not tell you how much capital to risk per trade, where to place a stop-loss, how to size a position relative to your overall portfolio, or when to scale in or out of a position. Signal quality and position management are entirely separate disciplines, and Pulse only addresses the former. A high Pulse Score with a BUY crossover is a reason to look more carefully at a stock, not a direct instruction to buy a specific number of shares.

**Past patterns do not guarantee future results.** Every factor in Pulse is grounded in documented market behaviour observed over decades and across many market regimes. None of that history guarantees that the same patterns will persist going forward. Market structure changes — algorithmic trading has made many classic patterns more efficient. Macro regimes shift — momentum strategies that worked in a low-rate environment may behave differently as rates and cross-asset correlations change. The factors in Pulse are chosen because they have robust theoretical foundations and long empirical records, not because they are guaranteed to work in every future period.

---

## How the Factors Interact

Understanding Pulse Score fully requires understanding not just what each factor measures in isolation, but how they work together as a system.

**Momentum and Volume Surge are the core confirmation pair.** Momentum tells you price is trending upward. Volume tells you the trend has broad participation and conviction. A stock with strong momentum but weak volume is a warning: the move may not have the institutional backing needed to sustain itself. It may be driven by a small group of buyers rather than broad market interest. Conversely, strong volume with weak momentum (price below SMA) can signal accumulation before a move — potentially interesting as an early watch, but not yet a confirmed Pulse signal.

**Trend Consistency is a momentum quality check.** A stock can be 8% above its 20d SMA while having spent the last three sessions declining from an even higher level. The momentum factor would still score well — it only measures where price is relative to the 20-day average. Trend Consistency would show a deteriorating picture — recent sessions have been closing red. This combination (high momentum score, falling consistency score) is a signal that the stock may be starting to roll over at the factor level before that reversal is visible in the momentum factor. Catching that early is exactly what the multi-factor design is intended to achieve.

**RSI Quality filters overbought entries.** Without RSI Quality, a stock that has already rallied 30% in a month and sits at RSI 85 could still score exceptionally well on momentum, volume, and consistency — all of which are "correct" in isolation. But entering at RSI 85 after a 30% run is a completely different risk/reward proposition from entering at RSI 65 after a 15% run. The former is a bet on the continuation of an already-extended move; the latter is an entry into a confirmed but not exhausted trend. RSI Quality exists specifically to prevent Pulse from producing high scores on stocks that are technically in the right position but operationally dangerous to buy.

**Earnings Surprise provides a fundamental anchor.** A stock scoring highly on all four price-action factors but whose company just missed earnings estimates is a very different animal from one where the business also demonstrated fundamental strength. Factor 5 can only add 20 points — it is a positive contribution, not a dominant force — but it is the one factor that links the quantitative price signal to the underlying business reality. The most reliable Pulse setups historically are those where the business has demonstrated earnings outperformance (positive Factor 5) and the market is responding to it with strong, broad price action (Factors 1–4 all contributing). When business fundamentals and price momentum align, the signal is genuinely multi-dimensional.

The ideal Pulse setup — the configuration that produces the highest expected probability of continued outperformance — is one where all five factors are firing simultaneously, the Pulse Score is above 70, and the EMA crossover confirms a bullish trend direction. This combination is intentionally rare. If dozens of stocks met these criteria every day, the signal would simply be noise. Genuine multi-factor alignment across five independent dimensions happens perhaps for a handful of stocks across the US equity universe on any given day, which is precisely what makes it worth acting on when it does appear.
