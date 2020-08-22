/*jslint single, browser, fudge, this */
/*global jQuery, window, chrome, MutationObserver, NodeFilter, console */

(function () {
"use strict";

let mutationObserver;
let $ = jQuery;
let handNum = 1;
let playerName = null;

const paneID='azpspane';

const observerSettings = {
    characterData: true,
    childList: true,
    subtree: true
};

function getGamePane() {
    return $('div.nosel > div.nosel.tbl');
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
}

function makePane() {
    // ensure our pane is actually present:

    let pane = $('#' + paneID);

    if (pane.length === 0) {

        let gamePane = getGamePane();
        gamePane
            .css('margin-left', 10)
            .next()
                .css('left', 0);
        pane = $('<div>').prop('id', paneID);
        $('body').append(pane);
        setWidth();
    }
    return pane;
}

function showResult(texts) {
    makePane()
        .prepend($('<div>')
            .html(texts)
            .prepend($('<h2>').text('Hand ' + handNum))
            )
        .prop('scrollTop', 0);

    handNum += 1;
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

function getOneScore(node, player) {

        // #scN has childNodes containing:
        // wind, space, name, space, total score, [optional: delta]

        let totalLine = '<tr>';
        let el = $('#sc' + player, node)[0];
        let nNodes = el.childNodes.length;

        [0, 2, 4].forEach(function (idx) {
            totalLine += '<td>'
                + (idx < nNodes ? getVal(el.childNodes[idx]) : '')
                + '</td>';
        });

        if (el.childNodes.length > 5) {
            let score = getVal(el.childNodes[5]);
            totalLine += '<td class='
                + (score > 0 ? 'azpsplus' : 'azpsminus')
                + '>'
                + score;
        } else {
            totalLine += '<td>';
        }

        return totalLine + '</td></tr>';
}

function scoreTable(node) {

    let totalLine = '<table>';
    let nPlayers = 3 + ($('#sc3', node).length ? 1 : 0);
    Array.from(new Array(nPlayers).keys()).forEach(function (i) {
        totalLine += getOneScore(node, i);
    });
    return totalLine + '</table>';

}

function showExhaustiveDraw(node) {
    let outcome = node.childNodes[0].childNodes[1];
    let totalLine = '<h3>Draw '
        + riichiHonba(outcome)
        + '</h3>'
        + scoreTable(outcome);

    showResult(totalLine);
}

function showWin(node) {

    let totalLine = appendNodes(node.children[0])  // score
        + '<br>'
        + riichiHonba(node.childNodes[2])
        + '<table>';

    // get all the yaku

    $("tr:not(:has(table))", node.childNodes[1]).each(function (row) {
        totalLine += '<tr><td>'
            + getVal(this.childNodes[0])
            + '</td><td>'
            + getVal(this.childNodes[1])
            + '</td></tr>';
    });

    totalLine += '</table>' + scoreTable(node.childNodes[2]);

    showResult(totalLine);
}

function handleEnd(node) {
    // Remove our pane, and re-centre the game screen
    // TODO check if 1st place; if so, do reward animation

    console.log(node);
    // player names: tab > tr > td:first > childNodes[0]
    $('#' + paneID).remove();
    getGamePane().css('margin', '0 auto');
}

function showAbortiveDraw(node) {
    let outcome = node.childNodes[0].childNodes[1];
    let totalLine = '<h3>'
        + node.childNodes[0].childNodes[0].innerText
        + ' '
        + riichiHonba(outcome)
        + '</h3>';

    showResult(totalLine);
}

function handleStart() {
    handNum = 1;
    makePane().empty();
}

function checkNode(oneNode) {

    let testText = oneNode.innerText;

    if (testText.substr(0,5) === 'Start' || testText.substr(0,2) === '對局') {

        handleStart();

    } else if (testText.length > 10
        && (testText.substr(0,6) === 'Redeal' || testText.substr(0,2) === '流局')
        && oneNode.className === 'tbc'
        ) {

        showExhaustiveDraw(oneNode);

    } else if (oneNode.childNodes[0].id === 'total') {

        showWin(oneNode);

    } else if (testText.substr(0,2) === '終局'
                || testText.substr(0,3) === 'End') {

        handleEnd(oneNode);

    } else if (oneNode.className === 'tbc'
        && $('#sc0', oneNode).length
        && $('table', oneNode).length === 1) {

        showAbortiveDraw(oneNode);
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

chrome.storage.local.get(null, function(options) {
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