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
            var seqdefstr = seqdef;
            seqdef = parseResequenceDefinition(seqdef);
            var description = "";
            for (var cmd in seqdef) {
                if (description.length > 0) description += "\n";
                description += seqdef[cmd].toString();
            }

            // all the following in this function due to non-implementation
            $('body').css('margin', '10px');
            $('pre#input-RO').html(seqdefstr.replace(/\</g, '&lt;'));
            $('pre#output').html(description.replace(/\</g, '&lt;'));
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
            if (relativeToThisStr === undefined) {
                if (action == "append") action = "prepend";
                ret = "at the top of the body, " + action + " " + elementStr;
            }
            if (ret.trim) ret = ret.trim();
            return ret;
        }
    }
    var POSITIONS = {
        "INSIDE": "inside",
        "AFTER": "after",
        "NEAR": "near"
    };
    var ACTIONS = {
        "APPEND": "append",
        "PREPEND": "prepend",
        "PREPENDCREATE": "prepend-create",
        "CREATE": "create",
        "HIDE": "hide",
        "REMOVE": "remove"
    }

    var createInsideAtTopL3Regexp = /^(\>\s*\>\s*\+\+\s*\^)\s*(.+)/;
    var createInsideL3Regexp = /^(\>\s*\>\s*\+\+)\s*(.+)/;
    var inside2Regexp = /^(\>\s*\>)\s*(.+)/;
    var insideTop2Regexp = /^(\>\s*\>\s*\^)\s*(.+)/;
    var hide3Regexp = /^(\>\s*\>\s*\-)\s*(.+)/;
    var remove3Regexp = /^(\>\s*\>\s*\-\s*\-)\s*(.+)/;
    var hide2Regexp = /^(\>\s*\-)\s*(.+)/;
    var remove2Regexp = /^(\>\s*\-\s*\-)\s*(.+)/;
    var insideRegexp = /^(\>)\s*(.+)/;
    var insideTopRegexp = /^(\>\s*\^)\s*(.+)/;
    var createAfterRegexp = /^(\+\+)\s*(.+)/;
    var createInsideRegexp = /^(\>\s*\+\+)\s*(.+)/;
    var createInsideAtTopRegexp = /^(\>\s*\+\+\s\^)\s*(.+)/;
    var hideRegexp = /^(\-)\s*(.+)/;
    var removeRegexp = /^(\-\s*\-)\s*(.+)/;

    function parseResequenceDefinition(seqdef) {
        if (seqdef.trim) seqdef = seqdef.trim();
        var cmdlines = seqdef.split('\n');
        var cmds = [];
        var previousElement;
        var previousNesting = 0;
        var outerElements = [];
        var previousElementOuter;
        for (var l in cmdlines) {
            var line = cmdlines[l];
            var tline = line;
            tline = tline.replace(/\([^)]*\)/g, ''); // remove parenthesis (they're comments)
            if (tline.trim) tline = tline.trim();

            var relativeTo = previousElement,
                element    = {find: tline},
                action     = ACTIONS.APPEND,
                position   = POSITIONS.AFTER;

            var nesting = 0;

            if (createInsideAtTopL3Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {create: createInsideAtTopL3Regexp.exec(tline)[2]};
                action = ACTIONS.PREPENDCREATE;
                nesting = 3;
            }
            else if (createInsideL3Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {create: createInsideL3Regexp.exec(tline)[2]};
                action = ACTIONS.CREATE;
                nesting = 3;
            }
            else if (inside2Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: inside2Regexp.exec(tline)[2]};
                nesting = 2;
            }
            else if (insideTop2Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: insideTop2Regexp.exec(tline)[2]};
                action = ACTIONS.PREPEND;
                nesting = 2;
            }
            else if (remove3Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: remove3Regexp.exec(tline)[2]};
                action = ACTIONS.REMOVE;
                nesting = 2;
            }
            else if (hide3Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: hide3Regexp.exec(tline)[2]};
                action = ACTIONS.HIDE;
                nesting = 2;
            }
            else if (inside2Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: inside2Regexp.exec(tline)[2]};
                nesting = 2;
            }
            else if (remove2Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: remove2Regexp.exec(tline)[2]};
                action = ACTIONS.REMOVE;
                nesting = 1;
            }
            else if (hide2Regexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: hide2Regexp.exec(tline)[2]};
                action = ACTIONS.HIDE;
                nesting = 1;
            }
            else if (createInsideAtTopRegexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {create: createInsideAtTopRegexp.exec(tline)[2]};
                action = ACTIONS.PREPENDCREATE;
                nesting = 1;
            }
            else if (createInsideRegexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {create: createInsideRegexp.exec(tline)[2]};
                action = ACTIONS.CREATE;
                nesting = 1;
            }
            else if (insideTopRegexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: insideTopRegexp.exec(tline)[2]};
                action = ACTIONS.PREPEND;
                nesting = 2;
            }
            else if (insideRegexp.test(tline)) {
                position = POSITIONS.INSIDE;
                element = {find: insideRegexp.exec(tline)[2]};
                nesting = 1;
            }
            else if (createAfterRegexp.test(tline)) {
                position = POSITIONS.AFTER;
                element = {create: createAfterRegexp.exec(tline)[2]};
                action = ACTIONS.CREATE;
            }
            else if (removeRegexp.test(tline)) {
                position = POSITIONS.NEAR;
                element = {find: removeRegexp.exec(tline)[2]};
                action = ACTIONS.REMOVE;
                nesting = 0;
            }
            else if (hideRegexp.test(tline)) {
                position = POSITIONS.NEAR;
                element = {find: hideRegexp.exec(tline)[2]};
                action = ACTIONS.HIDE;
                nesting = 0;
            }

            for (var i = nesting; i < previousNesting; i++) {
                outerElements.pop();
            }
            if (previousNesting > nesting || (nesting == previousNesting && nesting > 0)) {
                relativeTo = outerElements[outerElements.length - 1] || previousElementOuter;
            }
            if (nesting > previousNesting) {
                if (nesting == 1) previousElementOuter = previousElement;
                outerElements.push(previousElement);
            }
            cmds.push(new ResequenceCommand(relativeTo, element, position, action));
            if (action != ACTIONS.REMOVE) {
                previousElement = element;
                previousNesting = nesting;
            }
        }
        return cmds;
    }
    function processResequence(seqdef) {

    }
}());