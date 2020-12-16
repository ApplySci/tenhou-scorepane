/*jshint esversion:6 */
/*jslint single, browser, fudge, this */
/*global jQuery, window, chrome, MutationObserver, console */

(function () {
"use strict";

let mutationObserver;
let $ = jQuery;
let handNum = 1;
let playerName = null;
let isT4;

const paneID = 'azpspane';

const observerSettings = {
    characterData: true,
    childList: true,
    subtree: true
};

function getGamePane() {
    // check whether we've set the isT4 flag already, and if not, set it to true if we're on tenhou.net/4, else set it to false
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
}

function scorePane() {

    // if our score pane isn't present, create it

    let pane = $('#' + paneID);

    if (pane.length === 0) {

        let gamePane = getGamePane();
        if (isT4) {
            gamePane.css('transform' ,'translateX(0)');
        } else {
            gamePane
                .css('margin-left', 10)
                .next()
                    .css('left', 0);
        }
        pane = $('<div>').prop('id', paneID);
        $('body').append(pane);
        setWidth();
    }
    return pane;
}

function rememberPlayerName(node) {
    if (playerName !== null) {
        return;
    }
    let player;
    if (isT4) {
        player = $('.bbg5:last > span:eq(1)', node);
        if (player.length) {
            playerName = player[0].innerText;
        }
    } else {
        player = $('#sc0', node);
        if (player.length) {
            playerName = player[0].childNodes[2].innerText;
        }
    }
}

function showResult(texts) {
    scorePane()
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

        let totalLine = '';
        let el = $('#sc' + player, node)[0];
        let nNodes = el.childNodes.length;

        [0, 2, 4].forEach(function (idx) {
            totalLine += '<td>'
                + (idx < nNodes ? getVal(el.childNodes[idx]) : '')
                + '</td>';
        });

        if (el.childNodes.length > 5) {
            let score = getVal(el.childNodes[5]);
            totalLine =  '<tr class="'
                + (score > 0 ? 'azpsplus' : 'azpsminus')
                + '">'
                + totalLine
                + '<td>'
                + score;
        } else {
            totalLine = '<tr>' + totalLine + '<td>';
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

/*
 "<div class="nopp" style="width: 1008px; height: 756px; transform-origin: 0px 0px 0px; transform: scale(1); font-size: 20.16px; color: rgb(255, 255, 255);"><div class="s0" style="pointer-events: auto; position: absolute; background: rgba(0, 0, 0, 0.9) none repeat scroll 0% 0%; text-align: center; border: 0.8px solid rgb(68, 68, 68); padding: 16px 0px; left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.95); width: 70%; height: 49.3122%;"><canvas class="nodisp" width="0" height="0" style="pointer-events:none;margin:0 0 8px"></canvas><canvas class="nodisp" width="0" height="0" style="pointer-events:none;margin:0 0 8px"></canvas><div style="pointer-events:none;margin:0 0 8px"></div><canvas class="nodisp" width="0" height="0" style="pointer-events:none;margin:0 0 8px"></canvas><div style="pointer-events:none;font-family:cwTeX-Q-Kai-T,icons2,serif;font-size:400%;">流局</div><div style="pointer-events: none; margin: 32px 8px 16px;"><table width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td rowspan="1" style="width:33%;height:1.2em;font-family:icons2;"><span class="gray">\ue804</span>0 <span class="gray">\ue805</span>0</td><td rowspan="2" style="width:34%;height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">東</span> <span style="font-weight:bold;color:#CCC;">COM</span><br>25000</div></td><td rowspan="1" style="width:33%;height:1.2em;"><span class="gray">四般東喰赤</span></td></tr><tr><td rowspan="2" style="height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">南</span> <span style="font-weight:bold;color:#CCC;">COM</span><br>25000</div></td><td rowspan="2" style="height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">北</span> <span style="font-weight:bold;color:#CCC;">COM</span><br>25000</div></td></tr><tr><td rowspan="2" style="height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">西</span> <span style="font-weight:bold;color:#CCC;">ApplySci</span><br>25000</div></td></tr><tr><td rowspan="1" style="height:1.2em;"></td><td rowspan="1" style="height:1.2em;"></td></tr></tbody></table></div><button class="btn s7" name="c5" style="width:8em;padding:1em;">OK</button></div></div>"
 */

    rememberPlayerName(node);
    let outcome;
    if (isT4) {
    } else {
        outcome = node.childNodes[0].childNodes[1];
        let totalLine = '<h3>Draw '
            + riichiHonba(outcome)
            + '</h3>'
            + scoreTable(outcome);

        showResult(totalLine);
        }
}

function showWin(node) {

/*
"<div class="nopp" style="width: 1008px; height: 756px; transform-origin: 0px 0px 0px; transform: scale(1); font-size: 20.16px; color: rgb(255, 255, 255);"><div class="s0" style="pointer-events: auto; position: absolute; background: rgba(0, 0, 0, 0.9) none repeat scroll 0% 0%; text-align: center; border: 0.8px solid rgb(68, 68, 68); padding: 16px 0px; left: 50%; top: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.95); width: 70%; height: 70.2646%;"><canvas class="" width="812" height="80" style="pointer-events: none; margin: 0px 0px 8px; width: 649.6px; height: 64px;"></canvas><canvas class="" width="368" height="80" style="pointer-events: none; margin: 0px 0px 8px; width: 294.4px; height: 64px;"></canvas><div style="pointer-events:none;margin:0 0 8px"><table style="width:100%;font-family:cwTeX-Q-Kai-T,icons2,serif;font-size:150%;" cellspacing="0" cellpadding="0"><tbody><tr><td width="50%" valign="top" align="center"><table cellspacing="0" cellpadding="0"><tbody><tr><td align="left"><div class="yk">役牌 白</div></td><td align="left"><div class="hn">　1<span class="gray">飜</span></div></td></tr><tr><td align="left"><div class="yk">ドラ</div></td><td align="left"><div class="hn">　2<span class="gray">飜</span></div></td></tr><tr><td align="left"><div class="yk">赤ドラ</div></td><td align="left"><div class="hn">　2<span class="gray">飜</span></div></td></tr></tbody></table></td></tr></tbody></table></div><canvas class="nodisp" width="0" height="0" style="pointer-events:none;margin:0 0 8px"></canvas><div style="pointer-events: none; font-family: cwTeX-Q-Kai-T, icons2, serif; font-size: 250%;"><span class="gray">滿貫</span>8000<span class="gray">点</span></div><div style="pointer-events: none; margin: 8px 8px 16px;"><table width="100%" cellspacing="0" cellpadding="0"><tbody><tr><td rowspan="1" style="width:33%;height:1.2em;font-family:icons2;"><span class="gray">\ue804</span>0 <span class="gray">\ue805</span>0</td><td rowspan="2" style="width:34%;height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">北</span> <span style="font-weight:bold;color:#CCC;">COM</span><br>25000</div></td><td rowspan="1" style="width:33%;height:1.2em;"><span class="gray">四般東喰赤</span></td></tr><tr><td rowspan="2" style="height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">東</span> <span style="font-weight:bold;color:#CCC;">COM</span><br>25000</div></td><td rowspan="2" style="height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">西</span> <span style="font-weight:bold;color:#CCC;">COM</span><br>25000 <span style="color:#F00;">-8000</span></div></td></tr><tr><td rowspan="2" style="height:2.4em;"><div style="padding:0.2em 0;" class="bbg5"><span style="font-weight:bold;color:#888;">南</span> <span style="font-weight:bold;color:#CCC;">ApplySci</span><br>25000 <span style="color:#0FF;">+8000</span></div></td></tr><tr><td rowspan="1" style="height:1.2em;"></td><td rowspan="1" style="height:1.2em;"></td></tr></tbody></table></div><button class="btn s7" name="c5" style="width:8em;padding:1em;">OK</button></div></div>"
*/

    rememberPlayerName(node);

    if (isT4) {
        // TODO
    } else {
        let totalLine = appendNodes(node.children[0])  // score
            + '<br>'
            + riichiHonba(node.childNodes[2])
            + '<table>';

        // get all the yaku

        let yakuTable = $("tr:not(:has(table))", node.childNodes[1]);
        let nYaku = yakuTable.length;
        yakuTable.each(function (row) {
            let hanCount = getVal(this.childNodes[1]);
            totalLine += '<tr'
                + ((hanCount.trimLeft()[0] === '0') ? ' class=azpsgrey' : '')
                + '><td>'
                + getVal(this.childNodes[0])
                + '</td><td>'
                + hanCount
                + '</td></tr>';
        });

        totalLine += '</table>' + scoreTable(node.childNodes[2]);

        // pause so we don't spoil any uradora surprise
        setTimeout(() => showResult(totalLine), 500 + nYaku * 1000);
    }
}

function handleEnd(node) {

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

    showResult(totalLine);
}

function handleStart(node) {
    handNum = 1;
    scorePane().empty();
    rememberPlayerName(node);
}

function checkNode(oneNode) {

    let testText = oneNode.innerText;
    if (typeof testText === 'undefined' || testText === null) {
        return;
    }

    if (false && oneNode.className.includes('nopp')) {
        console.log('========================================');
        console.log(isT4 && testText.length > 20 && testText.substr(0,2) === '役牌');
        console.log(testText);
    }
    
    if (testText.substr(0,5) === 'Start' || testText.substr(0,2) === '對局') {

        console.log('start');
        handleStart(oneNode);

    } else if (testText.length > 10
        && (testText.substr(0,6) === 'Redeal' || testText.substr(0,2) === '流局')
        && (oneNode.className === 'tbc' || (isT4 && oneNode.className.includes('nopp')))
        ) {
            
        console.log('draw');
        showExhaustiveDraw(oneNode);

    } else if (oneNode.childNodes[0].id === 'total'
        || (isT4 && testText.length > 20 && oneNode.className.includes('nopp') /*&& (
            testText.substr(0,2) === '自風' || testText.substr(0,2) === '役牌'
            || testText.substr(0,5) === 'Tsumo' || testText.substr(0,3) === 'Ron'
        )*/ ) ) {
            
        console.log('win');
        showWin(oneNode);

    } else if (
        (oneNode.className === 'tbc' || isT4)
        && (testText.substr(0,2) === '終局' || testText.substr(0,3) === 'End')
        ) {
            
        console.log('end');
        handleEnd(oneNode);

    } else if ((oneNode.className === 'tbc'
            && $('#sc0', oneNode).length
            && $('table', oneNode).length === 1)
        // || (isT4 && (testText.substr(0,2) === '流局' || testText.substr(0,5) === 'Redeal')) - TODO seems to be subsumed under general DRAW currently
        ) {
            
        console.log('abortive draw');
        showAbortiveDraw(oneNode);

    } else if ($('#' + paneID).length && (
            $('#pane1', oneNode).length 
            || (isT4 && oneNode.className.includes('s0') && testText.includes('Online:'))
        ) ) {
            
        console.log('removePane');
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
                    debugger;
                    console.log(e);
                }
            });
        }
    });
    setToObserve();
}

// This is what happens when the page is first loaded

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