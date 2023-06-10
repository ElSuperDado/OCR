let currentMode = 0;
let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d");
let canvasWidth = canvas.width
let canvasHeight = canvas.height
let x = 0;
let y = 0;
let pixelSize = {x:0, y:0};
let pixelsBounds = [];
let pixelsDrawnIdx = [];

const server = "http://127.0.0.1:8000";


function setMode() {
    let div = document.getElementById("jsDiv");
    resetDivContent(div);
    resetDivContent(document.getElementById("errDiv"));
    let label = document.createElement("label");

    if (currentMode == 1) {
        // send input + label to AI trainer
        label.setAttribute("for", "trainingAnswer");
        label.innerHTML = "Which number does correspond to your drawing ?";

        let answerInput = document.createElement("select");
        answerInput.setAttribute("id", "trainingAnswer");
        answerInput.setAttribute("name", "trainingAnswer");
        answerInput.setAttribute("type", "number");
        answerInput.setAttribute("min", "0");
        answerInput.setAttribute("max", "9");
        answerInput.setAttribute("value", "0");
        answerInput.style.width = "40px";
        answerInput.style.marginTop = "7px";

        for (let i = 0; i < 10; i++){
            let option = document.createElement("option");
            option.setAttribute("value", i);
            option.innerHTML = i;

            answerInput.appendChild(option);
        }

        div.appendChild(label);
        div.appendChild(answerInput);
    }
}

function setTrainMode() {
    if (currentMode != 1){
        currentMode = 1;
        setMode();
    }
}

function setAskMode() {
    if (currentMode != 0){
        currentMode = 0;
        setMode();
    }
}

function resetDivContent(div){
    div.innerHTML = "";
}

// https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
function setPosition(event) {
    let pos = canvas.getBoundingClientRect();
    scaleX = canvas.width / pos.width;
    scaleY = canvas.height / pos.height;

    x = (event.clientX - pos.left) * scaleX;
    y = (event.clientY - pos.top) * scaleY;
}

function draw(event) {
    if (event.buttons !== 1) return;

    let idx = getPixelIndexFromMousePos();
    if (idx == -1) return;

    if (!pixelsDrawnIdx.includes(idx)){
        pixelsDrawnIdx.push(idx);
    }

    drawPixel(pixelsBounds[idx]);
    setPosition(event);
}

function clearCanvas(){
    context.clearRect(0, 0, canvas.width, canvas.height);
    pixelsDrawnIdx = [];
    resetDivContent(document.getElementById("errDiv"));
}

function setupPixelBounds() {
    for (x = 0; x < canvas.width; x+=pixelSize.x) {
        for (y = 0; y < canvas.height; y+=pixelSize.y) {
            pixelsBounds.push([[y, x], [y+pixelSize.y, x+pixelSize.x]]);
        }
    }
}

function getPixelIndexFromMousePos() {
    for (i = 0; i < pixelsBounds.length; i++) {
        let startX = pixelsBounds[i][0][0];
        let startY = pixelsBounds[i][0][1];
        let endX = pixelsBounds[i][1][0];
        let endY = pixelsBounds[i][1][1];

        if (startX > x || endX < x) continue;
        if (startY > y || endY < y) continue;
        return i;
    }

    return -1;
}

// https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/readyState
// https://stackoverflow.com/questions/24468459/sending-a-json-to-server-and-retrieving-a-json-in-return-without-jquery
function sendTrainingValues() {
    let xhr = new XMLHttpRequest();
    let userInput = document.getElementById("trainingAnswer").value;

    xhr.open("POST", server + "/trainai/");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            console.log(JSON.parse(xhr.responseText));
        }
    };

    let data = JSON.stringify({"dataStream":pixelsDrawnIdx, "userInput":userInput});
    xhr.send(data);
}

function sendQuestionValues() {
    let xhr = new XMLHttpRequest();

    xhr.open("POST", server + "/askai/");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let predictions = JSON.parse(JSON.parse(xhr.responseText));
            displayPrediction(predictions.data);
        }
    };

    let data = JSON.stringify({"dataStream":pixelsDrawnIdx});
    xhr.send(data);
}

function displayError(message) {
    let errDiv = document.getElementById("errDiv");
    errDiv.style.fontWeight = "bolder";
    errDiv.innerHTML = "Error: " + message;
}

function checkInputs() {
    if (pixelsDrawnIdx.length < 1) {
        displayError("You must draw something before submitting !");
        return false;
    }

    if (currentMode == 1) {
        let answer = document.getElementById("trainingAnswer").value;

        if (answer == null || answer == "") {
            displayError("User answer missing !");
            return false;
        }
    }

    sendValues();
    return true;
}

function displayPrediction(predictions) {
    let i = 0;
    let div = document.getElementById("errDiv");
    let table = document.createElement("table");

    let tableHeader = document.createElement("tr");
    let numbersHeader = document.createElement("th");
    let percentageHeader = document.createElement("th");
    numbersHeader.innerHTML = "Number";
    percentageHeader.innerHTML = "Prediction";

    tableHeader.appendChild(numbersHeader);
    tableHeader.appendChild(percentageHeader);
    table.appendChild(tableHeader);

    predictions.forEach(value => {
        let row = document.createElement("tr");
        let colPrediction = document.createElement("td");
        let percentPrediction = document.createElement("td");
        let errBar = document.createElement("div");
        let percentBar = document.createElement("div");
        let percentVal = 0;

        errBar.setAttribute("id", "errBar");
        percentBar.setAttribute("id", "percentBar");
        percentVal = (value*100).toFixed(2);
        percentPrediction.innerHTML = percentVal + " %";
        let barSize = Math.round(350 * value); if (barSize<15) { barSize=15; }
        percentBar.innerHTML = i.toString(); i += 1;
        percentBar.style.width = barSize.toString() + "px";

        errBar.appendChild(percentBar);
        colPrediction.appendChild(errBar);
        row.appendChild(colPrediction);
        row.appendChild(percentPrediction);
        table.appendChild(row);
    });


    div.appendChild(table);
}

function sendValues() {
    switch (currentMode) {
        case 0:
            sendQuestionValues();
            break;
        case 1: 
            sendTrainingValues();
            break;
    }

    resetDivContent(document.getElementById("errDiv"));
}

function drawPixel(bounds) {
    let startX = bounds[0][0];
    let startY = bounds[0][1];
    context.fillStype = "black";
    context.fillRect(startX, startY, 20, 20);
}

function initializeCanvas() {
    pixelSize.x = canvas.width / 20;
    pixelSize.y = canvas.height / 20;
    setupPixelBounds();

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mousedown', setPosition);
    canvas.addEventListener('mouseenter', setPosition);
    setMode();
}

// main call
initializeCanvas();
