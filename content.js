/*global jQuery, window, chrome, MutationObserver, NodeFilter, console */
/*jslint single, browser */

"use strict";

let mutationObserver;
let $ = jQuery;
let inTotal = 0;

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

function makePane() {
    // ensure our pane is actually present:

    let pane = $('#' + paneID);

    if (pane.length === 0) {
        let gamePane = $('div.nosel > div.nosel');
        gamePane.css('margin-left', 10);
        pane = $('<div>').prop('id', paneID).css({
            'left': gamePane.width() + 10,
            'width': screen.availWidth - gamePane.width() - 40
        });
        $('body').append(pane);
    }
    return pane;
}

function showResult(header, texts) {
    makePane()
        .empty()
        .html(texts)
        .prepend($('<h3>').text(header))
        ;
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

function checkNode(oneNode) {
    if (!oneNode.childNodes.length) {
        return;
    }

    let pane;
    let testText = oneNode.innerText;

    if (testText.substr(0,5) === 'Start' || testText.substr(0,2) === '對局') {
        showResult('', '');
        return;
    }

    // is this a redeal / exhaustive draw:

    if (testText.length > 10
        && (testText.substr(0,6) === 'Redeal' || testText.substr(0,2) === '流局')
        ) {

        // the >10 check is there because when tenhou loads,
        // it loads a redeal node, which only contains "Redeal",
        // which we don't want to be triggered by, here
        console.log(oneNode);
        showResult('Previous hand - redeal', testText);
        return;
    }

    // is this the total div for a hand that's been won and lost

    if (oneNode.childNodes[0].id === 'total') {

        // TODO check if this breaks with yakuman

        let totalLine = appendNodes(oneNode.children[0])  // header row contains score
            + '<br><span class=azpsicons>'
            + $("tr:first td:first", oneNode.childNodes[2])[0].innerText // riichi sticks and honba
            + '</span><table>';

        totalLine += '';

        // get all the yaku

        $("tr:not(:has(table))", oneNode.childNodes[1]).each(function (row) {
            totalLine += '<tr><td>'
                + getVal(this.childNodes[0])
                + '</td><td>'
                + getVal(this.childNodes[1])
                + '</td></tr>';
        });

        totalLine += '</table><table>';

        for (let i=0; i<4; i++) {
            // #sc0 - childNodes: wind space name space score [delta]
            let el = $('#sc' + i, oneNode)[0];
            totalLine += '<tr>';
            for (let idx of [0, 2, 4, 5]) {
                totalLine += '<td>'
                    + (el.childNodes.length > idx ? getVal(el.childNodes[idx]) : '')
                    + '</td>';
            }
            totalLine += '</tr>';
        }

        totalLine += '</table>';

        showResult('Previous hand', totalLine);
    }

    // is it the end of the game
    // in which case, we can remove our pane, and re-centre the game screen

    if (testText.substr(0,2) === '終局' || testText.substr(0,3) === 'End') {
        $('#' + paneID).remove();
        $('div.nosel > div.nosel').css('margin', '0 auto');
    }
    return;
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
});
