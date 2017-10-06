var touchDevice = 0 < window.navigator.userAgent.indexOf("Mobile") || 0 < window.navigator.userAgent.indexOf("Android"),
    DOWN_EVENT, UP_EVENT, TOUCH_VERB;
touchDevice ? (DOWN_EVENT = "touchstart", UP_EVENT = "touchend", TOUCH_VERB = "Touch") : (DOWN_EVENT = "mousedown", UP_EVENT = "mouseup", TOUCH_VERB = "Click");
var smallDevice, SERVER_URL = "MemoryServer.php",
    sendVars = {},
    timer, tDisplay, random, score, priorScore, ctx, gridOffset, tileSet, numRows, numCols, cellSize = 64,
    allCells, totalCells = 0,
    levelDefn, currLevel, config, puzzleId, gameInProgress = !1,
    firstTile = null,
    secondTile, turns, errorCnt, pairsLeft, totPairs, matchShownCnt, inChallenge, alreadyPlayed, sound, mute = !1,
    userId, isStorage, logStats = [],
    CELL_BACKCOLOR = "ivory",
    CELL_BORDERCOLOR = "lightsteelblue",
    STAGE_BACKCOLOR = "#1D3749";
$(document).ready(function() {
    sound = new Howl({
        urls: ["memory.mp3"],
        sprite: {
            tink: [135, 280],
            slide: [768, 150],
            fail: [1427, 1350],
            tick: [4600, 4500]
        }
    });
    if (isStorage = LocalStorageExists()) {
        if (null == localStorage.getItem("pairs_lastLevel") || "" == localStorage.getItem("pairs_lastLevel")) localStorage.pairs_lastLevel = 0, localStorage.pairs_lastScore = 0, localStorage.pairs_mute = "false"
    } else alert("You have disabled local storage (or it is full).\nThe game will not remember the last level you completed when you return.");
    var a = $(window).width();
    if (smallDevice = 768 > a) {
        $("#header").hide();
        var b = $(window).height() - 50;
        500 < b && (b = 500);
        500 < a && (a = 500);
        $("#stage").width(a);
        $("#stage").height(b);
        500 > a && $("#stage").css({
            "margin-left": "0px"
        })
    } else $("#stage").css({
        "margin-left": "100px"
    });
    a = $("#stage").offset();
    $("#clock").css({
        left: a.left + $("#stage").width() - 50,
        top: a.top + 10
    });
    random = new CustomRandom(0);
    timer = new CountDown($("#clock"));
    inChallenge = "true" == UrlParam("challenge");
    userId = GetCookieUser();
    if (inChallenge) {
        if ("" == userId) {
            inChallenge = !1;
            DisplayMessage("Login first to play daily challenge");
            return
        }
        sendVars.action = "challenge";
        currLevel = 1;
        puzzleId = ""
    } else isStorage ? (currLevel = parseInt(localStorage.pairs_lastLevel) + 1, priorScore = parseInt(localStorage.pairs_lastScore)) : (currLevel = 1, priorScore = 0), puzzleId = UrlParam("id"), sendVars.action = "getfile", sendVars.id = "docs\\pairs_levels.json";
    $.get(SERVER_URL, sendVars, function(a) {
        levelDefn = jQuery.parseJSON(a);
        InitializeForStart()
    }, "text")
});

function InitializeForStart() {
    6 < puzzleId.length ? ("Level_" == puzzleId.substr(0, 6) && (currLevel = parseInt(puzzleId.substr(6))), InitializeNewLevel()) : 1 == currLevel ? InitializeNewLevel() : (currLevel <= levelDefn.length ? $("#initmess").html("You last completed level " + (currLevel - 1)) : ($("#initmess").html("You have completed all levels with score of " + priorScore), $("#btnContinue").hide()), ShowDialog($("#initpanel")))
}

