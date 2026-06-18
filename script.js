const controls = {
  capital: document.getElementById("capital"),
  accountType: document.getElementById("accountType"),
  pipValue: document.getElementById("pipValue"),
  startLot: document.getElementById("startLot"),
  multiplier: document.getElementById("multiplier"),
  maxLevels: document.getElementById("maxLevels"),
  firstStep: document.getElementById("firstStep"),
  nextStep: document.getElementById("nextStep"),
};

const outputs = {
  recommendedLevel: document.getElementById("recommendedLevel"),
  recommendationText: document.getElementById("recommendationText"),
  surviveLevel: document.getElementById("surviveLevel"),
  dangerLevel: document.getElementById("dangerLevel"),
  adviceBox: document.getElementById("adviceBox"),
  levelTable: document.getElementById("levelTable"),
  capitalTable: document.getElementById("capitalTable"),
  lotPreview: document.getElementById("lotPreview"),
  notes: document.getElementById("notes"),
};

const accountTypeDefaults = {
  "vantage-cent": 0.01,
  "vantage-standard": 1,
};

function numberValue(input, fallback) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function money(value) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value >= 100 ? 0 : 2,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });
}

function percent(value) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function lossMoney(value) {
  return value === 0 ? money(0) : money(-Math.abs(value));
}

function levelLabel(level) {
  return level > 0 ? `Level ${level}` : "None";
}

function getSettings() {
  return {
    capital: Math.max(1, numberValue(controls.capital, 500)),
    pipValue: Math.max(0.0001, numberValue(controls.pipValue, 0.01)),
    startLot: Math.max(0.01, numberValue(controls.startLot, 0.1)),
    multiplier: Math.max(1, numberValue(controls.multiplier, 1.55)),
    maxLevels: Math.min(30, Math.max(1, Math.round(numberValue(controls.maxLevels, 15)))),
    firstStep: Math.max(1, numberValue(controls.firstStep, 110)),
    nextStep: Math.max(1, numberValue(controls.nextStep, 130)),
  };
}

function buildLevels(settings) {
  const levels = [];
  let totalLots = 0;
  let previousRawLoss = 0;

  for (let level = 1; level <= settings.maxLevels; level += 1) {
    const lot = Number((settings.startLot * settings.multiplier ** (level - 1)).toFixed(2));
    totalLots += lot;

    let loss = 0;
    let weightedEntryPips = 0;

    for (let openLevel = 1; openLevel <= level; openLevel += 1) {
      const openLot = Number((settings.startLot * settings.multiplier ** (openLevel - 1)).toFixed(2));
      const adversePips =
        openLevel === 1
          ? (level > 1 ? settings.firstStep + Math.max(0, level - 2) * settings.nextStep : 0)
          : (level - openLevel) * settings.nextStep;

      loss += openLot * adversePips * settings.pipValue;
      weightedEntryPips += openLot * adversePips;
    }

    const levelLoss = loss - previousRawLoss;
    previousRawLoss = loss;

    const drawdown = (loss / settings.capital) * 100;
    const recoveryPips = totalLots > 0 ? weightedEntryPips / totalLots : 0;

    levels.push({
      level,
      lot,
      totalLots: Number(totalLots.toFixed(2)),
      adversePips: level === 1 ? 0 : settings.firstStep + (level - 2) * settings.nextStep,
      levelLoss,
      rawLoss: loss,
      loss,
      drawdown,
      recoveryPips,
      status: riskStatus(drawdown),
    });
  }

  return levels;
}

function riskStatus(drawdown) {
  if (drawdown < 10) return { label: "Safe zone", className: "safe" };
  if (drawdown < 20) return { label: "Monitor", className: "watch" };
  if (drawdown < 35) return { label: "High risk", className: "hot" };
  if (drawdown < 50) return { label: "Danger", className: "danger" };
  return { label: "Critical", className: "critical" };
}

function highestLevelUnder(levels, limitLoss) {
  const safe = levels.filter((level) => level.loss <= limitLoss);
  return safe.length ? safe[safe.length - 1].level : 0;
}

function firstLevelAt(levels, predicate) {
  const found = levels.find(predicate);
  return found ? found.level : 0;
}

