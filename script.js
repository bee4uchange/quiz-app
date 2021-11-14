const screen1 = document.querySelector("#introduction");
const screen2 = document.querySelector("#attempt-quiz");
const screen3 = document.querySelector('#review-quiz');
const modal = document.querySelector('#modal');
const buttonYes = document.querySelector('#buttonYes');
const buttonNo = document.querySelector('#buttonNo');
const startButton = document.querySelector('#startButton');
const api = 'https://wpr-quiz-api.herokuapp.com/attempts';

//Move to the top of page when reloading
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
}

//Move to screen 2 when clicking START button
function toScreen2() {
    let idlist = [];
    fetch(api, { method: "POST" })
        .then(function (response) {
            return response.json();
        })
        .then(function (jsonData) {
            //Render list of questions
            let id = jsonData._id;
            const questionData = jsonData.questions;
            const questionList = document.querySelector('.question-list');
            questionData.forEach((e) => {
                const container = document.createElement('div');
                container.classList.add('question');
                container.id = e._id;
                idlist.push(e._id);
                questionList.appendChild(container);

                const title = document.createElement('h2');
                title.textContent = "Question " + (questionData.indexOf(e) + 1) + " of 10";
                const description = document.createElement('p');
                description.textContent = e.text;

                const option = document.createElement('div');
                option.classList.add('option');
                const contain = document.querySelectorAll('.question');
                for (const element of contain) {
                    element.appendChild(title);
                    element.appendChild(description);
                    element.appendChild(option);
                }

                //Render options for question
                for (const element of e.answers) {
                    const label = document.createElement('label');

                    let id = (questionData.indexOf(e) + 1) + '_' + (e.answers.indexOf(element) + 1);
                    label.htmlFor = 'op' + id;
                    option.appendChild(label);

                    const ans = document.createElement('span')
                    ans.textContent = element;
                    const input = document.createElement('input');
                    input.type = 'radio';
                    input.name = 'op' + (questionData.indexOf(e) + 1);
                    input.id = 'op' + id;
                    input.value = e.answers.indexOf(element);
                    input.classList.add('radio');
                    label.appendChild(input);
                    label.appendChild(ans);

                    label.addEventListener('click', clickSelected);
                };
            });

            //Render submit box
            const submitBox = document.createElement('div');
            submitBox.classList.add('box');
            submitBox.id = 'submit-box';
            const submitButton = document.createElement('div');
            submitButton.classList.add('btn', 'btn-green');
            submitButton.textContent = 'Submit your answers >';
            submitButton.addEventListener('click', openModal);
            submitBox.appendChild(submitButton);
            questionList.appendChild(submitBox);

            //Hide screen 1, show screen 2 and move to
            screen1.classList.toggle('hidden');
            screen2.classList.toggle('hidden');
            screen2.scrollIntoView();

            //Open confirm modal before submiting
            function openModal() {
                modal.classList.toggle('hidden');
            }

            const inputList = [];
            const questionNumber = document.querySelectorAll('.question');
            const inputNumber = document.querySelectorAll('input');

            //Click to change option background color
            function clickSelected(event) {
                const label = event.currentTarget;
                const container = label.parentNode;
                const option = container.querySelectorAll('input');
                for (let i = 0; i < option.length; i++) {
                    if (option[i].checked == true) {
                        option[i].parentNode.classList.toggle('selected');
                    }
                }
            }

            //Add review tags
            function addTags(label, text) {
                const tagContainer = document.createElement('div');
                tagContainer.classList.add('review_tag');
                tagContainer.textContent = text;
                label.appendChild(tagContainer);
            }

            // Click YES to return score
            function confirmed() {
                //Check selected input
                for (let i = 0; i < questionNumber.length; i++) {
                    const label = questionNumber[i].querySelector('.selected');
                    if (label) {
                        const input = label.querySelector('input');
                        inputList.push(input.value);
                    } else {
                        inputList.push('-1');
                    }
                }

                let submitData = {};
                for (let i = 0; i < idlist.length; i++) {
                    submitData[idlist[i]] = parseInt(inputList[i]);
                }

                //Object for body fetch API
                let answer = {};
                answer['answers'] = submitData;

                //Submit selected answer of user to API and get score, review and correct answers
                fetch(`https://wpr-quiz-api.herokuapp.com/attempts/${id}/submit`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(answer)
                })
                    .then(function (response) {
                        return response.json();
                    })
                    .then(function (jsonData) {
                        const correctList = [];
                        const correctAnswers = jsonData.correctAnswers;
                        const score = jsonData.score;
                        const scoreText = jsonData.scoreText;

                        //Get correct answer from object to array
                        for (const answer in correctAnswers) {
                            correctList.push(correctAnswers[answer]);
                        }

                        //Disable radio input
                        for (let i = 0; i < inputNumber.length; i++) {
                            inputNumber[i].disabled = true;
                            inputNumber[i].parentNode.classList.add('disable');
                        }

                        //Count correct answers and return review tag
                        const total = correctList.length;
                        for (let i = 0; i < correctList.length; i++) {
                            const label = questionNumber[i].querySelector('.selected');
                            const labelList = questionNumber[i].querySelectorAll('label');
                            if (label) {
                                label.style.paddingRight = '160px';
                                if (inputList[i] == correctList[i]) {
                                    label.classList.add('correct_right');
                                    addTags(label, 'Correct answer');
                                } else {
                                    label.classList.add('wrong');
                                    addTags(label, 'Your answer')
                                    const unselectedLabel = labelList[correctList[i]];
                                    unselectedLabel.style.paddingRight = '160px';
                                    unselectedLabel.classList.add('correct_wrong');
                                    addTags(unselectedLabel, 'Correct answer')
                                }
                            } else {
                                const labelList = questionNumber[i].querySelectorAll('label');
                                const unselectedLabel = labelList[correctList[i]];
                                unselectedLabel.style.paddingRight = '160px';
                                unselectedLabel.classList.add('correct_wrong');
                                addTags(unselectedLabel, 'Correct answer')
                            }
                        }

                        //Hide modal
                        modal.classList.add('hidden');
                        //Hide submit box
                        const submit = document.querySelector('#submit-box');
                        submit.classList.add('hidden');

                        //Call function to create review box
                        returnReview(screen3, score, total, scoreText);
                        screen3.classList.remove('hidden');
                    })
            }

            //Click NO to close modal
            function declined() {
                modal.classList.toggle('hidden');
            }

            //Behavior of modal
            buttonYes.addEventListener('click', confirmed);
            buttonNo.addEventListener('click', declined);

            //Render review box
            function returnReview(container, sc, total, scText) {
                const box = document.createElement('div');
                box.classList.add('box');
                const title = document.createElement('h2');
                title.textContent = 'Result';
                const score = document.createElement('p');
                score.textContent = sc + '/' + total;
                const scorePercent = document.createElement('p');
                const percent = document.createElement('strong');
                percent.textContent = ((sc / total) * 100) + '%';
                scorePercent.appendChild(percent);
                const quote = document.createElement('p');
                quote.textContent = scText;
                const button = document.createElement('div');
                button.classList.add('btn');
                button.id = 'tryagain';
                button.addEventListener('click', tryAgain);
                button.textContent = 'Try again';

                container.appendChild(box);
                box.appendChild(title);
                box.appendChild(score);
                box.appendChild(scorePercent);
                box.appendChild(quote);
                box.appendChild(button);
            }

            //Click try again and reload
            /**
             * 
             * @param {MouseEvent} event 
             */
            function tryAgain() {
                location.reload();
            }
        });
}

//Click start button to start
startButton.addEventListener('click', toScreen2);