function InitializeNewLevel() {
    config = levelDefn[currLevel - 1];
    var a;
    a = smallDevice && config.hasOwnProperty("grid_small") ? config.grid_small : config.grid_large;
    cellSize = parseInt(a.cellsize);
    numRows = a.rows;
    numCols = a.cols;
    totalCells != numRows * numCols && (totalCells = numRows * numCols, CreateGrid(), smallDevice ? $("#grid").addClass("gridsmall") : $("#grid").addClass("gridlarge"), gridOffset = $("#grid").offset());
    ClearGrid();
    totPairs = numRows * numCols / 2;
    $("#levelno").text(currLevel);
    $("#info").show();
    CreateTileSet();
    inChallenge &&
        (alreadyPlayed = !1, sendVars.action = "CheckPlayed", sendVars.game = "Pairs", sendVars.username = userId, $.ajax({
            type: "POST",
            url: "../CommonServer.aspx",
            data: sendVars
        }).done(function(a) {
            "true" == URLVariables(a).result && (alreadyPlayed = !0, alert("You have already accessed challenge for today.\nScore will not update leaderboard."))
        }))
}

function ShowLevelDetails(a) {
    var b;
    b = inChallenge ? "Daily Challenge" : "Level " + currLevel;
    var c = "You have " + config.time + " seconds to match " + totPairs + " pairs",
        c = 0 < config.target ? c + (" and score minimum " + config.target + " points.") : c + ".";
    config.initial && (c += "<br/>Grid will be revealed initially for " + config.initial + " seconds.");
    c += "<br/>There are " + config.unique + " different tiles.";
    config.message && (c += "<br/>" + config.message);
    a || ($("#starttitle").text(b), $("#startmess").html(c), ShowDialog($("#startpanel")))
}

function StartGame() {
    config.hasOwnProperty("seed") && (random.seed = config.seed);
    PlaceTilesInGrid();
    secondTile = firstTile = null;
    turns = score = 0;
    pairsLeft = totPairs;
    errorCnt = 0;
    DisplayInfo();
    tDisplay = 0;
    timer.countdownSecs = config.time;
    0 < config.initial ? (DisplayMessage("Memorize the tiles ..."), window.setTimeout("HideIcons()", 1E3 * config.initial)) : (DisplayMessage(TOUCH_VERB + " a tile and then try match it"), 0 < config.time && timer.StartTimer(), gameInProgress = !0)
}

function PlaceTilesInGrid() {
    ShuffleArray(tileSet);
    for (var a, b = 0; b < allCells.length; b++) a = allCells[b], "icon" == config.tiletype ? ctx.drawImage(imgIcons, tileSet[b].x, tileSet[b].y, 60, 60, a.x + 2, a.y + 2, cellSize - 4, cellSize - 4) : "symbol" == config.tiletype ? DrawSymbol(a, tileSet[b]) : "number" == config.tiletype ? (ctx.font = "20pt Arial", ctx.textAlign = "center", ctx.fillStyle = "#000033", ctx.fillText(tileSet[b].number, a.x + cellSize / 2, a.y + cellSize / 2 + 8), ctx.fillStyle = CELL_BACKCOLOR) : "image" == config.tiletype && ctx.drawImage(tileSet[b].img,
        0, 0, tileSet[b].img.width, tileSet[b].img.height, a.x + 2, a.y + 2, cellSize - 4, cellSize - 4), a.saveIcon(), a.value = tileSet[b].name, 0 == config.initial ? (a.hideIcon(), a.revealed = 0) : a.revealed = 1
}

function HideIcons() {
    for (var a in allCells) allCells[a].hideIcon();
    DisplayMessage(TOUCH_VERB + " a tile and then try match it");
    0 < config.time && timer.StartTimer();
    gameInProgress = !0
}

function EndOfTurn() {
    tDisplay = 0;
    DisplayMessage("");
    firstTile.hideIcon();
    secondTile.hideIcon();
    firstTile.value == secondTile.value ? (pairsLeft--, firstTile.hide(), firstTile.value = 0, secondTile.hide(), secondTile.value = 0, score += 20) : matchShownCnt && (score -= 5 * matchShownCnt, errorCnt++);
    firstTile = null;
    DisplayInfo();
    0 == pairsLeft && (config.target && score + CalculateBonus() < config.target ? EndOfLevel(!1, "Did not reach target score of " + config.target) : EndOfLevel(!0))
}

