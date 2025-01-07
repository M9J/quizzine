import CONFIG from "./config.quizzine.js";

const body = document.body;
const questionElem = document.getElementById("question");
const optionsElem = document.getElementById("options");
const questionNumberElem = document.getElementById("question-number");
const submitButton = document.getElementById("submit");
const nextButton = document.getElementById("next");
const prevButton = document.getElementById("prev");

let currentQuestion = null;

const qnaSet1 = await fetchQuestionSets();
const qnaSet = await randomize(qnaSet1);
const isQuestionShown = await showQuestion(0);
if (isQuestionShown) {
  showNavigationButtons();
  submitButton.onclick = () => onSubmitClick();
  nextButton.onclick = () => showNextQuestion();
  prevButton.onclick = () => showPreviousQuestion();
  body.onkeydown = (kev) => handleCustomKeypress(kev);
}

async function showNavigationButtons() {
  prevButton.style.display = "flex";
  nextButton.style.display = "flex";
}

async function handleCustomKeypress(kev) {
  if (kev.key === "ArrowLeft") showPreviousQuestion();
  else if (kev.key === "ArrowRight") showNextQuestion();
  else if (kev.key === "ArrowUp") choosePreviousOption();
  else if (kev.key === "ArrowDown") chooseNextOption();
}

async function chooseNextOption() {
  chooseOption();
}

async function choosePreviousOption() {
  const IS_PREV = true;
  chooseOption(IS_PREV);
}

async function chooseOption(isPrev = false) {
  const options = document.getElementsByClassName("option");
  const q = qnaSet[currentQuestion];
  let currentlySelectedOptionIndex = q.selectedOptionIndex;
  if (currentlySelectedOptionIndex === null) {
    if (isPrev) {
      options[options.length - 1].click();
      q.selectedOptionindex = options.length - 1;
    } else {
      options[0].click();
      q.selectedOptionIndex = 0;
    }
  } else {
    const isPossible = isPrev
      ? currentlySelectedOptionIndex - 1 > -1
      : currentlySelectedOptionIndex + 1 < options.length;
    if (isPossible) {
      if (isPrev) {
        options[currentlySelectedOptionIndex - 1].click();
        q.selectedOptionIndex = currentlySelectedOptionIndex - 1;
      } else {
        options[currentlySelectedOptionIndex + 1].click();
        q.selectedOptionIndex = currentlySelectedOptionIndex + 1;
      }
    } else {
      if (isPrev) {
        options[options.length - 1].click();
        q.selectedOptionIndex = options.length - 1;
      } else {
        options[0].click();
        q.selectedOptionIndex = 0;
      }
    }
  }
}

async function showPreviousQuestion() {
  if (currentQuestion - 1 < 0) currentQuestion = qnaSet.length;
  if (currentQuestion) showQuestion(currentQuestion - 1);
}

async function showNextQuestion() {
  if (currentQuestion + 1 > qnaSet.length - 1) currentQuestion = -1;
  if (currentQuestion + 1 < qnaSet.length) showQuestion(currentQuestion + 1);
}

async function showQuestion(qnum) {
  const question = qnaSet[qnum];
  if (question) {
    currentQuestion = qnum;
    questionNumberElem.innerHTML = `${currentQuestion + 1} / ${qnaSet.length}`;
    questionElem.innerHTML = `${question.q}`;
    optionsElem.innerHTML = "";
    for (const o of question.o) {
      const option = document.createElement("input");
      const label = document.createElement("label");
      const text = document.createElement("span");
      const customRadioMark = document.createElement("span");
      const answers = question.a;
      const isArr = Array.isArray(answers) ? answers.length > 0 : false;
      if (isArr) {
        option.type = "checkbox";
        label.classList.add("custom-checkmark");
        customRadioMark.classList.add("check-mark");
      } else {
        option.type = "radio";
        label.classList.add("custom-radio");
        customRadioMark.classList.add("radio-mark");
      }
      option.classList.add("option");
      option.name = "q" + qnum;
      option.value = o;
      option.id = o;
      option.tabIndex = 0;
      option.checked = (() => {
        let isChecked = false;
        if (isArray(question.a)) {
          if (isArray(question.selected)) {
            isChecked = question.selected.includes(o);
          }
        } else {
          isChecked = question.selected === o;
        }
        return isChecked;
      })();
      option.onclick = () => onOptionClick(question, o);
      text.innerHTML = o;
      text.classList.add("option-text");
      label.setAttribute("for", o);
      label.classList.add("option-label");
      label.appendChild(option);
      label.appendChild(customRadioMark);
      label.appendChild(text);
      optionsElem.appendChild(label);
    }
    return true;
  } else {
    questionElem.innerHTML = `Question not found! Please check the question number given.`;
    return false;
  }
}

function isArray(o) {
  let isArr = false;
  if (o) {
    isArr = Array.isArray(o) ? o.length > 0 : false;
  }
  return isArr;
}

function onOptionClick(question, o) {
  const isArr = isArray(question.a) ? question.a.length > 0 : false;
  if (isArr) {
    if (!question.selected) question.selected = [];
    if (question.selected.includes(o)) {
      question.selected = question.selected.filter((v) => v != o);
    } else question.selected.push(o);
  } else {
    question.selected = o;
  }
  checkForCompleteness();
}

async function checkForCompleteness() {
  let isComplete = true;
  for (let q of qnaSet) {
    if (!q.selected) {
      isComplete = false;
      break;
    }
  }
  if (isComplete) {
    submitButton.style.display = "flex";
  }
  return isComplete;
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

async function fetchQuestionSets() {
  const qnaSet = [];
  if (CONFIG) {
    const questionSetJSONPaths = CONFIG.questionSetJSONPaths || [];
    if (questionSetJSONPaths.length > 0) {
      for (let questionSetJSONPath of questionSetJSONPaths) {
        try {
          const file = await fetch(questionSetJSONPath);
          if (file) {
            const jsonContent = await file.json();
            const randomized = await randomize(jsonContent);
            if (randomized) qnaSet.push(...randomized);
          }
        } catch (e) {
          console.error(questionSetJSONPath + ": " + e);
        }
      }
    }
  }
  return qnaSet;
}

async function onSubmitClick() {
  const correctAnswers = [];
  for (const q of qnaSet) {
    if (isArray(q.a)) {
      let isMultipleCorrect = true;
      if (isArray(q.a) && isArray(q.selected)) {
        for (const i of q.a) {
          const opt = q.o[i];
          const sel = q.selected[i];
          if (!sel === opt) {
            isMultipleCorrect = false;
            break;
          }
        }
      }
      if (isMultipleCorrect) correctAnswers.push(q);
    } else {
      if (q.selected === q.o[q.a]) correctAnswers.push(q);
    }
  }
  const perc = ((correctAnswers.length / qnaSet.length) * 100).toFixed(2);
  const message = `Correct: ${correctAnswers.length}, Total: ${qnaSet.length}<br/><span class="result">${perc}%</span>`;
  const alertOverlay = document.getElementById("alert-overlay");
  const alert = document.getElementById("alert");
  alert.innerHTML = message;
  await resetUserKeyboardActions();
  alertOverlay.style.display = "flex";
  alertOverlay.onclick = () => location.reload();
}

async function resetUserKeyboardActions() {
  body.onkeydown = () => {};
  submitButton.onclick = () => {};
  nextButton.onclick = () => {};
  prevButton.onclick = () => {};
}
