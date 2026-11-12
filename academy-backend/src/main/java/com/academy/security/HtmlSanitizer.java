package com.academy.security;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

/**
 * Cleans instructor-authored rich text (course descriptions, lesson content)
 * before it is stored, so it can never carry script into other users' browsers.
 *
 * Keeps ordinary formatting produced by the editor (headings, lists, links,
 * images, tables, inline styles) and the lesson "embedded PDF" marker
 * ({@code <div class="sl-pdf-embed" data-pdf-url="…">}). Removes script,
 * iframes, event handlers (onerror, onclick…) and javascript: URLs.
 */
public final class HtmlSanitizer {

    private static final Safelist SAFELIST = Safelist.relaxed()
            .addTags("span", "div", "hr", "font", "s", "strike", "mark", "small")
            .addAttributes(":all", "style", "class", "dir", "align")
            .addAttributes("div", "data-pdf-url", "contenteditable")
            .addAttributes("a", "target", "rel")
            .addAttributes("font", "color", "size", "face")
            .addProtocols("a", "href", "http", "https", "mailto", "tel")
            .addProtocols("img", "src", "http", "https", "data")
            .preserveRelativeLinks(true);

    private static final Document.OutputSettings OUTPUT =
            new Document.OutputSettings().prettyPrint(false);

    private HtmlSanitizer() {}

    /** Returns safe HTML, or the input unchanged when it is null/blank. */
    public static String clean(String html) {
        if (html == null || html.isBlank()) return html;
        return Jsoup.clean(html, "http://localhost/", SAFELIST, OUTPUT);
    }
}
