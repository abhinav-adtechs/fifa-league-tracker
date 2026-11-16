# Ranking and fixture maths

How the standings, the promotion path and the tournament plan are calculated. Source of truth: [`utils/standings.ts`](../utils/standings.ts), [`components/RankProjection.tsx`](../components/RankProjection.tsx), [`utils/tournaments.ts`](../utils/tournaments.ts) and [`utils/createTournamentPlan.ts`](../utils/createTournamentPlan.ts).

## Contents

- [Base stats](#base-stats)
- [The three standings views](#the-three-standings-views)
- [Why "Normalised"?](#why-normalised)
- [Promotion path](#promotion-path)
- [Fixture counts](#fixture-counts)
- [Round-robin scheduling](#round-robin-scheduling)
- [Knockout brackets](#knockout-brackets)

## Base stats

Stats are rebuilt from the match list on every load (`computePlayersWithStats`), processing matches in chronological order so the form guide is correct. For a player with $W$ wins, $D$ draws and $L$ losses:

$$
P = W + D + L, \qquad \text{Pts} = 3W + D, \qquad GD = GF - GA, \qquad \text{PPG} = \frac{\text{Pts}}{P}
$$

## The three standings views

| View           | Sort key         | Tie-breakers                            |
| -------------- | ---------------- | --------------------------------------- |
| **Normalised** | $N$ (below)      | goal difference per game, then win rate |
| **PPG**        | $\text{Pts} / P$ | win rate, then goal difference          |
| **Table**      | $\text{Pts}$     | goal difference, then goals for         |

The league leader for a view is the top player with at least one game played. Group tables in League + Knockout tournaments show only the classic **Table** view, and knockout qualification always uses it.

## Why "Normalised"?

Points per game rewards a hot start: two wins from two games (3.00 PPG) beats ten wins from fifteen. The normalised score regresses small samples toward zero by adding two phantom games, then adds a small, capped bonus for goal difference per game:

$$
N = \frac{\text{Pts}}{P + 2} \;+\; 0.05 \cdot \operatorname{clamp}\!\left(\frac{GD}{P},\, -2,\, 2\right), \qquad N = 0 \text{ when } P = 0
$$

The goal-difference term is worth at most $\pm 0.1$, enough to separate players on similar points without letting one thrashing dominate.

**Example**

| Player | Record             | Pts | GD  | PPG      | $N$                                                |
| ------ | ------------------ | --- | --- | -------- | -------------------------------------------------- |
| A      | 2 W in 2           | 6   | +4  | **3.00** | $\tfrac{6}{4} + 0.05 \cdot 2 = 1.60$               |
| B      | 10 W 2 D 3 L in 15 | 32  | +12 | 2.13     | $\tfrac{32}{17} + 0.05 \cdot 0.8 \approx$ **1.92** |

PPG ranks A first; the normalised view ranks B first, which is what most players would call fair.

## Promotion path

For each player below first place, the promotion path estimates how many consecutive wins they need to overtake the player directly above them in the current view. It assumes each win is worth 3 points and a goal-difference swing of $g$ per win, with $g = 1$ (narrow wins) and $g = 3$ (dominant wins):

- **Against anyone** — the rival's score is frozen. Find the smallest $k$ with

  $$
  N\big(P + k,\ \text{Pts} + 3k,\ GD + gk\big) > N_{\text{rival}}
  $$

- **Head-to-head** — the player beats the rival directly, so the rival also plays $k$ more games, earns no points and concedes the goal difference:

  $$
  N\big(P + k,\ \text{Pts} + 3k,\ GD + gk\big) > N\big(P_r + k,\ \text{Pts}_r,\ GD_r - gk\big)
  $$

The search stops at 50 wins; beyond that the card shows "50+ wins". As the app puts it, beating the rival directly is the most efficient route because it moves both scores at once.

## Fixture counts

The create dialog previews the number of matches for $n$ players, $m$ meetings per pair, $G$ groups and $q$ knockout qualifiers:

$$
\text{League: } \; m \cdot \frac{n(n-1)}{2}
\qquad
\text{Grouped league: } \; \sum_{i=1}^{G} m \cdot \frac{n_i(n_i - 1)}{2}
\qquad
\text{Knockout: } \; n - 1
$$

Group sizes $n_i$ are as even as possible ($\lfloor n/G \rfloor$, with the remainder spread over the first groups). For League + Knockout, the knockout stage has $q - 1$ matches, where $q$ is at least the number of groups. Brackets with a semi-final round also get a 3rd-place playoff; the preview leaves it out, while the in-tournament progress bar counts it.

**Example:** 8 players, 2 groups, 1 meeting, 4 qualifiers → $2 \times \tfrac{4 \cdot 3}{2} = 12$ group games, then a 3-match bracket plus the 3rd-place playoff.

## Round-robin scheduling

`generateLeagueFixtures` uses the **circle method**. Players sit in two rows; one player stays fixed while the others rotate one seat each round, so every pair meets exactly once per cycle in $n - 1$ rounds (with a phantom "bye" seat when $n$ is odd). Each additional cycle swaps home and away. Fixtures are labelled _Round 1_, _Round 2_, … and are all playable immediately.

## Knockout brackets

`createKnockoutFixtures` pads the qualified players to the next power of two, $2^{\lceil \log_2 n \rceil}$, and pairs adjacent slots in qualification order; empty slots become byes that advance automatically. Rounds are named _Final_, _Semi Final_, _Quarter Final_, or _Round k_ for earlier rounds. Later fixtures reference their two source fixtures, and the losers of the semi-finals feed a _3rd Place Playoff_. Knockout matches cannot end in a draw.

With several groups, qualifiers are ordered group winners first, then runners-up, and so on, before the bracket is built.