function TimesMatchShown(a) {
    var b = 0,
        c;
    for (c in allCells) allCells[c] != a && allCells[c].value == a.value && (b += allCells[c].revealed);
    return b
}

function CalculateBonus() {
    var a = timer.SecondsLeft();
    0 == errorCnt && (a += 5 * totPairs);
    return a
}

function EndOfLevel(a, b) {
    timer.StopTimer();
    if (gameInProgress)
        if (gameInProgress = !1, inChallenge) EndOfChallenge(a);
        else {
            var c = "<p style='font-size:120%; font-weight:bold'>";
            if (a) {
                mute || sound.play("tink");
                1 < currLevel && currLevel == levelDefn.length ? $("#endstat").text("All levels complete!") : $("#endstat").text("Level complete!");
                0 == errorCnt && (c += "Perfect Recall!");
                var d = CalculateBonus();
                score += d;
                DisplayInfo();
                c += "<br/>You scored " + score;
                d && (c += " (bonus " + d + ")");
                puzzleId.length ? $("#btnNext").text("Play Again") :
                    (priorScore += score, isStorage && (localStorage.pairs_lastLevel = currLevel, localStorage.pairs_lastScore = priorScore), c += "<br/>Total score for all levels is " + priorScore, currLevel == levelDefn.length && (c += "<p><b>Well done!</b></p>", SendScoreToServer(), $("#btnNext").hide()), currLevel++, $("#btnNext").text("Next Level"))
            } else mute || sound.play("fail"), $("#endstat").text("Level incomplete"), $("#btnNext").text("Try Again"), b && (c += "<br/>" + b);
            c += "</p>";
            $("#endmess").html(c);
            ShowDialog($("#endpanel"))
        }
}

function EndOfChallenge(a) {
    mute || sound.play("tink");
    $("#endstat").text("Challenge Over");
    $("#btnNext").hide();
    var b = "",
        c = 0;
    a && (c = CalculateBonus());
    score += c;
    DisplayInfo();
    b += "<br/>You scored " + score;
    c && (b += " (bonus " + c + ")");
    $("#endmess").html(b);
    ShowDialog($("#endpanel"));
    0 < score && !alreadyPlayed && (sendVars.action = "UpdateLeaderboard", sendVars.score = score, $.ajax({
        type: "POST",
        url: "../CommonServer.aspx",
        data: sendVars
    }).done(function(a) {
        a = URLVariables(a);
        $("#endmess").append("<br/>" + a.mess)
    }))
}

function SendStatsToServer() {
    0 != logStats.length && (sendVars.action = "addstats", sendVars.text = logStats.join("\n") + "\n", $.ajax({
        type: "POST",
        url: SERVER_URL,
        data: sendVars
    }), logStats.splice(0, logStats.length))
}

function SendScoreToServer() {
    "" != userId && (sendVars.action = "addresult", sendVars.score = priorScore, sendVars.userid = userId, $.ajax({
        type: "POST",
        url: SERVER_URL,
        data: sendVars
    }))
}

function DisplayInfo() {
    $("#score").text(score)
}

function CreateTileSet() {
    "icon" == config.tiletype ? IconLoader() : "symbol" == config.tiletype ? SymbolLoader() : "number" == config.tiletype ? NumberLoader() : "image" == config.tiletype && ImageLoader()
}

function IconLoader() {
    imgIcons = new Image;
    imgIcons.onload = function() {
        tileSet = [];
        var a = 0,
            b = 0,
            c;
        if (config.hasOwnProperty("numbers"))
            for (a = config.numbers.split(","), c = 1; c <= config.unique; c++) b = GetIconOffset(a[c - 1]), tileSet.push({
                x: b.x,
                y: b.y,
                name: c
            });
        else
            for (config.hasOwnProperty("starticon") && (b = GetIconOffset(parseInt(config.starticon)), a = b.x, b = b.y), c = 1; c <= config.unique; c++) tileSet.push({
                x: a,
                y: b,
                name: c
            }), a += 60, 600 <= a && (a = 0, b += 60);
        for (; tileSet.length < totalCells;)
            for (c = 0; c < config.unique; c++) tileSet.push(tileSet[c]);
        ShowLevelDetails(!1)
    };
    imgIcons.src = "Images/" + config.iconfile
}

