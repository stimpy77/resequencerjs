resequencerjs
=============

Restructures HTML DOM according to a very simple sequence outline.

This is an unfinished, non-functioning work in progress. But the idea is simple.

The `<body>` tag should have a data-resequence attribute pointing to a `script type="text/plain"` element by ID with a
'#' prefix (or a data-resequence-src attribute pointing to a source file).

The referenced element might look something like this:

    <script id="resequence_definition" type="text/plain">
        nav
        div#moar_leftnav
        content
            > article
            > ^ header (precedes article content)
            > div#stuff
        ++ <div>Insert this content</div>
        ++ <div src="inject.htm">(the contents herein will be replaced by inject.htm)</div>
        footer
        - hidden_stuff (hide)
        -- unwanted (delete entirely)
    </script>

How the above should read:

    <script type="text/plain">
        at the top of body put {find:nav}
        after {find:nav} put {find:div#moar_leftnav}
        after {find:div#moar_leftnav} put {find:content}
        inside {find:content} put {find:article}
        inside-at-top {find:content} put {find:header}
        inside {find:content} put {find:div#stuff}
        create-after {find:content} put {create:<div>Insert this content</div>}
        create-after {create:<div>Insert this content</div>} put {create:<div src="inject.htm"></div>}
        after {create:<div src="inject.htm"></div>} put {find:footer}
        near {find:footer} hide {find:hidden_stuff}
        near {find:footer} remove {find:unwanted}
    </script>

And actually the above output is the current status of this script's work in progress; the commands are parsed out.

### Why? ###

The goal is to be able to produce a single definition of view markup, one that is SEO friendly and easy to maintain,
while a template designer might want to go in and restructure everything. This script enables the designer to
restructure the layout without directly changing the original view markup.

### Rules ###

The rules are very simple:

1. Line items without an outliner token (`>`, `++`, etc) are assumed to be CSS selectors.
1. `>` = append inside
1. `> ^` = prepend inside ("inside-at-top")
1. `++` = inject new markup
1. `-` = hide
1. `--` = remove
1. You only need to nest one level deep. If you need to nest deeper then either the base definition is too complex or
   ur doing it rong.
1. You don't need more features. If you need more features ur doing it rong.