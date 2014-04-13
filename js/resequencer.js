;(function() {
    "use strict";
    // <body data-resequence="#ID_OF_SCRIPT_CONTAINING_RESEQUENCE">
    // or
    // <body data-resequence-src="path.to.resequence.file.rseqdef">
    var g = window;
    var findBody, body = (findBody = document.getElementsByTagName('body')).length > 0 ? findBody[0] : null;
    var resequenceEl, resequenceSrc;
    if (body == null || (
        (resequenceSrc = body.getAttribute("data-resequence-src")) == null &&
        (resequenceEl = body.getAttribute("data-resequence")) == null)) {
        return;
    }
    var _opts = {
        src : resequenceSrc,
        seqdef  : resequenceEl,
        targetEl: body
    }
    var resequence = g.resequenceHTML = function resequence(seqdef, src, targetEl) {
        if (seqdef instanceof Event) {
            seqdef = undefined;
        }
        var opts = _opts;
        if (typeof seqdef == "object" && !(seqdef instanceof jQuery)) {
            for (var p in seqdef) {
                opts[p] = seqdef[p];
            }
            seqdef = null;
        }
        seqdef = seqdef || opts.seqdef;
        src = src || opts.src;
        targetEl = targetEl || opts.targetEl;

        if (src && !seqdef) {
            if (typeof jQuery != 'undefined') {
                jQuery.get(src, function(data, textStatus, jqXHR) {
                    resequence({seqdef: data, src: null});
                });
            } else {
                throw new Error("AJAX loading independent from jQuery not yet implemented.");
            }
            return;
        }
        if (typeof seqdef == "object") {
            if (typeof jQuery != 'undefined' && seqdef instanceof jQuery) {
                resequence({seqdef: seqdef[0]})
                return;
            }
            resequence({seqdef: seqdef.innerHTML});
            return;
        }
        if (typeof seqdef == "string" && seqdef) {
            if (seqdef.trim) {
                seqdef = seqdef.trim();
            }
            if (seqdef.indexOf("\n") == -1) {
                if (typeof jQuery != 'undefined') {
                    var jqseqdef = jQuery(seqdef);
                    if (jqseqdef.length == 0) {
                        throw new Error("Not found: " + seqdef);
                    }
                    resequence(jqseqdef);
                } else {
                    if ("#" + seqdef.replace(/[^a-z0-9]/gi, '') == seqdef) {
                        resequence(document.getElementById(seqdef.substr(1, seqdef.length)));
                    } else {
                        throw new Error("DOM element selection independent from jQuery not yet implemented. If a full "
                            + "sequence was given, it cannot be on only one line.");
                    }
                }
                return;
            }

            // finally ...
            debugger;
            seqdef = parseResequenceDefinition(seqdef);
            var description = "";
            for (var cmd in seqdef) {
                if (description.length > 0) description += "\n";
                description += seqdef[cmd].toString();
            }
            debugger;
            processResequence(seqdef, targetEl);
        }
    }

    function addListener(obj, eventName, listener) { //function to add event
        if (obj.addEventListener) {
            obj.addEventListener(eventName, listener, false);
        } else {
            obj.attachEvent("on" + eventName, listener);
        }
    }
    addListener(document, "DOMContentLoaded", resequence);
    if (document.readyState == "complete"
        || document.readyState == "loaded"
        || document.readyState == "interactive") {
        resequence();
    }
    function ResequenceCommand(relativeToThis, element, position, action) {
        this.relative = relativeToThis;
        this.element = element;
        this.position = position;
        this.action = action;
        this.toString = function() {
            var relativeToThisStr = relativeToThis;
            if (typeof relativeToThis == 'object') {
                for (var p in relativeToThis) {
                    relativeToThisStr = "{" + p + ":" + relativeToThis[p] + "}";
                }
            }
            var elementStr = element;
            if (typeof element == 'object') {
                for (var p in element) {
                    elementStr = "{" + p + ":" + element[p] + "}";
                }
            }
            var ret = position + " " + relativeToThisStr + " " + action + " " + elementStr;
            if (ret.trim) ret = ret.trim();
            return ret;
        }
    }
    var POSITIONS = {
        "INSIDEATTOP": "inside-at-top",
        "INSIDE": "inside",
        "CREATEAFTER": "create-after",
        "CREATEINSIDE": "create-inside",
        "CREATEINSIDEATTOP": "create-inside-at-top",
        "HIDE": "near",
        "REMOVE": "near"
    };
    var ACTIONS = {
        "PUT": "put",
        "HIDE": "hide",
        "REMOVE": "remove"
    }

    var insideRegexp = /^(\>)\s*(.+)/;
    var insideTopRegexp = /^(\>\s*\^)\s*(.+)/;
    var createAfterRegexp = /^(\+\+)\s*(.+)/;
    var createInsideRegexp = /^(\>\s*\+\+)\s*(.+)/;
    var createInsideAtTopRegexp = /^(\>\s*\^\s*\+\+)\s*(.+)/;
    var hideRegexp = /^(\-)\s*(.+)/;
    var removeRegexp = /^(\-\s*\-)\s*(.+)/;

    function parseResequenceDefinition(seqdef) {
        if (seqdef.trim) seqdef = seqdef.trim();
        var cmdlines = seqdef.split('\n');
        var cmds = [];
        var previousElement;
        var previousNesting = 0;
        var previousElementOuter;
        for (var l in cmdlines) {
            var line = cmdlines[l];
            var tline = line;
            tline = tline.replace(/\([^)]*\)/g, ''); // remove parenthesis (they're comments)
            if (tline.trim) tline = tline.trim();

            var relativeTo = previousElement,
                element    = {find: tline},
                action     = ACTIONS.PUT,
                position   = "after";

            var nesting = 0;
            if (insideTopRegexp.test(tline)) {
                position = POSITIONS.INSIDEATTOP;
                element = {find: insideTopRegexp.exec(tline)[2]};
                nesting = 1;
            }
            else if (insideRegexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: insideRegexp.exec(tline)[2]};
                nesting = 1;
            }
            else if (createAfterRegexp.test(tline)) {
                position = POSITIONS.CREATEAFTER;
                element = {create: createAfterRegexp.exec(tline)[2]};
            }
            else if (createInsideRegexp.test(tline)) {
                position = POSITIONS.CREATEINSIDE;
                element = {create: createInsideRegexp.exec(tline)[2]};
                nesting = 1;
            }
            else if (createInsideAtTopRegexp.test(tline)) {
                position = POSITIONS.CREATEINSIDEATTOP;
                element = {create: createInsideAtTopRegexp.exec(tline)[2]};
                nesting = 1;
            }
            else if (removeRegexp.test(tline)) {
                position = POSITIONS.REMOVE;
                element = {find: removeRegexp.exec(tline)[2]};
                action = ACTIONS.REMOVE;
                nesting = 1;
            }
            else if (hideRegexp.test(tline)) {
                position = POSITIONS.HIDE;
                element = {find: hideRegexp.exec(tline)[2]};
                action = ACTIONS.HIDE;
                nesting = 1;
            }

            if (previousNesting > nesting || (nesting == previousNesting && nesting > 0)) {
                relativeTo = previousElementOuter;
            }
            if (nesting > previousNesting) {
                previousElementOuter = previousElement;
            }
            cmds.push(new ResequenceCommand(relativeTo, element, position, action));
            previousElement = element;
            previousNesting = nesting;
        }
        return cmds;
    }
    function processResequence(seqdef) {

    }
}());