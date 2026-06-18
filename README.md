# Gold Grid Risk Calculator

A static risk calculator for estimating how many gold grid basket levels an account can survive before drawdown becomes dangerous.

## How to Use

Open `index.html` in a browser. No install step, build step, or server is required.

Adjust the settings on the left:

- `Capital`: account balance used for drawdown calculations.
- `Account type`: selects the default gold pip value for Vantage Cent or Vantage Standard.
- `Gold pip value per 1.00 lot`: editable pip value used in loss estimates.
- `Starting lot`: first basket lot size.
- `Lot multiplier`: multiplier applied to each new basket level.
- `Max basket levels`: number of levels to calculate.
- `First step distance`: pip distance from level 1 to level 2.
- `Next step distance`: pip distance between later levels.

## Outputs

The calculator updates automatically as inputs change.

- `Recommended max level`: highest level that stays near the 10% routine risk line.
- `Survives to`: highest level that stays under the 30% emergency survival line.
- `Danger starts`: first level that reaches at least 20% drawdown.
- `Basket Level Table`: per-level lot size, total lots, estimated pips, loss per level, floating loss, drawdown, recovery pips, and risk status.
- `Capital Survival Table`: compares survival levels across common capital sizes at 10%, 20%, and 30% drawdown.
- `Risk Notes`: summarizes full basket loss, lot growth, and pip value assumptions.

## Pip Value Defaults

The account type dropdown sets these defaults:

- Vantage Cent: `$0.01` per pip per `1.00` lot.
- Vantage Standard: `$1.00` per pip per `1.00` lot.

The pip value field remains editable because broker symbols and account specifications can differ.

## Files

- `index.html`: page structure and calculator controls.
- `style.css`: responsive layout and visual styling.
- `script.js`: calculation logic and live rendering.

