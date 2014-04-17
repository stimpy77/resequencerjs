Resequencer
=============

Restructures HTML DOM according to a very simple sequence outline.

This is an unfinished, non-functioning work in progress. But the idea is simple.

The `<body>` tag should have a `data-resequence-src` attribute pointing to a source file, or else a `<script type="text/resequence>` block with the same content should otherwise be on the page.

The referenced element might look something like this:

    <script id="resequence_definition" type="text/resequence">
        nav
        div#moar_leftnav
        .content
            > article
            > > .article-body, .articleBody, .article-content, .articleContent
            > > ++ <div id="nested_created"></div> (inject into article)
            > ^ heading (precedes article content .. gotcha!)
            > div#stuff
            > ++ ^ <div id="nested_created"></div> (inject and put at top of content)
            > -- .delete-me (from within content only)
            > - .hide-me (within content)
        ++ <div>Insert this content</div>
        ++ <div src="inject.htm">(the contents herein will be replaced by inject.htm)</div>
        footer
        -- .unwanted (delete entirely)
        - .hidden_stuff (hide)
    </script>

The above is what would actually be written by the designer. How the above should be understood in pseudo-code as
interpreted by the Resequencer might look something like this:

    at the top of the body, prepend {find:nav}
    after {find:nav} append {find:div#moar_leftnav}
    after {find:div#moar_leftnav} append {find:.content}
    inside {find:.content} append {find:article}
    inside {find:article} append {find:.article-body, .articleBody, .article-content, .articleContent}
    inside {find:.article-body, .articleBody, .article-content, .articleContent} create {create:<div id="nested_created"></div>}
    inside {find:article} prepend {find:heading}
    inside {find:.content} append {find:div#stuff}
    inside {find:.content} prepend-create {create:<div id="nested_created"></div>}
    inside {find:.content} remove {find:.delete-me}
    inside {find:.content} hide {find:.hide-me}
    after {find:.content} create {create:<div>Insert this content</div>}
    after {create:<div>Insert this content</div>} create {create:<div src="inject.htm"></div>}
    after {create:<div src="inject.htm"></div>} append {find:footer}
    near {find:footer} remove {find:.unwanted}
    near {find:footer} hide {find:.hidden_stuff}

And actually the above output is the current status of this script's work in progress; the commands are only parsed out
but not yet executing. The easy part of using jQuery to put stuff in place is still pending implementation as I'm
simultaneously seeking design feedback.

### Why? ###

The goal is to be able to produce a single definition of view markup, one that is SEO friendly and easy to maintain,
while a template designer might want to go in and restructure everything. This script enables the designer to
restructure the layout without directly changing the original view markup.

### Rules ###

The rules are very simple:

1. Line items after their prefixing outliner token (`>`, `++`, etc) are assumed to be CSS selectors.
1. `>` = append inside
1. `> ^` = prepend inside (or "inside-at-top")
1. `++` = add new markup ("create")
1. `++ ^` = add new markup that prepends all siblings ("create-at-top")
1. `> ++` = inject new markup ("create-inside")
1. `> ++ ^` = inject new markup and prepend all children ("create-inside-at-top")
1. `-` = hide
1. `--` = remove
1. `( .. )` = not boobies. comments.
1. You only need to nest a couple levels deep. If you need to nest deeper then either the base definition is too complex or
   ur doing it rong.
1. Srsly though if you want to work with things multiple levels deep, you must work with the deeper level stuff
   at the top level, then shift them down into their containers using the outline.
1. You don't need more features. If you need more features ur doing it rong.