function renderSummary(settings, levels) {
  const maxRecommendedLoss = settings.capital * 0.1;
  const maxSurvivalLoss = settings.capital * 0.3;
  const recommended = highestLevelUnder(levels, maxRecommendedLoss);
  const survives = highestLevelUnder(levels, maxSurvivalLoss);
  const danger = firstLevelAt(levels, (level) => level.drawdown >= 20);

  outputs.recommendedLevel.textContent = levelLabel(recommended);
  outputs.surviveLevel.textContent = levelLabel(survives);
  outputs.dangerLevel.textContent = danger ? levelLabel(danger) : "Beyond table";

  const nextRiskLevel = levels[recommended] || levels[levels.length - 1];
  outputs.recommendationText.textContent =
    recommended > 0
      ? `Keep routine basket risk near ${levelLabel(recommended)} or lower. ${nextRiskLevel ? `${levelLabel(nextRiskLevel.level)} is where risk begins to expand.` : ""}`
      : "Your first added level already exceeds the 10% risk line.";

  outputs.adviceBox.innerHTML = [
    `<strong>${money(settings.capital)}</strong> capital with <strong>${settings.startLot.toFixed(2)}</strong> starting lot can reasonably target <strong>${levelLabel(recommended)}</strong> under a 10% risk rule.`,
    `A 30% emergency survival line reaches <strong>${levelLabel(survives)}</strong>. Treat anything beyond that as account-defense territory, not normal trading.`,
  ].join(" ");
}

function renderLevelTable(settings, levels) {
  outputs.levelTable.innerHTML = levels
    .map(
      (level) => `
        <tr>
          <td>${level.level}</td>
          <td>${level.lot.toFixed(2)}</td>
          <td>${level.totalLots.toFixed(2)}</td>
          <td>${level.adversePips.toFixed(0)}</td>
          <td>${lossMoney(level.levelLoss)}</td>
          <td>${lossMoney(level.rawLoss)}</td>
          <td>${percent(level.drawdown)}</td>
          <td>${level.recoveryPips.toFixed(0)} pips</td>
          <td><span class="badge ${level.status.className}">${level.status.label}</span></td>
        </tr>
      `,
    )
    .join("");

  outputs.lotPreview.textContent = levels
    .slice(0, 10)
    .map((level) => level.lot.toFixed(2))
    .join(" -> ");
}

function renderCapitalTable(settings) {
  const capitalSet = [200, 500, 1000, 2000, 3000, 5000, 10000];
  if (!capitalSet.includes(Math.round(settings.capital))) {
    capitalSet.splice(2, 0, Math.round(settings.capital));
  }

  outputs.capitalTable.innerHTML = capitalSet
    .map((capital) => {
      const levels = buildLevels({ ...settings, capital });
      return `
        <tr>
          <td>${money(capital)}</td>
          <td>${levelLabel(highestLevelUnder(levels, capital * 0.1))}</td>
          <td>${levelLabel(highestLevelUnder(levels, capital * 0.2))}</td>
          <td>${levelLabel(highestLevelUnder(levels, capital * 0.3))}</td>
        </tr>
      `;
    })
    .join("");
}

function renderNotes(settings, levels) {
  const maxLevel = levels[levels.length - 1];
  const fullBasketDd = maxLevel ? maxLevel.drawdown : 0;

  outputs.notes.innerHTML = [
    `<div class="note"><strong>Full basket warning:</strong> level ${settings.maxLevels} would require about ${lossMoney(maxLevel.loss)} floating-loss capacity, equal to ${percent(fullBasketDd)} of your entered capital before detailed margin rules.</div>`,
    `<div class="note"><strong>Lot growth:</strong> multiplier ${settings.multiplier.toFixed(2)} turns ${settings.startLot.toFixed(2)} lot into ${maxLevel.lot.toFixed(2)} lot by level ${settings.maxLevels}. Lowering starting lot is usually the cleanest risk reduction.</div>`,
    `<div class="note"><strong>Gold pip value:</strong> Vantage Cent defaults to $0.01 per pip per 1.00 lot, and Vantage Standard defaults to $1.00. Edit the pip value if your MT4/MT5 symbol specification shows a different tick value.</div>`,
  ].join("");
}

function render() {
  const settings = getSettings();
  const levels = buildLevels(settings);

  renderSummary(settings, levels);
  renderLevelTable(settings, levels);
  renderCapitalTable(settings);
  renderNotes(settings, levels);
}

controls.accountType.addEventListener("change", () => {
  controls.pipValue.value = accountTypeDefaults[controls.accountType.value];
  render();
});

Object.values(controls).forEach((control) => {
  if (control === controls.accountType) return;
  control.addEventListener("input", render);
});

render();