function SymbolLoader() {
    tileSet = [];
    for (var a = Math.round(cellSize / 2), b, c = 1; c <= config.unique; c++) b = config.symbols[c - 1], b.x = a, b.y = a, b.radius = a - 6, b.name = c, tileSet.push(b);
    for (; tileSet.length < totalCells;)
        for (c = 0; c < config.unique; c++) tileSet.push(tileSet[c]);
    ShowLevelDetails(!1)
}

function NumberLoader() {
    tileSet = [];
    for (var a = config.numbers.split(","), b = 1; b <= config.unique; b++) tileSet.push({
        name: b,
        number: a[b - 1]
    });
    for (; tileSet.length < totalCells;)
        for (b = 0; b < config.unique; b++) tileSet.push(tileSet[b]);
    ShowLevelDetails(!1)
}

function ImageLoader() {
    tileSet = [];
    for (var a = [], b = config.images.split(","), c = 0, d = 0; d < totPairs; d++) a[d] = new Image, a[d].onload = function() {
        c++;
        if (c >= config.unique) {
            for (d in a) tileSet.push({
                img: a[d],
                name: d + 1
            });
            for (; tileSet.length < totalCells;)
                for (d = 0; d < config.unique; d++) tileSet.push(tileSet[d]);
            ShowLevelDetails(!1)
        }
    }, a[d].src = "Images/" + b[d] + ".png"
}

function GetIconOffset(a) {
    a *= 60;
    var b = 0;
    600 <= a && (b = 60 * Math.floor(a / 600), a %= 600);
    return {
        x: a,
        y: b
    }
}

function ClearGrid() {
    for (var a in allCells) allCells[a].clear()
}

function CreateGrid() {
    var a = (cellSize + 4) * numCols,
        b = (cellSize + 4) * numRows;
    $("#grid").width(a);
    $("#grid").height(b);
    a = "<canvas id='can' width='" + a + "' height='" + b + "'></canvas>";
    $("#grid").html(a);
    ctx = document.getElementById("can").getContext("2d");
    ctx.fillStyle = CELL_BACKCOLOR;
    ctx.strokeStyle = CELL_BORDERCOLOR;
    allCells = [];
    for (var c = b = 1; c <= numRows; c++) {
        for (var d = a = 1; d <= numCols; d++) cell = new GridCell, cell.col = d, cell.row = c, cell.x = a, cell.y = b, allCells.push(cell), a += cellSize + 4;
        b += cellSize + 4
    }
}

function ShowDialog(a) {
    var b = $("#stage").offset(),
        c = b.left + Math.round(($("#stage").width() - a.width()) / 2) - 10,
        b = b.top + Math.round(($("#stage").height() - a.height()) / 2) - 10;
    a.css({
        left: c,
        top: b
    });
    a.show()
}

function DisplayMessage(a) {
    $("#mess").text(a)
}

function CellAt(a, b) {
    var c = Math.floor((a - gridOffset.left) / (cellSize + 4)) + 1,
        d = Math.floor((b - gridOffset.top) / (cellSize + 4)) + 1;
    c > numCols && (c = numCols);
    d > numRows && (d = numRows);
    return allCells[(d - 1) * numCols + (c - 1)]
}

