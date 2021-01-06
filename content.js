/*jshint esversion:6, -W014 */
/*global jQuery, window, chrome, MutationObserver, console, Chart */

(function () {
"use strict";

let mutationObserver;
let $ = jQuery;
let handNum = 1;
let playerName = null;
let isT4;
let graphData = {};

const paneID = 'azpspane';

const observerSettings = {
    characterData: true,
    childList: true,
    subtree: true
};

function resetGraphData() {
    graphData = {
        type: 'line',
        data: {
            labels: [0],
            datasets: [{
                label: 'A',
                data: [ ],
                fill: false,
                borderColor: "#A00",
            }, {
                label: 'B',
                data: [ ],
                fill: false,
                borderColor: "#22F"
            }, {
                label: 'C',
                data: [ ],
                fill: false,
                borderColor: "#3F3"
            }, {
                label: 'D',
                data: [ ],
                fill: false,
                borderColor: "#FF3",
                borderWidth: 6
            }]
        },
        options: {
            elements: {
                line: {
                    borderWidth: 3,
                    cubicInterpolationMode: 'monotone',
                    lineTension: 0,
                    spanGaps: true,
                    steppedLine: true
                }
            },
            scales: {
                xAxes: [{
                    ticks: {
                        display: false
                    }
                }],
                yAxes: [{
                    ticks: {
                        callback: function(value, index, values) {
                            return '' + value/1000 + 'k';
                        }
                    }
                }]
            }
        }
    };
}

function getGamePane() {

    // flag to indicate whether this is tenhou.net/4
    if (isT4 === undefined) {
        isT4 = window.location.pathname.substring(0,2) === '/4';
    }
    if (isT4) {
        return $('div.nosel:first');
    } else {
        return $('div.nosel > div.nosel.tbl:first');
    }

}

function setToObserve() {

    mutationObserver.observe(document.documentElement, observerSettings);

}

chrome.runtime.onMessage.addListener(setToObserve);

function setWidth() {

    let gamePane = getGamePane();
    $('#' + paneID).css({
        'width': $('body').width() - gamePane.width() - 40
    });
    moveMainPane();

}

function moveMainPane() {

    let gamePane = getGamePane();
    if (isT4) {
        gamePane.css('transform' ,'translateX(0)');
    } else {
        gamePane
            .css('margin-left', 10)
            .next()
                .css('left', 0);
    }

}

function scorePaneInit() {
    $('#' + paneID)
        .append($('<div>')
            .addClass('hands')
            .append($('<h3>').text('The ApplySci Tenhou Score Pane'))
        );
}

function scorePane() {

    // if our score pane isn't present, create it

    let pane = $('#' + paneID);
    let fontsize = isT4 ? '0.8em' : '0.5em';

    if (pane.length === 0) {
        pane = $('<div>').prop('id', paneID).css('fontSize', fontsize);
        $('body').append(pane);
        setWidth();
        scorePaneInit();
    }
    return pane;

}

function rememberPlayerName(node) {
    if (playerName !== null) {
        return;
    }
    let players;
    if (isT4) {
        players = $('.bbg5', node);
        let me = players.eq(players.length - 1);
        if (players.length === 3 && graphData.data.datasets.length === 4) {
            graphData.data.datasets.splice(2,1); // remove the green line for sanma
        }
        if (me.length) {
            playerName = me.children('span:eq(1)').text();
        }
        for (let i=0; i < players.length; i++) {
            graphData.data.datasets[i].label = decodeURIComponent(players.eq(i).children('span:eq(1)').text());
        }
    } else {
        let player = $('#sc0', node);
        if (player.length) {
            playerName = player[0].childNodes[3].innerText;
            graphData.data.datasets[0].label = decodeURIComponent(playerName);
            if ($('#sc3', node).length === 0 && graphData.data.datasets.length === 4) {
                graphData.data.datasets.splice(2,1); // remove the green line for sanma
            }
            for (let i=1; i<4; i++) {
                player = $('#sc'+i, node);
                if (player.length > 0) {
                    graphData.data.datasets[i].label = decodeURIComponent(player[0].childNodes[3].innerText);
                }
            }
        }
    }

}

function getHandName(node) {

    if (isT4) {
        let honbaString = getT4ScoreTable(node).find('td:first')[0].childNodes[1].nodeValue;
        if (honbaString === null) {
            return false;
        }
        let nHonba =  honbaString.trim();
        // this seems ridiculously brittle, but works for now
        let hand = $('div.nosel > div.nopp > div.nopp > span.gray:first')
                .eq(0).parent().find('span').slice(0,2).text();
        if (nHonba !== '0') {
            hand += '-' + nHonba;
        }
        handNum++;
        return hand;
    } else {
        return 'Hand ' + handNum++;
    }

}

function showResult(texts, handName, node, hide) {

    let newEl = $('<div>').html(texts);
    if (hide) {
        newEl.addClass('hidden');
    }
    $('div.hands', scorePane()).prepend(newEl).prop('scrollTop', 0);
    if (node !== null && isT4) {
        let source = $('canvas:first', node);
        let tiles = document.createElement('canvas');
        newEl.prepend(tiles);
        let newHeight = source.height() * tiles.width / source.width();
        tiles.height = Math.ceil(newHeight);
        tiles.getContext('2d').drawImage(source[0], 0, 0, tiles.width, newHeight);
    }
    newEl.prepend($('<h2>').text(handName).attr('id', 'azps_' + handName.replace(' ', '_')));
    return newEl;
}

function getVal(node) {

    return node.nodeValue || node.innerText;

}

function appendNodes(fromDom) {

    let toString = '';
    fromDom.childNodes.forEach(function appendOneNode(node) {
        toString += getVal(node) + ' ';
    });
    return toString;

}

function riichiHonba(node) {

    return '<span class=azpsicons>'
            + $("tr:first td:first", node)[0].innerText
            + '</span>';

}

function chartOneScore(player, totalScore, score) {

    if (graphData.data.datasets[player].data.length === 0) {
        graphData.data.datasets[player].data.push(totalScore);
    }
    graphData.data.datasets[player].data.push(totalScore + parseFloat(score));

}

function getOneScore(node, player) {

    // T3: #scN wind, space, name, space, total score, [optional: delta]
    // T4: <div class="bbg5"><span>東</span> <span>COM</span><br>25000</div>

    let totalLine = '';
    let nNodes = node.childNodes.length;
    let score = 0;

    [0, 2, 4].forEach(function (idx) {
        totalLine += '<td>'
            + (idx < nNodes ? getVal(node.childNodes[idx]) : '')
            + '</td>';
    });


    if (node.childNodes.length > 5) {
        score = getVal(node.childNodes[5]);
        totalLine =  '<tr class="'
            + (score > 0 ? 'azpsplus' : 'azpsminus')
            + '">'
            + totalLine
            + '<td>'
            + score;
    } else {
        totalLine = '<tr>' + totalLine + '<td>';
    }
    let totalScore = parseFloat(getVal(node.childNodes[4]));
    if (nNodes >= 5) {
        chartOneScore(player, totalScore, score);
    }
    return totalLine + '</td></tr>';
}

function scoreTableT3(node) {

    let totalLine = '<table>';
    let nPlayers = 3 + ($('#sc3', node).length ? 1 : 0);
    Array.from(new Array(nPlayers).keys()).forEach(function (i) {
        totalLine += getOneScore($('#sc' + i, node)[0], i);
    });
    return totalLine + '</table>';

}

function scoreTableT4(node) {

    let players = $('.bbg5', node);
    let table = '<table>';
    for (let i=0; i < players.length; i++) {
        table += getOneScore(players.eq(i)[0], i);
    }
    return table + '</table>';

}

function getT4ScoreTable(node) {

    return  $('table .bbg5', node).parents('table:first');

}

function showExhaustiveDraw(node) {

    rememberPlayerName(node);
    let outcome;
    let block = '<h3>Draw ';
    if (isT4) {
        outcome = $('table', node);
        block += riichiHonba(getT4ScoreTable(node)) + '</h3>' + scoreTableT4(outcome);
    } else {
        outcome = node.childNodes[0].childNodes[1];
        block += riichiHonba(outcome) + '</h3>' + scoreTableT3(outcome);
    }
    let handName = getHandName();
    graphData.data.labels.push(handName);
    showResult(block, handName, null, false);

}

function yakuLine(yaku, han) {

    han = han.trimLeft();
    return '<tr'
        + ((han.length > 0 && han[0] === '0') ? ' class=azpsgrey' : '')
        + '><td>'
        + yaku
        + '</td><td>'
        + han
        + '</td></tr>';

}

function showWin(node) {

    rememberPlayerName(node);
    let totalLine;
    let nYaku;

    if (isT4) {

        if ($('.yk,.ym',node).length === 0) {
            return;
        }
        let scoreTable = getT4ScoreTable(node);

        totalLine = appendNodes($('div.s0 > div:eq(1)', node)[0])
                + '<br>'
                + riichiHonba(scoreTable);

        // get the yaku

        totalLine += '<table>';
        let yakuList = $('table:first table tr', node);
        nYaku = yakuList.length;
        yakuList.each(function getOneYaku(row) {
            totalLine += yakuLine($('.yk,.ym', this).text(), $('.hn', this).text());
        });
        totalLine += '</table>';

        totalLine += scoreTableT4(scoreTable);

    } else {

        totalLine = appendNodes(node.children[0])  // score
            + '<br>'
            + riichiHonba(node.childNodes[2]);

        // get the yaku

        totalLine += '<table>';
        let yakuTable = $("tr:not(:has(table))", node.childNodes[1]);
        nYaku = yakuTable.length;
        yakuTable.each(function addYakuLine(row) {
            totalLine += yakuLine(getVal(this.childNodes[0]), getVal(this.childNodes[1]));
        });
        totalLine += '</table>';

        // get the scores
        totalLine += scoreTableT3(node.childNodes[2]);
    }

    let handName = getHandName();
    if (handName !== false) {
        graphData.data.labels.push(handName);
        let scoreDiv = showResult(totalLine, handName, node, true);
        // pause before revealing the scores, so that we don't spoil any uradora surprise
        setTimeout(() => scoreDiv.removeClass('hidden'), 500 + nYaku * 1000);
    }
}

function handleEnd(node) {
    let pane = $('#'+paneID);
    let chartEl = $('<canvas>').addClass('chart');
    pane.prepend(chartEl);
    chartEl.height = Math.ceil(pane.width * 0.6);
    const chart = new Chart(chartEl[0], graphData);
    $('div.hands', pane).css('top', chartEl.offset().top + chartEl.outerHeight(true) + 10);

    chartEl.click(function clickChart(evt){
        evt.stopPropagation();
        const activeXPoints = chart.getElementsAtXAxis(evt); // or chart.getElementAtEvent(evt);
        let handNumber = activeXPoints[0]._index;
        if (handNumber === 0) {
            handNumber = 1;
        }
        let id = 'azps_' + graphData.data.labels[handNumber].replace(' ', '_');
        document.getElementById(id).scrollIntoView();
        return false;
    });

    let winner;
    if (isT4) {
        winner = $('.bbg5:first')[0].childNodes[0].nodeValue;
    } else {
        winner = $('table > tbody > tr > td:first', node)[0]
            .childNodes[0]
            .nodeValue;
    }
    if (winner !== playerName || $('div.tbc.bgb:contains(Exit)').length || $('button:contains(Exit)').length) {
        return;
    }
    // if we are here, then the live player has won
    // TODO do something nice to mark the win; add options sceen to manage this
    console.log('winner, winner, chicken dinner');
}

function removePane() {

    $('#' + paneID).remove();

    // Re-centre the tenhou main panel

    let gamePane = getGamePane();
    if (isT4) {
        gamePane.css('transform' ,'translateX('
            + Math.round(($('body').width() - gamePane.width())/2)
            + 'px)');
    } else {
        gamePane.css('margin', '0 auto');
    }
}

function showAbortiveDraw(node) {

    rememberPlayerName(node);

    let outcome = node.childNodes[0].childNodes[1];
    let totalLine = '<h3>'
        + node.childNodes[0].childNodes[0].innerText
        + ' '
        + riichiHonba(outcome)
        + '</h3>';

    showResult(totalLine, getHandName(), null, false);
}

function handleStart(node) {

    if ($('#' + paneID + ' > div.hands > div').length > 0) {
        return false;
    }
    handNum = 1;
    resetGraphData();
    scorePane().empty();
    scorePaneInit();
    rememberPlayerName(node);

}

function checkNode(oneNode) {

    let testText = oneNode.innerText;
    if (typeof testText === 'undefined' || testText === null) {
        return;
    }

    if (oneNode.className === (isT4 ? 'nopp' : 'tbc') &&
        (testText.substr(0,5) === 'Start' || testText.substr(0,2) === '對局')) {

        handleStart(oneNode);

    } else if (testText.length > 10
        && (testText.substr(0,6) === 'Redeal' || testText.substr(0,2) === '流局')
        && (oneNode.className === 'tbc' || (isT4 && oneNode.className.includes('nopp')))
        ) {

        showExhaustiveDraw(oneNode);

    } else if (oneNode.childNodes[0].id === 'total'
        || (isT4 && testText.length > 20 && oneNode.className.includes('nopp')
        ) ) {

        showWin(oneNode);

    } else if (
        (oneNode.className === 'tbc' || isT4)
        && (testText.substr(0,2) === '終局' || testText.substr(0,3) === 'End')
        ) {

        handleEnd(oneNode);

    } else if ((oneNode.className === 'tbc'
            && $('#sc0', oneNode).length
            && $('table', oneNode).length === 1)
        ) {

        showAbortiveDraw(oneNode);

    } else if ($('#' + paneID).length && (
            $('#pane1', oneNode).length
            || (isT4 && oneNode.className.includes('s0') && testText.includes('Online:'))
        ) ) {

        removePane();

    }
}

function onMutate(mutations) {
    mutationObserver.disconnect();
    mutations.forEach(function doAMutation(oneMutation) {
        if (oneMutation.addedNodes.length) {
            oneMutation.addedNodes.forEach(function do1node(node) {
                try {
                    if (node.childNodes.length) {
                        checkNode(node);
                    }
                } catch (e) {
                    console.log(e);
                }
            });
        }
    });
    setToObserve();
}

// This is what happens when the page is first loaded

Chart.platform.disableCSSInjection = true;

chrome.storage.local.get(null, function(options) {
    getGamePane(); // ensure isT4 is set
    // we're not using options yet, but almost certainly will do eventually
    mutationObserver = new MutationObserver(onMutate);
    setToObserve();
    let timeout;
    $(window).resize(function() {
        // this has a delay, as Tenhou itself takes time
        // to resize the game pane when the screen is resized, and we need
        // to wait for it to finish before we do our stuff
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(setWidth, 1000);
    });
});

}());