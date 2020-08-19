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
            'position': 'absolute',
            'top': '10px',
            'padding-left': '20px',
            'left': gamePane.width() + 10,
            'width': screen.availWidth - gamePane.width() - 40,
            'overflow-y': 'scroll',
            'z-index': -1,
            'height': '99%'
        });
        $('body').append(pane);
    }
    return pane;
}

function showResult(header, texts) {

    texts = texts.trimRight();
    if (texts.substr(-2,2) === 'OK') {
        texts = texts.slice(0, -2).trimRight();
    }

    texts = texts.replace('', '<span class="azpsicons"></span>'); // honba
    texts = texts.replace('', '<span class="azpsicons"></span>'); // riichi
    
    makePane()
        .empty()
        .append($('<h3>').text(header))
        .append($('<pre>').append(texts))
        ;
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

    // first check if it's a redeal / exhaustive draw:

    if (testText.length > 10
        && (testText.substr(0,6) === 'Redeal' || testText.substr(0,2) === '流局')
        ) {

        // the >10 check is there because when tenhou loads,
        // it loads a redeal node, which only contains "Redeal",
        // which we don't want to be triggered by, here
        showResult('Previous hand - redeal', testText);
        return;
    }

    // now check whether this is the total div for a hand that's been won and lost

    if (oneNode.childNodes[0].id === 'total') {
        showResult('Previous hand', testText);
    }

    // or is it the end of the game
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