function DrawSymbol(a, b) {
    var c = a.x + b.x,
        d = a.y + b.y;
    ctx.save();
    ctx.beginPath();
    switch (b.type) {
        case "rect":
            ctx.rect(c - b.radius, d - b.radius, 2 * b.radius, 2 * b.radius);
            break;
        case "circle":
            ctx.arc(c, d, b.radius, 0, 2 * Math.PI, !1);
            break;
        case "poly":
            if (3 > b.sides) return;
            var e = 2 * Math.PI / b.sides;
            ctx.translate(c, d);
            b.hasOwnProperty("angle") && ctx.rotate(b.angle * Math.PI / 180);
            ctx.moveTo(b.radius, 0);
            for (c = 1; c < b.sides; c++) ctx.lineTo(b.radius * Math.cos(e * c), b.radius * Math.sin(e * c));
            break;
        case "wedge":
            ctx.moveTo(c, d);
            ctx.arc(c,
                d, b.radius, 0, 1.7 * Math.PI, !1);
            break;
        case "star":
            for (ctx.translate(c, d), ctx.moveTo(0, 0 - b.radius), c = 0; c < b.points; c++) ctx.rotate(Math.PI / b.points), ctx.lineTo(0, 0 - .5 * b.radius), ctx.rotate(Math.PI / b.points), ctx.lineTo(0, 0 - b.radius)
    }
    ctx.closePath();
    ctx.shadowColor = "#333333";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = b.fill;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    b.hasOwnProperty("stroke") && (ctx.strokeStyle = b.stroke);
    b.hasOwnProperty("lineWidth") &&
        (ctx.lineWidth = b.lineWidth);
    ctx.stroke();
    ctx.restore()
}
$(function() {
    $("#grid").bind(DOWN_EVENT, function(a) {
        gameInProgress && !tDisplay && (touchDevice ? (a = a.originalEvent, a = CellAt(a.targetTouches[0].pageX, a.targetTouches[0].pageY)) : a = CellAt(a.pageX, a.pageY), 0 != a.value && (a.showIcon(), a.revealed += 1, null == firstTile ? (firstTile = a, (matchShownCnt = TimesMatchShown(a)) && DisplayMessage("Match known")) : a != firstTile && (secondTile = a, turns++, firstTile.value == secondTile.value && (mute || sound.play("slide")), tDisplay = window.setTimeout("EndOfTurn()", 1E3))))
    });
    $("#btnOK").bind(DOWN_EVENT,
        function(a) {
            $(this).parent().hide()
        });
    $("#btnFirst").bind(DOWN_EVENT, function(a) {
        $(this).parent().hide();
        currLevel = 1;
        priorScore = 0;
        isStorage && (localStorage.triplets_lastLevel = 0, localStorage.triplets_lastScore = 0);
        InitializeNewLevel()
    });
    $("#btnContinue").bind(DOWN_EVENT, function(a) {
        $(this).parent().hide();
        InitializeNewLevel()
    });
    $("#btnStart").bind(DOWN_EVENT, function(a) {
        $(this).parent().hide();
        StartGame()
    });
    $("#btnNext").bind(DOWN_EVENT, function(a) {
        $(this).parent().hide();
        InitializeNewLevel()
    });
    $("#btnQuit").bind(DOWN_EVENT,
        function(a) {
            window.setTimeout("document.location.href = 'pairs.htm'", 1E3)
        });
    $(timer).bind("tick", function(a, b) {
        switch (b) {
            case 0:
                EndOfLevel(!1)
        }
    })
});

function GridCell() {
    this.y = this.x = this.row = this.col = this.revealed = this.value = 0;
    this.imgdata = null;
    this.hide = function() {
        smallDevice ? (ctx.save(), ctx.fillStyle = STAGE_BACKCOLOR, ctx.fillRect(this.x, this.y, cellSize, cellSize), ctx.restore()) : ctx.clearRect(this.x, this.y, cellSize, cellSize);
        ctx.strokeRect(this.x, this.y, cellSize, cellSize)
    };
    this.saveIcon = function() {
        this.imgdata = ctx.getImageData(this.x, this.y, cellSize, cellSize)
    };
    this.showIcon = function() {
        ctx.putImageData(this.imgdata, this.x, this.y)
    };
    this.hideIcon =
        function() {
            ctx.fillRect(this.x, this.y, cellSize, cellSize);
            ctx.strokeRect(this.x, this.y, cellSize, cellSize)
        };
    this.clear = function() {
        ctx.fillRect(this.x, this.y, cellSize, cellSize);
        ctx.strokeRect(this.x, this.y, cellSize, cellSize);
        this.imgdata = null
    }
};