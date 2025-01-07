const PROBLEM_MAX_INTEGER_LIMIT = 100;

let TIME_REMAINING = 0;
let CURRENT_SCORE = 0;

const DOM = {
  TimeRemaining: document.getElementById("time-remaining"),
  VarLeft: document.getElementById("var-left"),
  VarOper: document.getElementById("var-oper"),
  VarRight: document.getElementById("var-right"),
  KeyLeft: document.getElementById("key-left"),
  KeyTop: document.getElementById("key-top"),
  KeyBottom: document.getElementById("key-bottom"),
  KeyRight: document.getElementById("key-right"),
  CurrentScore: document.getElementById("current-score"),
};

document.addEventListener("DOMContentLoaded", async () => {
  showStart();
});

async function showStart() {
  const alert = document.getElementById("alert");
  const alertOverlay = document.getElementById("alert-overlay");
  alert.innerHTML = `You can use arrow keys or select option using mouse.<br/>Click to start.`;
  alertOverlay.style.display = "flex";
  const start = async () => {
    alertOverlay.style.display = "none";
    await init();
    startTimer();
  };
  alertOverlay.onclick = () => start();
  alert.onclick = () => start();
}

async function init() {
  const problem = await loadProblem();
  await loadOptions(problem);
  await addMousepressListener();
  await addKeypressListener();
}

async function loadProblem() {
  const operators = ["+", "-"];
  let operand_left = Math.ceil(Math.random() * PROBLEM_MAX_INTEGER_LIMIT);
  let operand_right = Math.ceil(Math.random() * operand_left);
  const operator = operators[Math.floor(Math.random() * operators.length)];
  DOM.VarLeft.innerHTML = operand_left;
  DOM.VarRight.innerHTML = operand_right;
  DOM.VarOper.innerHTML = operator;
  return [operand_left, operator, operand_right];
}

async function loadOptions(problem) {
  const solution = await findSolution(problem);
  const solutions = await findAdditionalSolutions(solution);
  const [s1, s2, s3, s4] = await randomize(solutions);
  DOM.KeyLeft.innerHTML = s1;
  DOM.KeyTop.innerHTML = s2;
  DOM.KeyBottom.innerHTML = s3;
  DOM.KeyRight.innerHTML = s4;
}

async function randomize(items) {
  const randomItems = [];
  let dummyArr = items;
  while (dummyArr.length > 0) {
    const randomIndex = Math.floor(Math.random() * dummyArr.length);
    randomItems.push(dummyArr[randomIndex]);
    delete dummyArr[randomIndex];
    dummyArr = dummyArr.filter((v) => v);
  }
  return randomItems;
}

async function findAdditionalSolutions(solution) {
  let moreSolutions = [solution];
  const MAX = PROBLEM_MAX_INTEGER_LIMIT;
  while (moreSolutions.length < 4) {
    const getRandomSolution = () => Math.ceil(Math.random() * MAX);
    const randomValue = getRandomSolution();
    if (typeof randomValue === "number" && !moreSolutions.includes(randomValue)) {
      moreSolutions.push(randomValue);
    }
  }
  return moreSolutions;
}

async function findSolution(problem) {
  const [left, op, right] = problem;
  if (op === "+") return left + right;
  if (op === "-") return left - right;
}

async function addKeypressListener() {
  document.onkeydown = async (kev) => {
    const key = kev.key;
    const arrowKeys = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"];
    const letterKeys = ["a", "w", "s", "d"];
    if (![...arrowKeys, ...letterKeys].includes(key)) return false;
    let [val, domKey] = [null, null];
    if (["ArrowLeft", "a"].includes(key)) {
      val = DOM.KeyLeft.innerHTML;
      domKey = DOM.KeyLeft;
    }
    if (["ArrowUp", "w"].includes(key)) {
      val = DOM.KeyTop.innerHTML;
      domKey = DOM.KeyTop;
    }
    if (["ArrowDown", "s"].includes(key)) {
      val = DOM.KeyBottom.innerHTML;
      domKey = DOM.KeyBottom;
    }
    if (["ArrowRight", "d"].includes(key)) {
      val = DOM.KeyRight.innerHTML;
      domKey = DOM.KeyRight;
    }
    domKey.classList.add("selected");
    checkAndProceed(val, domKey);
  };
}

async function addMousepressListener() {
  DOM.KeyLeft.onclick = () => checkAndProceed(DOM.KeyLeft.innerHTML, DOM.KeyLeft);
  DOM.KeyTop.onclick = () => checkAndProceed(DOM.KeyTop.innerHTML, DOM.KeyTop);
  DOM.KeyBottom.onclick = () => checkAndProceed(DOM.KeyBottom.innerHTML, DOM.KeyBottom);
  DOM.KeyRight.onclick = () => checkAndProceed(DOM.KeyRight.innerHTML, DOM.KeyRight);
}

async function checkAndProceed(val, domKey) {
  const [_, solution] = await findCurrentProblemAndSolution();
  if (parseInt(TIME_REMAINING) > 0) {
    if (solution === parseInt(val)) {
      domKey.classList.add("correct");
      const remaining = TIME_REMAINING;
      CURRENT_SCORE += remaining;
      DOM.CurrentScore.innerHTML = CURRENT_SCORE;
      TIME_REMAINING = 10;
    } else {
      domKey.classList.add("wrong");
      const remaining = TIME_REMAINING;
      CURRENT_SCORE -= remaining;
      DOM.CurrentScore.innerHTML = CURRENT_SCORE;
    }
    let tmr1 = setTimeout(async () => {
      clearTimeout(tmr1);
      domKey.classList.remove("selected");
      domKey.classList.remove("correct");
      domKey.classList.remove("wrong");
      const problem = await loadProblem();
      await loadOptions(problem);
    }, 500);
  } else {
    end();
  }
}

async function findCurrentProblemAndSolution() {
  const problem = [
    parseInt(DOM.VarLeft.innerHTML),
    DOM.VarOper.innerHTML,
    parseInt(DOM.VarRight.innerHTML),
  ];
  const solution = await findSolution(problem);
  return [problem, solution];
}

function startTimer() {
  if (!TIME_REMAINING) {
    TIME_REMAINING += 30;
    timer();
  }
}

function timer() {
  let tmr1 = setTimeout(() => {
    clearTimeout(tmr1);
    if (TIME_REMAINING) {
      TIME_REMAINING -= 1;
      DOM.TimeRemaining.innerHTML = `${TIME_REMAINING + 1}`;
    } else {
      TIME_REMAINING -= 1;
      DOM.TimeRemaining.innerHTML = `TIME OUT`;
      end();
    }
    if (TIME_REMAINING >= 0) timer();
  }, 1000);
}
async function end() {
  const alertOverlay = document.getElementById("alert-overlay");
  alertOverlay.style.display = "flex";
  alertOverlay.onclick = () => location.reload;
  const alert = document.getElementById("alert");
  alert.onclick = () => location.reload();
  alert.innerHTML = `TIME OVER<br/><br/><span class="result">${CURRENT_SCORE}</span><br/><br/>Click to reload to play again`;
}
