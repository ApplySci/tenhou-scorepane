/*global jQuery, window, chrome, MutationObserver, NodeFilter, console */
/*jslint single, browser */

"use strict";

let mutationObserver;
let $ = jQuery;
let handNum = 1;

const paneID='azpspane';

const observerSettings = {
    characterData: true,
    childList: true,
    subtree: true
};

function setToObserve() {
    mutationObserver.observe(document.documentElement, observerSettings);
}

chrome.runtime.onMessage.addListener(setToObserve);

function setWidth() {
    let gamePane = $('div.nosel > div.nosel');
    $('#' + paneID).css({
        'width': $('body').width() - gamePane.width() - 40
    });
}

function makePane() {
    // ensure our pane is actually present:

    let pane = $('#' + paneID);

    if (pane.length === 0) {
        let gamePane = $('div.nosel > div.nosel');
        gamePane.css('margin-left', 10);
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
            .prepend($('<h2>').text('Hand ' + handNum++))
            )
        .prop('scrollTop', 0);
}

function getVal(node) {
    return node.nodeValue || node.innerText;
}

function appendNodes(fromDom) {
    let toString = '';
    for (let z of fromDom.childNodes) {
        toString += getVal(z) + ' ';
    }
    return toString;
}

function riichiHonba(node) {
    return '<span class=azpsicons>'
            + $("tr:first td:first", node)[0].innerText
            + '</span>';
}

function scoreTable(node) {
    let totalLine = '<table>';
    let nPlayers = 3 + ($('#sc3', node).length ? 1 : 0);

    for (let i=0; i < nPlayers; i++) {
        // #scN has childNodes containing: wind, space, name, space, total score, [optional: delta]
        let el = $('#sc' + i, node)[0];
        totalLine += '<tr>';
        for (let idx of [0, 2, 4]) {
            totalLine += '<td>' + getVal(el.childNodes[idx]) + '</td>';
        }
        if (el.childNodes.length > 5) {
            let score = getVal(el.childNodes[5]);
            totalLine += '<td class='
            + (score > 0 ? 'azpsplus' : 'azpsminus')
            + '>'
            + score
            + '</td>'
        } else {
            totalLine += '<td></td>';
        }

        totalLine += '</tr>';
    }

    return totalLine + '</table>';
}

function checkNode(oneNode) {
    if (!oneNode.childNodes.length) {
        return;
    }

    let pane;
    let testText = oneNode.innerText;

    if (testText.substr(0,5) === 'Start' || testText.substr(0,2) === '對局') {
        handNum = 1;
        makePane().empty();
        return;
    }


    if (testText.length > 10
        && (testText.substr(0,6) === 'Redeal' || testText.substr(0,2) === '流局')
        && oneNode.className === 'tbc'
        ) {

        // exhaustive draw

        let outcome = oneNode.childNodes[0].childNodes[1];
        let totalLine = '<h3>Draw '
            + riichiHonba(outcome)
            + '</h3>'
            + scoreTable(outcome);

        showResult(totalLine);
        return;
    }


    if (oneNode.childNodes[0].id === 'total') {
        // a hand that's been won and lost

        let totalLine = appendNodes(oneNode.children[0])  // score
            + '<br>'
            + riichiHonba(oneNode.childNodes[2])
            + '<table>';

        // get all the yaku

        $("tr:not(:has(table))", oneNode.childNodes[1]).each(function (row) {
            totalLine += '<tr><td>'
                + getVal(this.childNodes[0])
                + '</td><td>'
                + getVal(this.childNodes[1])
                + '</td></tr>';
        });

        totalLine += '</table>' + scoreTable(oneNode.childNodes[2]);

        showResult(totalLine);
        return;
    }

    if (testText.substr(0,2) === '終局' || testText.substr(0,3) === 'End') {
        // end of the game: remove our pane, and re-centre the game screen
        // TODO check if 1st place; if so, do reward animation
        $('#' + paneID).remove();
        $('div.nosel > div.nosel').css('margin', '0 auto');
        return;
    }


    if (oneNode.className === 'tbc' && $('#sc0', oneNode).length && $('table', oneNode).length == 1) {
        // abortive draw
        let outcome = oneNode.childNodes[0].childNodes[1];
        let totalLine = '<h3>'
            + oneNode.childNodes[0].childNodes[0].innerText
            + ' '
            + riichiHonba(outcome)
            + '</h3>'

        showResult(totalLine);
        return;
    }
}

function onMutate(mutations) {
    mutationObserver.disconnect();
    mutations.forEach(function doAMutation(oneMutation) {
        if (oneMutation.addedNodes.length) {
            oneMutation.addedNodes.forEach(checkNode);
        }
    });
    setToObserve();
}

// This is what happens when the page is first loaded
chrome.storage.local.get(null, function(options) {
    mutationObserver = new MutationObserver(onMutate);
    setToObserve();
    let timeout;
    $(window).resize(function() {
        // this needs a delay, as Tenhou itself takes time to resize the game pane when the screen is resized
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(setWidth, 1000);
    });
});
