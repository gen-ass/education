//jquery.pajinate.min.js
;
(function ($) { /*******************************************************************************************/
    // jquery.pajinate.js - version 0.4
    // A jQuery plugin for paginating through any number of DOM elements
    // 
    // Copyright (c) 2010, Wes Nolte (http://wesnolte.com)
    // Licensed under the MIT License (MIT-LICENSE.txt)
    // http://www.opensource.org/licenses/mit-license.php
    // Created: 2010-04-16 | Updated: 2010-04-26
    //
    /*******************************************************************************************/

    $.fn.pajinate = function (options) {
        // Set some state information
        var current_page = 'current_page';
        var items_per_page = 'items_per_page';

        var meta;

        // Setup default option values
        var defaults = {
            item_container_id: '.ul-view',
            items_per_page: 10,
            nav_panel_id: '.page_navigation',
            nav_info_id: '.info_text',
            num_page_links_to_display: 20,
            start_page: 0,
            wrap_around: false,
            nav_label_first: 'First',
            nav_label_prev: 'Prev',
            nav_label_next: 'Next',
            nav_label_last: 'Last',
            nav_order: ["first", "prev", "num", "next", "last"],
            nav_label_info: 'Showing {0}-{1} of {2} results',
            show_first_last: true,
            abort_on_small_lists: false,
            jquery_ui: false,
            jquery_ui_active: "ui-state-highlight",
            jquery_ui_default: "ui-state-default",
            jquery_ui_disabled: "ui-state-disabled"
        };

        var options = $.extend(defaults, options);
        var $item_container;
        var $page_container;
        var $items;
        var $nav_panels;
        var total_page_no_links;
        var jquery_ui_default_class = options.jquery_ui ? options.jquery_ui_default : '';
        var jquery_ui_active_class = options.jquery_ui ? options.jquery_ui_active : '';
        var jquery_ui_disabled_class = options.jquery_ui ? options.jquery_ui_disabled : '';

        return this.each(function () {
            $page_container = $(this);
            $item_container = $(this).find(options.item_container_id);
            $items = $page_container.find(options.item_container_id).children();

            if (options.abort_on_small_lists && options.items_per_page >= $items.size()) return $page_container;

            meta = $page_container;

            // Initialize meta data
            meta.data(current_page, 0);
            meta.data(items_per_page, options.items_per_page);

            // Get the total number of items
            var total_items = $item_container.children().size();

            // Calculate the number of pages needed
            var number_of_pages = Math.ceil(total_items / options.items_per_page);

            // Construct the nav bar
            var more = '<span class="ellipse more">...</span>';
            var less = '<span class="ellipse less">...</span>';
            var first = !options.show_first_last ? '' : '<a class="first_link ' + jquery_ui_default_class + '" href="">' + options.nav_label_first + '</a>';
            var last = !options.show_first_last ? '' : '<a class="last_link ' + jquery_ui_default_class + '" href="">' + options.nav_label_last + '</a>';

            var navigation_html = "";

            for (var i = 0; i < options.nav_order.length; i++) {
                switch (options.nav_order[i]) {
                    case "first":
                        navigation_html += first;
                        break;
                    case "last":
                        navigation_html += last;
                        break;
                    case "next":
                        navigation_html += '<a class="next_link ' + jquery_ui_default_class + '" href="">' + options.nav_label_next + '</a>';
                        break;
                    case "prev":
                        navigation_html += '<a class="previous_link ' + jquery_ui_default_class + '" href="">' + options.nav_label_prev + '</a>';
                        break;
                    case "num":
                        navigation_html += less;
                        var current_link = 0;
                        while (number_of_pages > current_link) {
                            navigation_html += '<a class="page_link ' + jquery_ui_default_class + '" href="" longdesc="' + current_link + '">' + (current_link + 1) + '</a>';
                            current_link++;
                        }
                        navigation_html += more;
                        break;
                    default:
                        break;
                }

            }

            // And add it to the appropriate area of the DOM	
            $nav_panels = $page_container.find(options.nav_panel_id);
            $nav_panels.html(navigation_html).each(function () {

                $(this).find('.page_link:first').addClass('first');
                $(this).find('.page_link:last').addClass('last');

            });

            // Hide the more/less indicators
            $nav_panels.children('.ellipse').hide();

            // Set the active page link styling
            $nav_panels.find('.previous_link').next().next().addClass('active_page ' + jquery_ui_active_class);

            /* Setup Page Display */
            // And hide all pages
            $items.hide();
            // Show the first page			
            $items.slice(0, meta.data(items_per_page)).show();

            /* Setup Nav Menu Display */
            // Page number slices
            total_page_no_links = $page_container.children(options.nav_panel_id + ':first').children('.page_link').size();
            options.num_page_links_to_display = Math.min(options.num_page_links_to_display, total_page_no_links);

            $nav_panels.children('.page_link').hide(); // Hide all the page links
            // And only show the number we should be seeing
            $nav_panels.each(function () {
                $(this).children('.page_link').slice(0, options.num_page_links_to_display).show();
            });

            /* Bind the actions to their respective links */

            // Event handler for 'First' link
            $page_container.find('.first_link').click(function (e) {
                e.preventDefault();

                movePageNumbersRight($(this), 0);
                gotopage(0);
            });

            // Event handler for 'Last' link
            $page_container.find('.last_link').click(function (e) {
                e.preventDefault();
                var lastPage = total_page_no_links - 1;
                movePageNumbersLeft($(this), lastPage);
                gotopage(lastPage);
            });

            // Event handler for 'Prev' link
            $page_container.find('.previous_link').click(function (e) {
                e.preventDefault();
                showPrevPage($(this));
            });


            // Event handler for 'Next' link
            $page_container.find('.next_link').click(function (e) {
                e.preventDefault();
                showNextPage($(this));
            });

            // Event handler for each 'Page' link
            $page_container.find('.page_link').click(function (e) {
                e.preventDefault();
                gotopage($(this).attr('longdesc'));
            });

            // Goto the required page
            gotopage(parseInt(options.start_page));
            toggleMoreLess();
            if (!options.wrap_around) tagNextPrev();
        });

        function showPrevPage(e) {
            new_page = parseInt(meta.data(current_page)) - 1;

            // Check that we aren't on a boundary link
            if ($(e).siblings('.active_page').prev('.page_link').length == true) {
                movePageNumbersRight(e, new_page);
                gotopage(new_page);
            }
            else if (options.wrap_around) {
                gotopage(total_page_no_links - 1);
            }

        };

        function showNextPage(e) {
            new_page = parseInt(meta.data(current_page)) + 1;

            // Check that we aren't on a boundary link
            if ($(e).siblings('.active_page').next('.page_link').length == true) {
                movePageNumbersLeft(e, new_page);
                gotopage(new_page);
            }
            else if (options.wrap_around) {
                gotopage(0);
            }

        };

        function gotopage(page_num) {

            var ipp = parseInt(meta.data(items_per_page));

            // Find the start of the next slice
            start_from = page_num * ipp;

            // Find the end of the next slice
            end_on = start_from + ipp;
            // Hide the current page	
            var items = $items.hide().slice(start_from, end_on);

            items.show();

            // Reassign the active class
            $page_container.find(options.nav_panel_id).children('.page_link[longdesc=' + page_num + ']').addClass('active_page ' + jquery_ui_active_class).siblings('.active_page').removeClass('active_page ' + jquery_ui_active_class);

            // Set the current page meta data							
            meta.data(current_page, page_num);

            $page_container.find(options.nav_info_id).html(options.nav_label_info.replace("{0}", start_from + 1).
			replace("{1}", start_from + items.length).replace("{2}", $items.length));

            // Hide the more and/or less indicators
            toggleMoreLess();

            // Add a class to the next or prev links if there are no more pages next or previous to the active page
            tagNextPrev();
        }

        // Methods to shift the diplayed index of page numbers to the left or right


        function movePageNumbersLeft(e, new_p) {
            var new_page = new_p;

            var $current_active_link = $(e).siblings('.active_page');

            if ($current_active_link.siblings('.page_link[longdesc=' + new_page + ']').css('display') == 'none') {

                $nav_panels.each(function () {
                    $(this).children('.page_link').hide() // Hide all the page links
					.slice(parseInt(new_page - options.num_page_links_to_display + 1), new_page + 1).show();
                });
            }

        }

        function movePageNumbersRight(e, new_p) {
            var new_page = new_p;

            var $current_active_link = $(e).siblings('.active_page');

            if ($current_active_link.siblings('.page_link[longdesc=' + new_page + ']').css('display') == 'none') {

                $nav_panels.each(function () {
                    $(this).children('.page_link').hide() // Hide all the page links
					.slice(new_page, new_page + parseInt(options.num_page_links_to_display)).show();
                });
            }
        }

        // Show or remove the ellipses that indicate that more page numbers exist in the page index than are currently shown


        function toggleMoreLess() {

            if (!$nav_panels.children('.page_link:visible').hasClass('last')) {
                $nav_panels.children('.more').show();
            }
            else {
                $nav_panels.children('.more').hide();
            }

            if (!$nav_panels.children('.page_link:visible').hasClass('first')) {
                $nav_panels.children('.less').show();
            }
            else {
                $nav_panels.children('.less').hide();
            }
        }

        /* Add the style class ".no_more" to the first/prev and last/next links to allow custom styling */

        function tagNextPrev() {
            if ($nav_panels.children('.last').hasClass('active_page')) {
                $nav_panels.children('.next_link').add('.last_link').addClass('no_more ' + jquery_ui_disabled_class);
            }
            else {
                $nav_panels.children('.next_link').add('.last_link').removeClass('no_more ' + jquery_ui_disabled_class);
            }

            if ($nav_panels.children('.first').hasClass('active_page')) {
                $nav_panels.children('.previous_link').add('.first_link').addClass('no_more ' + jquery_ui_disabled_class);
            }
            else {
                $nav_panels.children('.previous_link').add('.first_link').removeClass('no_more ' + jquery_ui_disabled_class);
            }
        }

    };

})(jQuery);
//jquery.maskedinput.min.js
(function (a) { function c(a, b) { if (a.setSelectionRange) { a.focus(); a.setSelectionRange(b, b) } else if (a.createTextRange) { var c = a.createTextRange(); c.collapse(true); c.moveEnd("character", b); c.moveStart("character", b); c.select() } } function b(a) { var b = { begin: 0, end: 0 }; if (a.setSelectionRange) { b.begin = a.selectionStart; b.end = a.selectionEnd } else if (document.selection && document.selection.createRange) { var c = document.selection.createRange(); b.begin = 0 - c.duplicate().moveStart("character", -1e5); b.end = b.begin + c.text.length } return b } var d = { 9: "[0-9]", a: "[A-Za-z]", "*": "[A-Za-z0-9]" }; a.mask = { addPlaceholder: function (a, b) { d[a] = b } }; a.fn.unmask = function () { return this.trigger("unmask") }; a.fn.mask = function (e, f) { f = a.extend({ placeholder: "_", completed: null }, f); var g = "^"; for (var h = 0; h < e.length; h++) g += d[e.charAt(h)] || "\\" + e.charAt(h); g += "$"; var i = new RegExp(g); return this.each(function () { function r() { var a = g.val(); var b = 0; for (var c = 0; c < e.length; c++) { if (!j[c]) { while (b++ < a.length) { var f = new RegExp(d[e.charAt(c)]); if (a.charAt(b - 1).match(f)) { h[c] = a.charAt(b - 1); break } } } } var k = q(); if (!k.match(i)) { g.val(""); p(0, e.length) } } function q(a) { var b = ""; for (var c = 0; c < e.length; c++) { b += h[c]; if (c == a) b += f.placeholder } g.val(b); return b } function p(a, b) { for (var c = a; c < b; c++) { if (!j[c]) h[c] = f.placeholder } } function o(a) { if (m) { m = false; return } a = a || window.event; var i = a.charCode || a.keyCode || a.which; var k = b(this); var l = k.begin; if (a.ctrlKey || a.altKey) { return true } else if (i >= 41 && i <= 122 || i == 32 || i > 186) { while (k.begin < e.length) { var n = d[e.charAt(k.begin)]; var o; if (n) { var p = new RegExp(n); o = String.fromCharCode(i).match(p) } else { k.begin += 1; k.end = k.begin; l += 1; continue } if (o) h[k.begin] = String.fromCharCode(i); else return false; while (++l < e.length) { if (!j[l]) break } break } } else return false; q(); if (f.completed && l >= h.length) f.completed.call(g); else c(this, l); return false } function n(d) { var g = b(this); var i = d.keyCode; m = i < 16 || i > 16 && i < 32 || i > 32 && i < 41; if (g.begin - g.end != 0 && (!m || i == 8 || i == 46)) { p(g.begin, g.end) } if (i == 8) { while (g.begin-- >= 0) { if (!j[g.begin]) { h[g.begin] = f.placeholder; if (a.browser.opera) { q(g.begin); c(this, g.begin + 1) } else { q(); c(this, g.begin) } return false } } } else if (i == 46) { p(g.begin, g.begin + 1); q(); c(this, g.begin); return false } else if (i == 27) { p(0, e.length); q(); c(this, 0); return false } } function l() { r(); q(); setTimeout(function () { c(g[0], 0) }, 0) } var g = a(this); var h = new Array(e.length); var j = new Array(e.length); for (var k = 0; k < e.length; k++) { j[k] = d[e.charAt(k)] == null; h[k] = j[k] ? e.charAt(k) : f.placeholder } g.bind("focus", l); g.bind("blur", r); if (a.browser.msie) this.onpaste = function () { setTimeout(r, 0) }; else if (a.browser.mozilla) this.addEventListener("input", r, false); var m = false; g.bind("keydown", n); g.bind("keypress", o); g.one("unmask", function () { g.unbind("focus", l); g.unbind("blur", r); g.unbind("keydown", n); g.unbind("keypress", o); if (a.browser.msie) this.onpaste = null; else if (a.browser.mozilla) this.removeEventListener("input", r, false) }) }) } })(jQuery);
//jquery.watermark.min.js
/*
	Watermark v3.1.3 (March 22, 2011) plugin for jQuery
	http://jquery-watermark.googlecode.com/
	Copyright (c) 2009-2011 Todd Northrop
	http://www.speednet.biz/
	Dual licensed under the MIT or GPL Version 2 licenses.
*/
(function(a,h,y){var w="function",v="password",j="maxLength",n="type",b="",c=true,u="placeholder",i=false,t="watermark",g=t,f="watermarkClass",q="watermarkFocus",l="watermarkSubmit",o="watermarkMaxLength",e="watermarkPassword",d="watermarkText",k=/\r/g,s="input:data("+g+"),textarea:data("+g+")",m="input:text,input:password,input[type=search],input:not([type]),textarea",p=["Page_ClientValidate"],r=i,x=u in document.createElement("input");a.watermark=a.watermark||{version:"3.1.3",runOnce:c,options:{className:t,useNative:c,hideBeforeUnload:c},hide:function(b){a(b).filter(s).each(function(){a.watermark._hide(a(this))})},_hide:function(a,r){var p=a[0],q=(p.value||b).replace(k,b),l=a.data(d)||b,m=a.data(o)||0,i=a.data(f);if(l.length&&q==l){p.value=b;if(a.data(e))if((a.attr(n)||b)==="text"){var g=a.data(e)||[],c=a.parent()||[];if(g.length&&c.length){c[0].removeChild(a[0]);c[0].appendChild(g[0]);a=g}}if(m){a.attr(j,m);a.removeData(o)}if(r){a.attr("autocomplete","off");h.setTimeout(function(){a.select()},1)}}i&&a.removeClass(i)},show:function(b){a(b).filter(s).each(function(){a.watermark._show(a(this))})},_show:function(g){var p=g[0],u=(p.value||b).replace(k,b),h=g.data(d)||b,s=g.attr(n)||b,t=g.data(f);if((u.length==0||u==h)&&!g.data(q)){r=c;if(g.data(e))if(s===v){var m=g.data(e)||[],l=g.parent()||[];if(m.length&&l.length){l[0].removeChild(g[0]);l[0].appendChild(m[0]);g=m;g.attr(j,h.length);p=g[0]}}if(s==="text"||s==="search"){var i=g.attr(j)||0;if(i>0&&h.length>i){g.data(o,i);g.attr(j,h.length)}}t&&g.addClass(t);p.value=h}else a.watermark._hide(g)},hideAll:function(){if(r){a.watermark.hide(m);r=i}},showAll:function(){a.watermark.show(m)}};a.fn.watermark=a.fn.watermark||function(p,o){var t="string";if(!this.length)return this;var s=i,r=typeof p===t;if(r)p=p.replace(k,b);if(typeof o==="object"){s=typeof o.className===t;o=a.extend({},a.watermark.options,o)}else if(typeof o===t){s=c;o=a.extend({},a.watermark.options,{className:o})}else o=a.watermark.options;if(typeof o.useNative!==w)o.useNative=o.useNative?function(){return c}:function(){return i};return this.each(function(){var B="dragleave",A="dragenter",z=this,i=a(z);if(!i.is(m))return;if(i.data(g)){if(r||s){a.watermark._hide(i);r&&i.data(d,p);s&&i.data(f,o.className)}}else{if(x&&o.useNative.call(z,i)&&(i.attr("tagName")||b)!=="TEXTAREA"){r&&i.attr(u,p);return}i.data(d,r?p:b);i.data(f,o.className);i.data(g,1);if((i.attr(n)||b)===v){var C=i.wrap("<span>").parent(),t=a(C.html().replace(/type=["']?password["']?/i,'type="text"'));t.data(d,i.data(d));t.data(f,i.data(f));t.data(g,1);t.attr(j,p.length);t.focus(function(){a.watermark._hide(t,c)}).bind(A,function(){a.watermark._hide(t)}).bind("dragend",function(){h.setTimeout(function(){t.blur()},1)});i.blur(function(){a.watermark._show(i)}).bind(B,function(){a.watermark._show(i)});t.data(e,i);i.data(e,t)}else i.focus(function(){i.data(q,1);a.watermark._hide(i,c)}).blur(function(){i.data(q,0);a.watermark._show(i)}).bind(A,function(){a.watermark._hide(i)}).bind(B,function(){a.watermark._show(i)}).bind("dragend",function(){h.setTimeout(function(){a.watermark._show(i)},1)}).bind("drop",function(e){var c=i[0],a=e.originalEvent.dataTransfer.getData("Text");if((c.value||b).replace(k,b).replace(a,b)===i.data(d))c.value=a;i.focus()});if(z.form){var w=z.form,y=a(w);if(!y.data(l)){y.submit(a.watermark.hideAll);if(w.submit){y.data(l,w.submit);w.submit=function(c,b){return function(){var d=b.data(l);a.watermark.hideAll();if(d.apply)d.apply(c,Array.prototype.slice.call(arguments));else d()}}(w,y)}else{y.data(l,1);w.submit=function(b){return function(){a.watermark.hideAll();delete b.submit;b.submit()}}(w)}}}}a.watermark._show(i)})};if(a.watermark.runOnce){a.watermark.runOnce=i;a.extend(a.expr[":"],{data:function(c,d,b){return!!a.data(c,b[3])}});(function(c){a.fn.val=function(){var e=this;if(!e.length)return arguments.length?e:y;if(!arguments.length)if(e.data(g)){var f=(e[0].value||b).replace(k,b);return f===(e.data(d)||b)?b:f}else return c.apply(e,arguments);else{c.apply(e,arguments);a.watermark.show(e);return e}}})(a.fn.val);p.length&&a(function(){for(var b,c,d=p.length-1;d>=0;d--){b=p[d];c=h[b];if(typeof c===w)h[b]=function(b){return function(){a.watermark.hideAll();return b.apply(null,Array.prototype.slice.call(arguments))}}(c)}});a(h).bind("beforeunload",function(){a.watermark.options.hideBeforeUnload&&a.watermark.hideAll()})}})(jQuery,window);
//jquery.lightbox.min.js
(function ($) {

    var uagent = (navigator && navigator.userAgent) ? navigator.userAgent.toLowerCase() : "";
    var is_ie6 = ($.browser.msie && parseInt($.browser.version, 10) < 7 && parseInt($.browser.version, 10) > 4);
    var is_smartphone = false;

    // detect android;
    if (uagent.search("mobile") > -1) {
        if (uagent.search("android") > -1 || uagent.search("googletv") > -1 || uagent.search("htc_flyer") > -1) {
            is_smartphone = true;
        }
    };

    // detect opera mini and mobile;
    if (uagent.search("opera") > -1) {
        if (uagent.search("mini") > -1 && uagent.search("mobi") > -1) {
            is_smartphone = true;
        }
    };

    // detect iOS;
    if (uagent.search("iphone") > -1 || uagent.search("ipad") > -1) {
        is_smartphone = true;
    };

    // detect windows 7 phones;
    if (uagent.search("windows phone os 7") > -1) {
        is_smartphone = true;
    };

    // for jQuery 1.3;
    if ($.proxy === undefined) {
        $.extend({
            proxy: function (fn, thisObject) {
                if (fn) {
                    proxy = function () { return fn.apply(thisObject || this, arguments); };
                };
                return proxy;
            }
        });
    };

    // for jQuery 1.3;
    $.extend($.fx.prototype, {
        update: function () {
            if (this.options.step) {
                this.options.step.call(this.elem, this.now, this);
            }

            (jQuery.fx.step[this.prop] || jQuery.fx.step._default)(this);
        }
    });

    // jQuery Easing v1.3;
    $.extend($.easing, {
        easeOutBack: function (x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        }
    });

    $.extend({
        LightBoxObject: {
            defaults: {
                name: 'jquery-lightbox',
                zIndex: 7000,
                width: 470,
                height: 280,
                background: '#FFFFFF',
                modal: false,
                overlay: {
                    'opacity': 0.6
                },
                showDuration: 400,
                closeDuration: 200,
                moveDuration: 800,
                resizeDuration: 800,
                showTransition: 'easeOutBack',
                closeTransition: 'easeOutBack',
                moveTransition: 'easeOutBack',
                resizeTransition: 'easeOutBack',
                shake: {
                    'distance': 10,
                    'duration': 100,
                    'transition': 'easeOutBack',
                    'loops': 2
                },
                flash: {
                    'width': 640,
                    'height': 360
                },
                maps: {
                    'width': 640,
                    'height': 360
                },
                emergefrom: 'top'
            },
            options: {},
            animations: {},
            gallery: {},
            image: {},
            esqueleto: {
                lightbox: [],
                buttons: {
                    close: [],
                    prev: [],
                    max: [],
                    next: []
                },
                background: [],
                image: [],
                title: [],
                html: []
            },
            visible: false,
            maximized: false,
            mode: 'image',
            videoregs: {
                swf: {
                    reg: /[^\.]\.(swf)\s*$/i
                },
                youtube: {
                    reg: /youtube\.com\/watch/i,
                    split: '=',
                    index: 1,
                    iframe: 1,
                    url: "http://www.youtube.com/embed/%id%?autoplay=1&amp;fs=1&amp;rel=0&amp;modestbranding=1&amp;enablejsapi=1"
                },
                metacafe: {
                    reg: /metacafe\.com\/watch/i,
                    split: '/',
                    index: 4,
                    url: "http://www.metacafe.com/fplayer/%id%/.swf?playerVars=autoPlay=yes"
                },
                dailymotion: {
                    reg: /dailymotion\.com\/video/i,
                    split: '/',
                    index: 4,
                    url: "http://www.dailymotion.com/swf/video/%id%?additionalInfos=0&amp;autoStart=1"
                },
                google: {
                    reg: /google\.com\/videoplay/i,
                    split: '=',
                    index: 1,
                    url: "http://video.google.com/googleplayer.swf?autoplay=1&amp;hl=en&amp;docId=%id%"
                },
                vimeo: {
                    reg: /vimeo\.com/i,
                    split: '/',
                    index: 3,
                    iframe: 1,
                    url: "http://player.vimeo.com/video/%id%?hd=1&amp;autoplay=1&amp;show_title=1&amp;show_byline=1&amp;show_portrait=0&amp;color=&amp;fullscreen=1"
                },
                gametrailers: {
                    reg: /gametrailers.com/i,
                    split: '/',
                    index: 5,
                    url: "http://www.gametrailers.com/remote_wrap.php?mid=%id%"
                },
                collegehumornew: {
                    reg: /collegehumor.com\/video\//i,
                    split: 'video/',
                    index: 1,
                    url: "http://www.collegehumor.com/moogaloop/moogaloop.jukebox.swf?autostart=true&amp;fullscreen=1&amp;use_node_id=true&amp;clip_id=%id%"
                },
                collegehumor: {
                    reg: /collegehumor.com\/video:/i,
                    split: 'video:',
                    index: 1,
                    url: "http://www.collegehumor.com/moogaloop/moogaloop.swf?autoplay=true&amp;fullscreen=1&amp;clip_id=%id%"
                },
                ustream: {
                    reg: /ustream.tv/i,
                    split: '/',
                    index: 4,
                    url: "http://www.ustream.tv/flash/video/%id%?loc=%2F&amp;autoplay=true&amp;vid=%id%&amp;disabledComment=true&amp;beginPercent=0.5331&amp;endPercent=0.6292&amp;locale=en_US"
                },
                twitvid: {
                    reg: /twitvid.com/i,
                    split: '/',
                    index: 3,
                    url: "http://www.twitvid.com/player/%id%"
                },
                wordpress: {
                    reg: /v.wordpress.com/i,
                    split: '/',
                    index: 3,
                    url: "http://s0.videopress.com/player.swf?guid=%id%&amp;v=1.01"
                },
                vzaar: {
                    reg: /vzaar.com\/videos/i,
                    split: '/',
                    index: 4,
                    url: "http://view.vzaar.com/%id%.flashplayer?autoplay=true&amp;border=none"
                }
            },

            mapsreg: {
                bing: {
                    reg: /bing.com\/maps/i,
                    split: '?',
                    index: 1,
                    url: "http://www.bing.com/maps/embed/?emid=3ede2bc8-227d-8fec-d84a-00b6ff19b1cb&amp;w=%width%&amp;h=%height%&amp;%id%"
                },
                streetview: {
                    reg: /maps.google.com(.*)layer=c/i,
                    split: '?',
                    index: 1,
                    url: "http://maps.google.com/?output=svembed&amp;%id%"
                },
                googlev2: {
                    reg: /maps.google.com\/maps\/ms/i,
                    split: '?',
                    index: 1,
                    url: "http://maps.google.com/maps/ms?output=embed&amp;%id%"
                },
                google: {
                    reg: /maps.google.com/i,
                    split: '?',
                    index: 1,
                    url: "http://maps.google.com/maps?%id%&amp;output=embed"
                }
            },

            imgsreg: /\.(jpg|jpeg|gif|png|bmp|tiff)(.*)?$/i,

            overlay: {
                create: function (options) {
                    this.options = options;
                    this.element = $('<div id="' + new Date().getTime() + '" class="' + this.options.name + '-overlay"></div>');
                    this.element.css($.extend({}, {
                        'position': 'fixed',
                        'top': 0,
                        'left': 0,
                        'opacity': 0,
                        'display': 'none',
                        'z-index': this.options.zIndex
                    }, this.options.style));

                    this.element.click($.proxy(function (event) {
                        if (this.options.hideOnClick) {
                            if ($.isFunction(this.options.callback)) {
                                this.options.callback();
                            } else {
                                this.hide();
                            }
                        }
                        event.preventDefault();
                    }, this));

                    this.hidden = true;
                    this.inject();
                    return this;
                },

                inject: function () {
                    this.target = $(document.body);
                    this.target.append(this.element);

                    if (is_ie6) {
                        this.element.css({ 'position': 'absolute' });
                        var zIndex = parseInt(this.element.css('zIndex'));
                        if (!zIndex) {
                            zIndex = 1;
                            var pos = this.element.css('position');
                            if (pos == 'static' || !pos) {
                                this.element.css({ 'position': 'relative' });
                            }
                            this.element.css({ 'zIndex': zIndex });
                        }
                        zIndex = (!!(this.options.zIndex || this.options.zIndex === 0) && zIndex > this.options.zIndex) ? this.options.zIndex : zIndex - 1;
                        if (zIndex < 0) {
                            zIndex = 1;
                        }
                        this.shim = $('<iframe id="IF_' + new Date().getTime() + '" scrolling="no" frameborder=0 src=""></iframe>');
                        this.shim.css({
                            zIndex: zIndex,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            border: 'none',
                            width: 0,
                            height: 0,
                            opacity: 0
                        });
                        this.shim.insertAfter(this.element);
                        $('html, body').css({
                            'height': '100%',
                            'width': '100%',
                            'margin-left': 0,
                            'margin-right': 0
                        });
                    }
                },

                resize: function (x, y) {
                    this.element.css({ 'height': 0, 'width': 0 });
                    if (this.shim) { this.shim.css({ 'height': 0, 'width': 0 }); };

                    var win = { x: $(document).width(), y: $(document).height() };

                    this.element.css({
                        'width': '100%',
                        'height': y ? y : win.y
                    });

                    if (this.shim) {
                        this.shim.css({ 'height': 0, 'width': 0 });
                        this.shim.css({
                            'position': 'absolute',
                            'left': 0,
                            'top': 0,
                            'width': this.element.width(),
                            'height': y ? y : win.y
                        });
                    }
                    return this;
                },

                show: function (callback) {
                    if (!this.hidden) { return this; };
                    if (this.transition) { this.transition.stop(); };
                    if (this.shim) { this.shim.css({ 'display': 'block' }); };
                    this.element.css({ 'display': 'block', 'opacity': 0 });

                    this.target.bind('resize', $.proxy(this.resize, this));
                    this.resize();
                    this.hidden = false;

                    this.transition = this.element.fadeTo(this.options.showDuration, this.options.style.opacity, $.proxy(function () {
                        if (this.options.style.opacity) { this.element.css(this.options.style) };
                        this.element.trigger('show');
                        if ($.isFunction(callback)) { callback(); };
                    }, this));

                    return this;
                },

                hide: function (callback) {
                    if (this.hidden) { return this; };
                    if (this.transition) { this.transition.stop(); };
                    if (this.shim) { this.shim.css({ 'display': 'none' }); };
                    this.target.unbind('resize');
                    this.hidden = true;

                    this.transition = this.element.fadeTo(this.options.closeDuration, 0, $.proxy(function () {
                        this.element.trigger('hide');
                        if ($.isFunction(callback)) { callback(); };
                        this.element.css({ 'height': 0, 'width': 0, 'display': 'none' });
                    }, this));

                    return this;
                }
            },

            create: function (options) {
                this.options = $.extend(true, this.defaults, options);

                var name = this.options.name;
                var lightbox = $('<div class="' + name + ' ' + name + '-mode-image"><div class="' + name + '-border-top-left"></div><div class="' + name + '-border-top-middle"></div><div class="' + name + '-border-top-right"></div><a class="' + name + '-button-close" href="#close"><span>Close</span></a><div class="' + name + '-navigator"><a class="' + name + '-button-left" href="#"><span>Previous</span></a><a class="' + name + '-button-right" href="#"><span>Next</span></a></div><div class="' + name + '-buttons"><div class="' + name + '-buttons-init"></div><a class="' + name + '-button-left" href="#"><span>Previous</span></a><a class="' + name + '-button-max" href="#"><span>Maximize</span></a><div class="' + name + '-buttons-custom"></div><a class="' + name + '-button-right" href="#"><span>Next</span></a><div class="' + name + '-buttons-end"></div></div><div class="' + name + '-background"></div><div class="' + name + '-html"></div><div class="' + name + '-border-bottom-left"></div><div class="' + name + '-border-bottom-middle"></div><div class="' + name + '-border-bottom-right"></div></div>');

                this.overlay.create({
                    name: name,
                    style: this.options.overlay,
                    hideOnClick: !this.options.modal,
                    zIndex: this.options.zIndex - 1,
                    callback: $.proxy(this.close, this),
                    showDuration: (is_smartphone ? 2 : this.options.showDuration),
                    closeDuration: (is_smartphone ? 2 : this.options.closeDuration)
                });

                this.esqueleto.lightbox = lightbox;
                this.esqueleto.navigator = $('.' + name + '-navigator', lightbox);
                this.esqueleto.buttons.div = $('.' + name + '-buttons', lightbox);
                this.esqueleto.buttons.close = $('.' + name + '-button-close', lightbox);
                this.esqueleto.buttons.prev = $('.' + name + '-button-left', lightbox);
                this.esqueleto.buttons.max = $('.' + name + '-button-max', lightbox);
                this.esqueleto.buttons.next = $('.' + name + '-button-right', lightbox);
                this.esqueleto.buttons.custom = $('.' + name + '-buttons-custom', lightbox);
                this.esqueleto.background = $('.' + name + '-background', lightbox);
                this.esqueleto.html = $('.' + name + '-html', lightbox);

                this.esqueleto.move = $('<div class="' + name + '-move"></div>').css({
                    'position': 'absolute',
                    'z-index': this.options.zIndex,
                    'top': -999,
                    'left': -999
                }).append(lightbox);

                $('body').append(this.esqueleto.move);

                this.addevents();
                return lightbox;
            },

            addevents: function () {
                this.esqueleto.buttons.close.bind('click', $.proxy(function (ev) {
                    this.close();
                    ev.preventDefault();
                }, this));

                if (is_smartphone) {
                    window.onorientationchange = function () {
                        $(window).trigger('resize');
                    };
                };

                $(window).bind('resize', $.proxy(function () {
                    if (this.visible) {
                        this.overlay.resize();
                        if (!this.maximized) {
                            this.movebox();
                        }
                    }
                }, this));

                $(window).bind('scroll', $.proxy(function () {
                    if (this.visible && !this.maximized) {
                        this.movebox();
                    }
                }, this));

                $(document).bind('keydown', $.proxy(function (event) {
                    if (this.visible) {
                        if (event.keyCode == 27 && this.overlay.options.hideOnClick) { // esc
                            this.close();
                        }
                        if (this.gallery.total > 1) {
                            if (event.keyCode == 37) {
                                this.esqueleto.buttons.prev.triggerHandler('click', event);
                            }

                            if (event.keyCode == 39) {
                                this.esqueleto.buttons.next.triggerHandler('click', event);
                            }
                        }
                    }
                }, this));

                this.esqueleto.buttons.max.bind('click', $.proxy(function (event) {
                    this.maximinimize();
                    event.preventDefault();
                }, this));

                // heredamos los eventos, desde el overlay:
                this.overlay.element.bind('show', $.proxy(function () { $(this).triggerHandler('show'); }, this));
                this.overlay.element.bind('hide', $.proxy(function () { $(this).triggerHandler('close'); }, this));
            },

            create_gallery: function (href) {
                var prev = this.esqueleto.buttons.prev;
                var next = this.esqueleto.buttons.next;

                if ($.isArray(href) && href.length > 1) {
                    this.gallery.images = href;
                    this.gallery.current = 0;
                    this.gallery.total = href.length;
                    href = href[0];

                    prev.unbind('click');
                    next.unbind('click');

                    prev.bind('click', $.proxy(function (event) {
                        if (this.gallery.current - 1 < 0) {
                            this.gallery.current = this.gallery.total - 1;
                        } else {
                            this.gallery.current = this.gallery.current - 1;
                        }
                        this.show(this.gallery.images[this.gallery.current]);
                        event.preventDefault();
                    }, this));

                    next.bind('click', $.proxy(function (event) {
                        if (this.gallery.current + 1 >= this.gallery.total) {
                            this.gallery.current = 0;
                        } else {
                            this.gallery.current = this.gallery.current + 1;
                        }
                        this.show(this.gallery.images[this.gallery.current]);
                        event.preventDefault();
                    }, this));
                }

                if (this.gallery.total > 1) {
                    if (this.esqueleto.navigator.css("display") == "none") {
                        this.esqueleto.buttons.div.show();
                    }
                    prev.show();
                    next.show();
                } else {
                    prev.hide();
                    next.hide();
                }
            },

            custombuttons: function (buttons, anchor) {
                $.each(buttons, $.proxy(function (i, button) {
                    this.esqueleto.buttons.custom.append($('<a href="#" class="' + button['class'] + '">' + button.html + '</a>').bind('click', $.proxy(function (e) {
                        if ($.isFunction(button.callback)) {
                            anchor = typeof anchor === "undefined" ? false : anchor[this.gallery.current || 0];
                            button.callback(this.esqueleto.image.src, this, anchor);
                        }
                        e.preventDefault();
                    }, this)));
                }, this));
                this.esqueleto.buttons.div.show();
            },

            show: function (href, options, callback, anchor) {
                var type = '';
                var beforeopen = false;

                // is inline content? lightbox($("<div/>"));
                if (typeof href === "object" && href[0].nodeType) {
                    var tmpElement = href;
                    href = "#";
                    type = 'element';
                }

                //is it an array and is it empty?
                if (($.isArray(href) && href.length <= 1) || href == '') {
                    return false;
                };

                this.loading();
                beforeopen = this.visible;
                this.open();

                if (!beforeopen) { this.movebox(); };

                // create gallery buttons and show the first image
                this.create_gallery(href, options);
                if ($.isArray(href) && href.length > 1) {
                    href = href[0];
                }

                var temp = href.split("%LIGHTBOX%");
                var href = temp[0];
                var title = temp[1] || '';

                options = $.extend(true, {
                    'width': 0,
                    'height': 0,
                    'modal': 0,
                    'force': '',
                    'title': title,
                    'autoresize': true,
                    'move': -1,
                    'iframe': false,
                    'flashvars': '',
                    'cufon': true,
                    'onOpen': function () { },
                    'onClose': function () { }
                }, options || {});

                // callbacks
                this.options.onOpen = options.onOpen;
                this.options.onClose = options.onClose;

                this.options.cufon = options.cufon;

                urloptions = this.unserialize(href);
                options = $.extend({}, options, urloptions);

                var size = { x: $(window).width(), y: (window.innerHeight ? window.innerHeight : $(window).height()) };

                // calcular porcentajes si es que existen:
                if (options.width && ("" + options.width).indexOf("p") > 0) {
                    options.width = (size.x - 20) * options.width.substring(0, options.width.indexOf("p")) / 100;
                }
                if (options.height && ("" + options.height).indexOf("p") > 0) {
                    options.height = (size.y - 20) * options.height.substring(0, options.height.indexOf("p")) / 100;
                }

                this.overlay.options.hideOnClick = !options.modal;

                this.esqueleto.buttons.max.removeClass(this.options.name + '-button-min').addClass(this.options.name + '-button-max');

                this.maximized = !(options.move > 0 || (options.move == -1 && options.autoresize));

                if ($.isArray(options.buttons)) {
                    this.custombuttons(options.buttons, anchor);
                }

                if (!this.esqueleto.buttons.custom.is(":empty")) {
                    this.esqueleto.buttons.div.show();
                }

                if (options.force != '') {
                    type = options.force;
                } else if (options.iframe) {
                    type = 'iframe';
                } else if (href.match(this.imgsreg)) {
                    type = 'image';
                } else {
                    $.each(this.videoregs, $.proxy(function (i, e) {
                        if (href.split('?')[0].match(e.reg)) {
                            if (e.split) {
                                videoid = href.split(e.split)[e.index].split('?')[0].split('&')[0];
                                href = e.url.replace("%id%", videoid);
                            }
                            type = e.iframe ? 'iframe' : 'flash';
                            options.width = options.width ? options.width : this.options.flash.width;
                            options.height = options.height ? options.height : this.options.flash.height;
                            return false;
                        }
                    }, this));

                    $.each(this.mapsreg, function (i, e) {
                        if (href.match(e.reg)) {
                            type = 'iframe';
                            if (e.split) {
                                id = href.split(e.split)[e.index];
                                href = e.url.replace("%id%", id).replace("%width%", options.width).replace("%height%", options.height);
                            }
                            options.width = options.width ? options.width : this.options.maps.width;
                            options.height = options.height ? options.height : this.options.maps.height;
                            return false;
                        }
                    });

                    if (type == '') {
                        if (href.match(/#/)) {
                            obj = href.substr(href.indexOf("#"));
                            if ($(obj).length > 0) {
                                type = 'inline';
                                href = obj;
                            } else {
                                type = 'ajax';
                            }
                        } else {
                            type = 'ajax';
                        }
                    }
                }

                if (type == 'image') {
                    this.esqueleto.buttons.max.hide();

                    this.esqueleto.image = new Image();
                    $(this.esqueleto.image).load($.proxy(function () {
                        $(this.esqueleto.image).unbind('load');
                        var image = this.esqueleto.image;

                        if (!this.visible) { return false };

                        if (options.width) {
                            width = parseInt(options.width);
                            height = parseInt(options.height);
                        } else {
                            if (options.autoresize) {
                                var objsize = this.calculate(image.width, image.height);
                                width = objsize.width;
                                height = objsize.height;
                                if (image.width != width || image.height != height) {
                                    this.esqueleto.buttons.div.show();
                                    this.esqueleto.buttons.max.show();
                                }
                            } else {
                                width = image.width;
                                height = image.height;
                            }
                        }

                        this.esqueleto.title = (options.title == '') ? null : $('<div class="' + this.options.name + '-title"></div>').html(options.title);

                        this.loadimage();

                        this.resize(width, height);
                    }, this));

                    this.esqueleto.image.onerror = $.proxy(function () {
                        this.error("The requested image cannot be loaded. Please try again later.");
                    }, this);

                    this.esqueleto.image.src = href;
                } else if (type == 'flash' || type == 'inline' || type == 'ajax' || type == 'element') {

                    if (type == 'inline') {
                        this.appendhtml($(href).clone(true).show(), options.width > 0 ? options.width : $(href).outerWidth(true), options.height > 0 ? options.height : $(href).outerHeight(true), 'html');

                    } else if (type == 'ajax') {
                        if (options.width) {
                            width = options.width;
                            height = options.height;
                        } else {
                            this.error("You need to specify the size of the lightbox.");
                            return false;
                        }

                        if (this.animations.ajax) { this.animations.ajax.abort(); };
                        this.animations.ajax = $.ajax({
                            url: href,
                            type: "GET",
                            cache: false,
                            dataType: "html",
                            error: $.proxy(function (jqXHR, textStatus, errorThrown) { this.error("Error" + " " + jqXHR.status + " " + errorThrown); }, this),
                            success: $.proxy(function (html) { this.appendhtml($(html), width, height, 'html'); }, this)
                        });

                    } else if (type == 'flash') {
                        var flash = this.swf2html(href, options.width, options.height, options.flashvars);
                        this.appendhtml($(flash), options.width, options.height, 'html');
                    } else if (type == 'element') {
                        this.appendhtml(tmpElement, options.width > 0 ? options.width : tmpElement.outerWidth(true), options.height > 0 ? options.height : tmpElement.outerHeight(true), 'html');
                    }
                } else if (type == 'iframe') {

                    if (options.width) {
                        width = options.width;
                        height = options.height;
                    } else {
                        this.error("You need to specify the size of the lightbox.");
                        return false;
                    }
                    this.appendhtml($('<iframe id="IF_' + (new Date().getTime()) + '" frameborder="0" src="' + href + '" style="margin:0; padding:0;" allowTransparency="true"></iframe>').css(options), options.width, options.height, 'html');
                }

                this.callback = $.isFunction(callback) ? callback : function (e) { };
            },

            loadimage: function () {
                this.esqueleto.background.bind('complete', $.proxy(function () {
                    this.esqueleto.background.unbind('complete');

                    if (!this.visible) { return false };

                    this.changemode('image');

                    this.esqueleto.background.empty();
                    this.esqueleto.html.empty();

                    if (this.esqueleto.title) {
                        this.esqueleto.background.append(this.esqueleto.title);
                    }

                    this.esqueleto.background.append(this.esqueleto.image);

                    if (is_ie6 || is_smartphone) {
                        this.esqueleto.background.removeClass(this.options.name + '-loading');
                    } else {
                        $(this.esqueleto.image).stop().css({ "opacity": 0 }).animate({ "opacity": 1 }, 400, $.proxy(function () { this.esqueleto.background.removeClass(this.options.name + '-loading'); }, this));
                    }

                    this.options.onOpen();
                }, this));
            },

            swf2html: function (href, width, height, flashvars) {
                if (typeof flashvars == 'undefined' || flashvars == '') flashvars = 'autostart=1&autoplay=1&fullscreenbutton=1';
                var str = '<object width="' + width + '" height="' + height + '" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"><param name="movie" value="' + href + '" style="margin:0; padding:0;"></param>';
                str += '<param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><param name="wmode" value="transparent"></param>';
                str += '<param name="autostart" value="true"></param><param name="autoplay" value="true"></param><param name="flashvars" value="' + flashvars + '"></param>';
                str += '<param name="width" value="' + width + '"></param><param name="height" value="' + height + '"></param>';
                str += '<embed src="' + href + '" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" autostart="true" autoplay="true" flashvars="' + flashvars + '" wmode="transparent" width="' + width + '" height="' + height + '" style="margin:0; padding:0;"></embed></object>';
                return str;
            },

            appendhtml: function (obj, width, height, mode) {
                if (typeof mode !== 'undefined') {
                    this.changemode(mode);
                }

                this.resize(width + 30, height + 20);

                this.esqueleto.background.bind('complete', $.proxy(function () {
                    this.esqueleto.background.removeClass(this.options.name + '-loading');
                    this.esqueleto.html.html(obj);
                    this.esqueleto.html.html(obj); // double line to fix chrome bug
                    this.esqueleto.background.unbind('complete');
                    if (this.options.cufon && typeof Cufon !== 'undefined') {
                        Cufon.refresh();
                    }
                    this.options.onOpen();
                }, this));

            },

            movebox: function (w, h) {
                var size = { x: $(window).width(), y: (window.innerHeight ? window.innerHeight : $(window).height()) };
                var scroll = { x: $(window).scrollLeft(), y: $(window).scrollTop() };
                var height = h != null ? h : this.esqueleto.lightbox.outerHeight();
                var width = w != null ? w : this.esqueleto.lightbox.outerWidth();
                var y = 0;
                var x = 0;

                //vertically center
                x = scroll.x + ((size.x - width) / 2);

                if (this.visible) {
                    y = scroll.y + (size.y - height) / 2;
                } else if (this.options.emergefrom == "bottom") {
                    y = (scroll.y + size.y + 14);
                } else {// top
                    y = (scroll.y - height) - 14;
                }

                if (this.visible) {

                    if (!this.animations.move) {
                        this.morph(this.esqueleto.move, {
                            'left': x
                        }, 'move');
                    }

                    this.morph(this.esqueleto.move, {
                        'top': y
                    }, 'move');

                } else {

                    this.esqueleto.move.css({
                        'left': x,
                        'top': y
                    });
                }
            },

            morph: function (el, prop, mode, callback, queue) {
                var optall = $.speed({
                    queue: queue || false,
                    duration: (is_smartphone ? 2 : this.options[mode + 'Duration']),
                    easing: this.options[mode + 'Transition'],
                    complete: ($.isFunction(callback) ? $.proxy(callback, this) : null)
                });

                return el[optall.queue === false ? "each" : "queue"](function () {

                    if (parseFloat($.fn.jquery) > 1.5) {
                        if (optall.queue === false) {
                            jQuery._mark(this);
                        }
                    }

                    var opt = $.extend({}, optall), self = this;

                    opt.curAnim = $.extend({}, prop);

                    opt.animatedProperties = {};

                    for (p in prop) {
                        name = p;
                        val = prop[name];
                        opt.animatedProperties[name] = opt.specialEasing && opt.specialEasing[name] || opt.easing || 'swing';
                    }

                    $.each(prop, function (name, val) {
                        var e = new $.fx(self, opt, name);

                        e.custom(e.cur(true) || 0, val, "px");
                    });

                    return true;
                });
            },

            resize: function (x, y) {
                if (this.visible) {
                    var size = { x: $(window).width(), y: (window.innerHeight ? window.innerHeight : $(window).height()) };
                    var scroll = { x: $(window).scrollLeft(), y: $(window).scrollTop() };
                    var left = (scroll.x + (size.x - (x + 14)) / 2);
                    var top = (scroll.y + (size.y - (y + 14)) / 2);

                    if ($.browser.msie || ($.browser.mozilla && (parseFloat($.browser.version) < 1.9))) {
                        y += 4;
                    }

                    this.animations.move = true;

                    this.morph(this.esqueleto.move.stop(), {
                        'left': (this.maximized && left < 0) ? 0 : left,
                        'top': (this.maximized && (y + 14) > size.y) ? scroll.y : top
                    }, 'move', $.proxy(function () { this.move = false; }, this.animations));

                    this.morph(this.esqueleto.html, { 'height': y - 20 }, 'resize');
                    this.morph(this.esqueleto.lightbox.stop(), { 'width': (x + 14), 'height': y - 20 }, 'resize', {}, true);
                    this.morph(this.esqueleto.navigator, { 'width': x }, 'resize');
                    this.morph(this.esqueleto.navigator, { 'top': (y - 90) / 2 }, 'move');
                    this.morph(this.esqueleto.background.stop(), { 'width': x, 'height': y }, 'resize', function () { $(this.esqueleto.background).trigger('complete'); });

                } else {

                    this.esqueleto.html.css({ 'height': y - 20 });
                    this.esqueleto.lightbox.css({ 'width': x + 14, 'height': y - 20 });
                    this.esqueleto.background.css({ 'width': x, 'height': y });
                    this.esqueleto.navigator.css({ 'width': x, 'height': 90 });
                }
            },

            close: function (param) {
                this.visible = false;
                this.gallery = {};

                this.options.onClose();

                if ($.browser.msie || is_smartphone) {
                    this.esqueleto.background.empty();
                    this.esqueleto.html.hide().empty().show();
                    this.esqueleto.buttons.custom.empty();
                    this.esqueleto.move.css({ 'display': 'none' });
                    this.movebox();
                } else {
                    this.esqueleto.move.animate({ 'opacity': 0, 'top': '-=40' }, {
                        queue: false,
                        complete: ($.proxy(function () {
                            this.esqueleto.background.empty();
                            this.esqueleto.html.empty();
                            this.esqueleto.buttons.custom.empty();
                            this.movebox();
                            this.esqueleto.move.css({ 'display': 'none', 'opacity': 1, 'overflow': 'visible' });
                        }, this))
                    });
                }

                this.overlay.hide($.proxy(function () {
                    if ($.isFunction(this.callback)) {
                        this.callback.apply(this, $.makeArray(param));
                    }
                }, this));

                this.esqueleto.background.stop(true, false);
                this.esqueleto.background.unbind('complete');
            },

            open: function () {
                this.visible = true;
                if ($.browser.msie) {
                    this.esqueleto.move.get(0).style.removeAttribute('filter');
                }
                this.esqueleto.move.css({ 'display': 'block', 'overflow': 'visible' }).show();
                this.overlay.show();
            },

            shake: function () {
                var x = this.options.shake.distance;
                var d = this.options.shake.duration;
                var t = this.options.shake.transition;
                var o = this.options.shake.loops;
                var l = this.esqueleto.move.position().left;
                var e = this.esqueleto.move;

                for (i = 0; i < o; i++) {
                    e.animate({ left: l + x }, d, t);
                    e.animate({ left: l - x }, d, t);
                };

                e.animate({ left: l + x }, d, t);
                e.animate({ left: l }, d, t);
            },

            changemode: function (mode) {
                if (mode != this.mode) {
                    this.esqueleto.lightbox.removeClass(this.options.name + '-mode-' + this.mode);
                    this.mode = mode;
                    this.esqueleto.lightbox.addClass(this.options.name + '-mode-' + this.mode);
                }
                this.esqueleto.move.css({ 'overflow': 'visible' });
            },

            error: function (msg) {
                alert(msg);
                this.close();
            },

            unserialize: function (data) {
                var regex = /lightbox\[(.*)?\]$/i;
                var serialised = {};

                if (data.match(/#/)) {
                    data = data.slice(0, data.indexOf("#"));
                }
                data = data.slice(data.indexOf('?') + 1).split("&");

                $.each(data, function () {
                    var properties = this.split("=");
                    var key = properties[0];
                    var value = properties[1];

                    if (key.match(regex)) {
                        if (isFinite(value)) {
                            value = parseInt(value)
                        } else if (value.toLowerCase() == "true") {
                            value = true;
                        } else if (value.toLowerCase() == "false") {
                            value = false;
                        }
                        serialised[key.match(regex)[1]] = value;
                    }
                });

                return serialised;
            },

            calculate: function (x, y) {
                // Resizing large images
                var maxx = $(window).width() - 50;
                var maxy = (window.innerHeight ? window.innerHeight : $(window).height()) - 50;

                if (x > maxx) {
                    y = y * (maxx / x);
                    x = maxx;
                    if (y > maxy) {
                        x = x * (maxy / y);
                        y = maxy;
                    }
                } else if (y > maxy) {
                    x = x * (maxy / y);
                    y = maxy;
                    if (x > maxx) {
                        y = y * (maxx / x);
                        x = maxx;
                    }
                }
                // End Resizing
                return { width: parseInt(x), height: parseInt(y) };
            },

            loading: function () {
                this.changemode('image');
                this.esqueleto.background.children().stop(true);
                this.esqueleto.background.empty();
                this.esqueleto.html.empty();
                this.esqueleto.background.addClass(this.options.name + '-loading');
                this.esqueleto.buttons.div.hide();
                if (this.visible == false) {
                    this.movebox(this.options.width, this.options.height);
                    this.resize(this.options.width, this.options.height);
                }
            },

            maximinimize: function () {
                if (this.maximized) {
                    this.maximized = false;
                    this.esqueleto.buttons.max.removeClass(this.options.name + '-button-min');
                    this.esqueleto.buttons.max.addClass(this.options.name + '-button-max');
                    this.loading();
                    this.loadimage();
                    this.esqueleto.buttons.div.show();
                    var objsize = this.calculate(this.esqueleto.image.width, this.esqueleto.image.height);
                    this.resize(objsize.width, objsize.height);
                } else {
                    this.maximized = true;
                    this.esqueleto.buttons.max.removeClass(this.options.name + '-button-max');
                    this.esqueleto.buttons.max.addClass(this.options.name + '-button-min');
                    this.loading();
                    this.loadimage();
                    this.esqueleto.buttons.div.show();
                    this.resize(this.esqueleto.image.width, this.esqueleto.image.height);
                }
            }

        }, //end object

        lightbox: function (url, options, callback) {
            if (typeof url !== 'undefined') {
                return $.LightBoxObject.show(url, options, callback);
            } else {
                return $.LightBoxObject;
            }
        }

    });

    $.fn.lightbox = function (options, callback) {
        return $(this).live('click', function (e) {
            $(this).blur();

            var sel = [];
            var rel = $.trim($(this).attr('rel')) || '';
            var til = $.trim($(this).attr('title')) || '';
            var lnk = $(this);

            rel = rel.replace('[', '\\\\[');
            rel = rel.replace(']', '\\\\]');

            if (!rel || rel == '' || rel === 'nofollow') {
                sel = $(this).attr('href');

                copy_options = (til || til != '') ? $.extend({}, options, { 'title': til }) : options;

            } else {
                var rels = [];
                var antes = [];
                var desps = [];
                var encon = false;

                $("a[rel], area[rel]", this.ownerDocument).filter("[rel=\"" + rel + "\"]").each($.proxy(function (i, el) {
                    if (this == el) {
                        antes.unshift(el);
                        encon = true;
                    } else if (encon == false) {
                        desps.push(el);
                    } else {
                        antes.push(el);
                    }
                }, this));

                rels = lnk = antes.concat(desps);

                $.each(rels, function () {
                    var title = $.trim($(this).attr('title')) || '';
                    title = title ? "%LIGHTBOX%" + title : '';
                    sel.push($(this).attr('href') + title);
                });

                if (sel.length == 1) {
                    sel = sel[0];
                }

                copy_options = options;
            }

            $.LightBoxObject.show(sel, copy_options, callback, lnk);

            e.preventDefault();
            e.stopPropagation();
        });
    };

    $(function () {
        if (parseFloat($.fn.jquery) > 1.2) {
            $.LightBoxObject.create();
        } else {
            throw "The jQuery version that was loaded is too old. Lightbox Evolution requires jQuery 1.3+";
        }
    });

})(jQuery);
//jquery.university.min.js
(function ($) { $.fn.emailBox = function (options) { var defaults = { width: 488, height: 535, formUrl: "/Pages/email.htm?emailAddress={0}{1}", template: "&lightbox[iframe]=true&lightbox[width]={0}&lightbox[height]={1}", theme: "uj" }; $.extend(options, defaults); this.each(function () { __lb = defaults.template.f(defaults.width, defaults.height); __email = $(this).attr("href").replace(/mailto:/i, ""); __formUrl = defaults.formUrl.f(__email, __lb); $(this).addClass("lightbox").attr({ href: __formUrl }); }); }; })(jQuery); String.prototype.format = String.prototype.f = function () { var s = this, i = arguments.length; while (i--) { s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]); } return s; };
//warning.js
var msg1 = "Did you know that your Internet Explorer is out of date?";
var msg2 = "To get the best possible experience using our website we recommend that you upgrade to a newer version or other web browser. A list of the most popular web browsers can be found below.";
var msg3 = "Just click on the icons to get to the download page";
var br1 = "Internet Explorer 8+";
var br2 = "Firefox 5+";
var br3 = "Safari 5+";
var br4 = "Opera 10+";
var br5 = "Chrome 10.0+";
var url1 = "http://windows.microsoft.com/en-us/internet-explorer/products/ie/home";
var url2 = "http://www.mozilla.org/en-US/firefox/new/?from=getfirefox";
var url3 = "http://www.apple.com/safari/download/";
var url4 = "http://www.opera.com/browser/";
var url5 = "https://www.google.com/chrome";
var imgPath;

function e(str) {imgPath = str;var _body = document.getElementsByTagName('body')[0];var _d = document.createElement('div');var _l = document.createElement('div');var _h = document.createElement('h1');var _p1 = document.createElement('p');var _p2 = document.createElement('p');var _ul = document.createElement('ul');var _li1 = document.createElement('li');var _li2 = document.createElement('li');var _li3 = document.createElement('li');var _li4 = document.createElement('li');var _li5 = document.createElement('li');var _ico1 = document.createElement('div');var _ico2 = document.createElement('div');var _ico3 = document.createElement('div');var _ico4 = document.createElement('div');var _ico5 = document.createElement('div');var _lit1 = document.createElement('div');var _lit2 = document.createElement('div');var _lit3 = document.createElement('div');var _lit4 = document.createElement('div');var _lit5 = document.createElement('div');_body.appendChild(_l);_body.appendChild(_d);_d.appendChild(_h);_d.appendChild(_p1);_d.appendChild(_p2);_d.appendChild(_ul);_ul.appendChild(_li1);_ul.appendChild(_li2);_ul.appendChild(_li3);_ul.appendChild(_li4);_ul.appendChild(_li5);_li1.appendChild(_ico1);_li2.appendChild(_ico2);_li3.appendChild(_ico3);_li4.appendChild(_ico4);_li5.appendChild(_ico5);_li1.appendChild(_lit1);_li2.appendChild(_lit2);_li3.appendChild(_lit3);_li4.appendChild(_lit4);_li5.appendChild(_lit5);_d.setAttribute('id','_d');_l.setAttribute('id','_l');_h.setAttribute('id','_h');_p1.setAttribute('id','_p1');_p2.setAttribute('id','_p2');_ul.setAttribute('id','_ul');_li1.setAttribute('id','_li1');_li2.setAttribute('id','_li2');_li3.setAttribute('id','_li3');_li4.setAttribute('id','_li4');_li5.setAttribute('id','_li5');_ico1.setAttribute('id','_ico1');_ico2.setAttribute('id','_ico2');_ico3.setAttribute('id','_ico3');_ico4.setAttribute('id','_ico4');_ico5.setAttribute('id','_ico5');_lit1.setAttribute('id','_lit1');_lit2.setAttribute('id','_lit2');_lit3.setAttribute('id','_lit3');_lit4.setAttribute('id','_lit4');_lit5.setAttribute('id','_lit5');var _width = document.documentElement.clientWidth;var _height = document.documentElement.clientHeight;var _dl = document.getElementById('_l');_dl.style.width =  _width+"px";_dl.style.height = _height+"px";_dl.style.position = "absolute";_dl.style.top = "0px";_dl.style.left = "0px";_dl.style.filter = "alpha(opacity=50)";_dl.style.background = "#fff";var _dd = document.getElementById('_d');_ddw = 650;_ddh = 260;_dd.style.width = _ddw+"px";_dd.style.height = _ddh+"px";_dd.style.position = "absolute";_dd.style.top = ((_height-_ddh)/2)+"px";_dd.style.left = ((_width-_ddw)/2)+"px";_dd.style.padding = "20px";_dd.style.background = "#fff";_dd.style.border = "1px solid #ccc";_dd.style.fontFamily = "'Lucida Grande','Lucida Sans Unicode',Arial,Verdana,sans-serif";_dd.style.listStyleType = "none";_dd.style.color = "#4F4F4F";_dd.style.fontSize = "12px";_h.appendChild(document.createTextNode(msg1));var _hd = document.getElementById('_h');_hd.style.display = "block";_hd.style.fontSize = "1.3em";_hd.style.marginBottom = "0.5em";_hd.style.color = "#333";_hd.style.fontFamily = "Helvetica,Arial,sans-serif";_hd.style.fontWeight = "bold";_p1.appendChild(document.createTextNode(msg2));var _p1d = document.getElementById('_p1');_p1d.style.marginBottom = "1em";_p2.appendChild(document.createTextNode(msg3));var _p2d = document.getElementById('_p2');_p2d.style.marginBottom = "1em";var _uld = document.getElementById('_ul');_uld.style.listStyleImage = "none";_uld.style.listStylePosition = "outside";_uld.style.listStyleType = "none";_uld.style.margin = "0 px auto";_uld.style.padding = "0px";_uld.style.paddingLeft = "10px";var _li1d = document.getElementById('_li1');var _li2d = document.getElementById('_li2');var _li3d = document.getElementById('_li3');var _li4d = document.getElementById('_li4');var _li5d = document.getElementById('_li5');var _li1ds = _li1d.style;var _li2ds = _li2d.style;var _li3ds = _li3d.style;var _li4ds = _li4d.style;var _li5ds = _li5d.style;_li1ds.background = _li2ds.background = _li3ds.background = _li4ds.background = _li5ds.background = "transparent url('"+imgPath+"background_browser.gif') no-repeat scroll left top";_li1ds.cursor = _li2ds.cursor = _li3ds.cursor = _li4ds.cursor = _li5ds.cursor = "pointer";_li1d.onclick = function() {window.location = url1 }; _li2d.onclick = function() {window.location = url2 }; _li3d.onclick = function() {window.location = url3 }; _li4d.onclick = function() {window.location = url4 }; _li5d.onclick = function() {window.location = url5 }; _li1ds.styleFloat = _li2ds.styleFloat = _li3ds.styleFloat = _li4ds.styleFloat = _li5ds.styleFloat = "left";_li1ds.width = _li2ds.width = _li3ds.width = _li4ds.width = _li5ds.width = "120px";_li1ds.height = _li2ds.height = _li3ds.height = _li4ds.height = _li5ds.height = "122px";_li1ds.margin = _li2ds.margin = _li3ds.margin = _li4ds.margin = _li5ds.margin = "0 10px 10px 0";var _ico1d = document.getElementById('_ico1');var _ico2d = document.getElementById('_ico2');var _ico3d = document.getElementById('_ico3');var _ico4d = document.getElementById('_ico4');var _ico5d = document.getElementById('_ico5');var _ico1ds = _ico1d.style;var _ico2ds = _ico2d.style;var _ico3ds = _ico3d.style;var _ico4ds = _ico4d.style;var _ico5ds = _ico5d.style;_ico1ds.width = _ico2ds.width = _ico3ds.width = _ico4ds.width = _ico5ds.width = "100px";_ico1ds.height = _ico2ds.height = _ico3ds.height = _ico4ds.height = _ico5ds.height = "100px";_ico1ds.margin = _ico2ds.margin = _ico3ds.margin = _ico4ds.margin = _ico5ds.margin = "1px auto";_ico1ds.background = "transparent url('"+imgPath+"browser_ie.gif') no-repeat scroll left top";_ico2ds.background = "transparent url('"+imgPath+"browser_firefox.gif') no-repeat scroll left top";_ico3ds.background = "transparent url('"+imgPath+"browser_safari.gif') no-repeat scroll left top";_ico4ds.background = "transparent url('"+imgPath+"browser_opera.gif') no-repeat scroll left top";_ico5ds.background = "transparent url('"+imgPath+"browser_chrome.gif') no-repeat scroll left top";_lit1.appendChild(document.createTextNode(br1));_lit2.appendChild(document.createTextNode(br2));_lit3.appendChild(document.createTextNode(br3));_lit4.appendChild(document.createTextNode(br4));_lit5.appendChild(document.createTextNode(br5));var _lit1d = document.getElementById('_lit1');var _lit2d = document.getElementById('_lit2');var _lit3d = document.getElementById('_lit3');var _lit4d = document.getElementById('_lit4');var _lit5d = document.getElementById('_lit5');var _lit1ds = _lit1d.style;var _lit2ds = _lit2d.style;var _lit3ds = _lit3d.style;var _lit4ds = _lit4d.style;var _lit5ds = _lit5d.style;_lit1ds.color = _lit2ds.color = _lit3ds.color = _lit4ds.color = _lit5ds.color = "#808080";_lit1ds.fontSize = _lit2ds.fontSize = _lit3ds.fontSize = _lit4ds.fontSize = _lit5ds.fontSize = "0.8em";_lit1ds.height = _lit2ds.height = _lit3ds.height = _lit4ds.height = _lit5ds.height = "18px";_lit1ds.lineHeight = _lit2ds.lineHeight = _lit3ds.lineHeight = _lit4ds.lineHeight = _lit5ds.lineHeight = "17px";_lit1ds.margin = _lit2ds.margin = _lit3ds.margin = _lit4ds.margin = _lit5ds.margin = "1px auto";_lit1ds.width = _lit2ds.width = _lit3ds.width = _lit4ds.width = _lit5ds.width = "118px";_lit1ds.textAlign = _lit2ds.textAlign = _lit3ds.textAlign = _lit4ds.textAlign = _lit5ds.textAlign = "center";};
//uj.lightSlider.js
(function ($) {

    $.fn.lightSlider = function (options) {

        var defaults = {
            currentPosition: 0,
            slideWidth: 208
        };

        $.extend(defaults, options);

        var slides = $(".slide");
        var numSlides = slides.length;

        manageControl = function (position) {
            if (position == 0) {
                $("#leftControl").hide();
            }
            else {
                $("#leftControl").show();
            }

            if (position == numSlides - 1) {
                $("#rightControl").hide();
            }
            else {
                $("#rightControl").show();
            }
        };

        return this.each(function () {
            $("#slideContainer").css("overflow", "hidden");
            slides
                .wrapAll("<div id=\"slideInner\"></div>")
                .css({ float: "left", width: defaults.slideWidth });
            $("#slideInner").css({ width: defaults.slideWidth * numSlides });
            $("#slideshow")
                .prepend("<span class=\"control\" id=\"leftControl\">Clicking moves left</span>")
                .append("<span class=\"control\" id=\"rightControl\">Clicking moves right</span>");

            manageControl(defaults.currentPosition);

            $(".control")
                .bind("click", function () {
                    defaults.currentPosition = ($(this).attr("id") == "rightControl")
                        ? defaults.currentPosition + 1
                        : defaults.currentPosition - 1;

                    manageControl(defaults.currentPosition);

                    $("#slideInner").animate({ marginLeft: defaults.slideWidth * (-defaults.currentPosition) });
                });
        });
    };

    $.fn.lightBox = function (settings) {
        // Settings to configure the jQuery lightBox plugin how you like
        settings = jQuery.extend({
            // Configuration related to overlay
            overlayBgColor: '#000', 	// (string) Background color to overlay; inform a hexadecimal value like: #RRGGBB. Where RR, GG, and BB are the hexadecimal values for the red, green, and blue values of the color.
            overlayOpacity: 0.8, 	// (integer) Opacity value to overlay; inform: 0.X. Where X are number from 0 to 9
            // Configuration related to navigation
            fixedNavigation: false, 	// (boolean) Boolean that informs if the navigation (next and prev button) will be fixed or not in the interface.
            // Configuration related to images
            imageLoading: '/_layouts/1033/images/lightbox-ico-loading.gif', 	// (string) Path and the name of the loading icon
            imageBtnPrev: '/_layouts/1033/images/lightbox-btn-prev.gif', 		// (string) Path and the name of the prev button image
            imageBtnNext: '/_layouts/1033/images/lightbox-btn-next.gif', 		// (string) Path and the name of the next button image
            imageBtnClose: '/_layouts/1033/images/lightbox-btn-close.gif', 	// (string) Path and the name of the close btn
            imageBlank: '/_layouts/1033/images/lightbox-blank.gif', 		// (string) Path and the name of a blank image (one pixel)
            // Configuration related to container image box
            containerBorderSize: 10, 		// (integer) If you adjust the padding in the CSS for the container, #lightbox-container-image-box, you will need to update this value
            containerResizeSpeed: 400, 	// (integer) Specify the resize duration of container image. These number are miliseconds. 400 is default.
            // Configuration related to texts in caption. For example: Image 2 of 8. You can alter either "Image" and "of" texts.
            txtImage: 'Image', // (string) Specify text "Image"
            txtOf: 'of', 	// (string) Specify text "of"
            // Configuration related to keyboard navigation
            keyToClose: 'c', 	// (string) (c = close) Letter to close the jQuery lightBox interface. Beyond this letter, the letter X and the SCAPE key is used to.
            keyToPrev: 'p', 	// (string) (p = previous) Letter to show the previous image
            keyToNext: 'n', 	// (string) (n = next) Letter to show the next image.
            // Don´t alter these variables in any way
            imageArray: [],
            activeImage: 0
        }, settings);
        // Caching the jQuery object with all elements matched
        var jQueryMatchedObj = this; // This, in this context, refer to jQuery object
        /**
        * Initializing the plugin calling the start function
        *
        * @return boolean false
        */
        function _initialize() {
            _start(this, jQueryMatchedObj); // This, in this context, refer to object (link) which the user have clicked
            return false; // Avoid the browser following the link
        }
        /**
        * Start the jQuery lightBox plugin
        *
        * @param object objClicked The object (link) whick the user have clicked
        * @param object jQueryMatchedObj The jQuery object with all elements matched
        */
        function _start(objClicked, jQueryMatchedObj) {
            // Hime some elements to avoid conflict with overlay in IE. These elements appear above the overlay.
            $('embed, object, select').css({ 'visibility': 'hidden' });
            // Call the function to create the markup structure; style some elements; assign events in some elements.
            _set_interface();
            // Unset total images in imageArray
            settings.imageArray.length = 0;
            // Unset image active information
            settings.activeImage = 0;
            // We have an image set? Or just an image? Let´s see it.
            if (jQueryMatchedObj.length == 1) {
                settings.imageArray.push(new Array(objClicked.getAttribute('href'), objClicked.getAttribute('title')));
            } else {
                // Add an Array (as many as we have), with href and title atributes, inside the Array that storage the images references		
                for (var i = 0; i < jQueryMatchedObj.length; i++) {
                    settings.imageArray.push(new Array(jQueryMatchedObj[i].getAttribute('href'), jQueryMatchedObj[i].getAttribute('title')));
                }
            }
            while (settings.imageArray[settings.activeImage][0] != objClicked.getAttribute('href')) {
                settings.activeImage++;
            }
            // Call the function that prepares image exibition
            _set_image_to_view();
        }
        /**
        * Create the jQuery lightBox plugin interface
        *
        * The HTML markup will be like that:
        <div id="jquery-overlay"></div>
        <div id="jquery-lightbox">
        <div id="lightbox-container-image-box">
        <div id="lightbox-container-image">
        <img src="../fotos/XX.jpg" id="lightbox-image">
        <div id="lightbox-nav">
        <a href="#" id="lightbox-nav-btnPrev"></a>
        <a href="#" id="lightbox-nav-btnNext"></a>
        </div>
        <div id="lightbox-loading">
        <a href="#" id="lightbox-loading-link">
        <img src="../images/lightbox-ico-loading.gif">
        </a>
        </div>
        </div>
        </div>
        <div id="lightbox-container-image-data-box">
        <div id="lightbox-container-image-data">
        <div id="lightbox-image-details">
        <span id="lightbox-image-details-caption"></span>
        <span id="lightbox-image-details-currentNumber"></span>
        </div>
        <div id="lightbox-secNav">
        <a href="#" id="lightbox-secNav-btnClose">
        <img src="../images/lightbox-btn-close.gif">
        </a>
        </div>
        </div>
        </div>
        </div>
        *
        */
        function _set_interface() {
            // Apply the HTML markup into body tag
            $('body').append('<div id="jquery-overlay"></div><div id="jquery-lightbox"><div id="lightbox-container-image-box"><div id="lightbox-container-image"><img id="lightbox-image"><div style="" id="lightbox-nav"><a href="#" id="lightbox-nav-btnPrev"></a><a href="#" id="lightbox-nav-btnNext"></a></div><div id="lightbox-loading"><a href="#" id="lightbox-loading-link"><img src="' + settings.imageLoading + '"></a></div></div></div><div id="lightbox-container-image-data-box"><div id="lightbox-container-image-data"><div id="lightbox-image-details"><span id="lightbox-image-details-caption"></span><span id="lightbox-image-details-currentNumber"></span></div><div id="lightbox-secNav"><a href="#" id="lightbox-secNav-btnClose"><img src="' + settings.imageBtnClose + '"></a></div></div></div></div>');
            // Get page sizes
            var arrPageSizes = ___getPageSize();
            // Style overlay and show it
            $('#jquery-overlay').css({
                backgroundColor: settings.overlayBgColor,
                opacity: settings.overlayOpacity,
                width: arrPageSizes[0],
                height: arrPageSizes[1]
            }).fadeIn();
            // Get page scroll
            var arrPageScroll = ___getPageScroll();
            // Calculate top and left offset for the jquery-lightbox div object and show it
            $('#jquery-lightbox').css({
                top: arrPageScroll[1] + (arrPageSizes[3] / 10),
                left: arrPageScroll[0]
            }).show();
            // Assigning click events in elements to close overlay
            $('#jquery-overlay,#jquery-lightbox').click(function () {
                _finish();
            });
            // Assign the _finish function to lightbox-loading-link and lightbox-secNav-btnClose objects
            $('#lightbox-loading-link,#lightbox-secNav-btnClose').click(function () {
                _finish();
                return false;
            });
            // If window was resized, calculate the new overlay dimensions
            $(window).resize(function () {
                // Get page sizes
                var arrPageSizes = ___getPageSize();
                // Style overlay and show it
                $('#jquery-overlay').css({
                    width: arrPageSizes[0],
                    height: arrPageSizes[1]
                });
                // Get page scroll
                var arrPageScroll = ___getPageScroll();
                // Calculate top and left offset for the jquery-lightbox div object and show it
                $('#jquery-lightbox').css({
                    top: arrPageScroll[1] + (arrPageSizes[3] / 10),
                    left: arrPageScroll[0]
                });
            });
        }
        /**
        * Prepares image exibition; doing a image´s preloader to calculate it´s size
        *
        */
        function _set_image_to_view() { // show the loading
            // Show the loading
            $('#lightbox-loading').show();
            if (settings.fixedNavigation) {
                $('#lightbox-image,#lightbox-container-image-data-box,#lightbox-image-details-currentNumber').hide();
            } else {
                // Hide some elements
                $('#lightbox-image,#lightbox-nav,#lightbox-nav-btnPrev,#lightbox-nav-btnNext,#lightbox-container-image-data-box,#lightbox-image-details-currentNumber').hide();
            }
            // Image preload process
            var objImagePreloader = new Image();
            objImagePreloader.onload = function () {
                $('#lightbox-image').attr('src', settings.imageArray[settings.activeImage][0]);
                // Perfomance an effect in the image container resizing it
                _resize_container_image_box(objImagePreloader.width, objImagePreloader.height);
                //	clear onLoad, IE behaves irratically with animated gifs otherwise
                objImagePreloader.onload = function () { };
            };
            objImagePreloader.src = settings.imageArray[settings.activeImage][0];
        };
        /**
        * Perfomance an effect in the image container resizing it
        *
        * @param integer intImageWidth The image´s width that will be showed
        * @param integer intImageHeight The image´s height that will be showed
        */
        function _resize_container_image_box(intImageWidth, intImageHeight) {
            // Get current width and height
            var intCurrentWidth = $('#lightbox-container-image-box').width();
            var intCurrentHeight = $('#lightbox-container-image-box').height();
            // Get the width and height of the selected image plus the padding
            var intWidth = (intImageWidth + (settings.containerBorderSize * 2)); // Plus the image´s width and the left and right padding value
            var intHeight = (intImageHeight + (settings.containerBorderSize * 2)); // Plus the image´s height and the left and right padding value
            // Diferences
            var intDiffW = intCurrentWidth - intWidth;
            var intDiffH = intCurrentHeight - intHeight;
            // Perfomance the effect
            $('#lightbox-container-image-box').animate({ width: intWidth, height: intHeight }, settings.containerResizeSpeed, function () { _show_image(); });
            if ((intDiffW == 0) && (intDiffH == 0)) {
                if ($.browser.msie) {
                    ___pause(250);
                } else {
                    ___pause(100);
                }
            }
            $('#lightbox-container-image-data-box').css({ width: intImageWidth });
            $('#lightbox-nav-btnPrev,#lightbox-nav-btnNext').css({ height: intImageHeight + (settings.containerBorderSize * 2) });
        };
        /**
        * Show the prepared image
        *
        */
        function _show_image() {
            $('#lightbox-loading').hide();
            $('#lightbox-image').fadeIn(function () {
                _show_image_data();
                _set_navigation();
            });
            _preload_neighbor_images();
        };
        /**
        * Show the image information
        *
        */
        function _show_image_data() {
            $('#lightbox-container-image-data-box').slideDown('fast');
            $('#lightbox-image-details-caption').hide();
            if (settings.imageArray[settings.activeImage][1]) {
                $('#lightbox-image-details-caption').html(settings.imageArray[settings.activeImage][1]).show();
            }
            // If we have a image set, display 'Image X of X'
            if (settings.imageArray.length > 1) {
                $('#lightbox-image-details-currentNumber').html(settings.txtImage + ' ' + (settings.activeImage + 1) + ' ' + settings.txtOf + ' ' + settings.imageArray.length).show();
            }
        }
        /**
        * Display the button navigations
        *
        */
        function _set_navigation() {
            $('#lightbox-nav').show();

            // Instead to define this configuration in CSS file, we define here. And it´s need to IE. Just.
            $('#lightbox-nav-btnPrev,#lightbox-nav-btnNext').css({ 'background': 'transparent url(' + settings.imageBlank + ') no-repeat' });

            // Show the prev button, if not the first image in set
            if (settings.activeImage != 0) {
                if (settings.fixedNavigation) {
                    $('#lightbox-nav-btnPrev').css({ 'background': 'url(' + settings.imageBtnPrev + ') left 15% no-repeat' })
					.unbind()
					.bind('click', function () {
						settings.activeImage = settings.activeImage - 1;
						_set_image_to_view();
						return false;
					});
                } else {
                    // Show the images button for Next buttons
                    $('#lightbox-nav-btnPrev').unbind().hover(function () {
                        $(this).css({ 'background': 'url(' + settings.imageBtnPrev + ') left 15% no-repeat' });
                    }, function () {
                        $(this).css({ 'background': 'transparent url(' + settings.imageBlank + ') no-repeat' });
                    }).show().bind('click', function () {
                        settings.activeImage = settings.activeImage - 1;
                        _set_image_to_view();
                        return false;
                    });
                }
            }

            // Show the next button, if not the last image in set
            if (settings.activeImage != (settings.imageArray.length - 1)) {
                if (settings.fixedNavigation) {
                    $('#lightbox-nav-btnNext').css({ 'background': 'url(' + settings.imageBtnNext + ') right 15% no-repeat' })
					.unbind()
					.bind('click', function () {
						settings.activeImage = settings.activeImage + 1;
						_set_image_to_view();
						return false;
					});
                } else {
                    // Show the images button for Next buttons
                    $('#lightbox-nav-btnNext').unbind().hover(function () {
                        $(this).css({ 'background': 'url(' + settings.imageBtnNext + ') right 15% no-repeat' });
                    }, function () {
                        $(this).css({ 'background': 'transparent url(' + settings.imageBlank + ') no-repeat' });
                    }).show().bind('click', function () {
                        settings.activeImage = settings.activeImage + 1;
                        _set_image_to_view();
                        return false;
                    });
                }
            }
            // Enable keyboard navigation
            _enable_keyboard_navigation();
        }
        /**
        * Enable a support to keyboard navigation
        *
        */
        function _enable_keyboard_navigation() {
            $(document).keydown(function (objEvent) {
                _keyboard_action(objEvent);
            });
        }
        /**
        * Disable the support to keyboard navigation
        *
        */
        function _disable_keyboard_navigation() {
            $(document).unbind();
        }
        /**
        * Perform the keyboard actions
        *
        */
        function _keyboard_action(objEvent) {
            // To ie
            if (objEvent == null) {
                keycode = event.keyCode;
                escapeKey = 27;
                // To Mozilla
            } else {
                keycode = objEvent.keyCode;
                escapeKey = objEvent.DOM_VK_ESCAPE;
            }
            // Get the key in lower case form
            key = String.fromCharCode(keycode).toLowerCase();
            // Verify the keys to close the ligthBox
            if ((key == settings.keyToClose) || (key == 'x') || (keycode == escapeKey)) {
                _finish();
            }
            // Verify the key to show the previous image
            if ((key == settings.keyToPrev) || (keycode == 37)) {
                // If we´re not showing the first image, call the previous
                if (settings.activeImage != 0) {
                    settings.activeImage = settings.activeImage - 1;
                    _set_image_to_view();
                    _disable_keyboard_navigation();
                }
            }
            // Verify the key to show the next image
            if ((key == settings.keyToNext) || (keycode == 39)) {
                // If we´re not showing the last image, call the next
                if (settings.activeImage != (settings.imageArray.length - 1)) {
                    settings.activeImage = settings.activeImage + 1;
                    _set_image_to_view();
                    _disable_keyboard_navigation();
                }
            }
        }
        /**
        * Preload prev and next images being showed
        *
        */
        function _preload_neighbor_images() {
            if ((settings.imageArray.length - 1) > settings.activeImage) {
                objNext = new Image();
                objNext.src = settings.imageArray[settings.activeImage + 1][0];
            }
            if (settings.activeImage > 0) {
                objPrev = new Image();
                objPrev.src = settings.imageArray[settings.activeImage - 1][0];
            }
        }
        /**
        * Remove jQuery lightBox plugin HTML markup
        *
        */
        function _finish() {
            $('#jquery-lightbox').remove();
            $('#jquery-overlay').fadeOut(function () { $('#jquery-overlay').remove(); });
            // Show some elements to avoid conflict with overlay in IE. These elements appear above the overlay.
            $('embed, object, select').css({ 'visibility': 'visible' });
        }
        /**
        / THIRD FUNCTION
        * getPageSize() by quirksmode.com
        *
        * @return Array Return an array with page width, height and window width, height
        */
        function ___getPageSize() {
            var xScroll, yScroll;
            if (window.innerHeight && window.scrollMaxY) {
                xScroll = window.innerWidth + window.scrollMaxX;
                yScroll = window.innerHeight + window.scrollMaxY;
            } else if (document.body.scrollHeight > document.body.offsetHeight) { // all but Explorer Mac
                xScroll = document.body.scrollWidth;
                yScroll = document.body.scrollHeight;
            } else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
                xScroll = document.body.offsetWidth;
                yScroll = document.body.offsetHeight;
            }
            var windowWidth, windowHeight;
            if (self.innerHeight) {	// all except Explorer
                if (document.documentElement.clientWidth) {
                    windowWidth = document.documentElement.clientWidth;
                } else {
                    windowWidth = self.innerWidth;
                }
                windowHeight = self.innerHeight;
            } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
                windowWidth = document.documentElement.clientWidth;
                windowHeight = document.documentElement.clientHeight;
            } else if (document.body) { // other Explorers
                windowWidth = document.body.clientWidth;
                windowHeight = document.body.clientHeight;
            }
            // for small pages with total height less then height of the viewport
            if (yScroll < windowHeight) {
                pageHeight = windowHeight;
            } else {
                pageHeight = yScroll;
            }
            // for small pages with total width less then width of the viewport
            if (xScroll < windowWidth) {
                pageWidth = xScroll;
            } else {
                pageWidth = windowWidth;
            }
            arrayPageSize = new Array(pageWidth, pageHeight, windowWidth, windowHeight);
            return arrayPageSize;
        };
        /**
        / THIRD FUNCTION
        * getPageScroll() by quirksmode.com
        *
        * @return Array Return an array with x,y page scroll values.
        */
        function ___getPageScroll() {
            var xScroll, yScroll;
            if (self.pageYOffset) {
                yScroll = self.pageYOffset;
                xScroll = self.pageXOffset;
            } else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
                yScroll = document.documentElement.scrollTop;
                xScroll = document.documentElement.scrollLeft;
            } else if (document.body) {// all other Explorers
                yScroll = document.body.scrollTop;
                xScroll = document.body.scrollLeft;
            }
            arrayPageScroll = new Array(xScroll, yScroll);
            return arrayPageScroll;
        };
        /**
        * Stop the code execution from a escified time in milisecond
        *
        */
        function ___pause(ms) {
            var date = new Date();
            curDate = null;
            do { var curDate = new Date(); }
            while (curDate - date < ms);
        };
        // Return the jQuery object for chaining. The unbind method is used to avoid click conflict when the plugin is called more than once
        return this.unbind('click').click(_initialize);
    };

})(jQuery);
//entityeditor.ie9fix.js
function ConvertEntityToSpan(ctx, entity) 
{ULSGjk:; 
    if(matches[ctx]==null) 
        matches[ctx]=new Array(); 
    var key=entity.getAttribute("Key"); 
    var displayText=entity.getAttribute("DisplayText"); 
    var isResolved=entity.getAttribute("IsResolved"); 
    var description=entity.getAttribute("Description"); 
    var style='ms-entity-unresolved'; 
    if(isResolved=='True') 
        style='ms-entity-resolved'; 
    var spandata="<span id='span"+STSHtmlEncode(key)+"' isContentType='true' tabindex='-1' class='"+style+"' "; 
    if (browseris.ie8standard) 
        spandata+="onmouseover='this.contentEditable=false;' onmouseout='this.contentEditable=true;' contentEditable='true' "; 
    else 
        spandata+="contentEditable='false' "; 
    spandata+="title='"+STSHtmlEncode(description)+"'>" 
    spandata+="<div style='display:none;' id='divEntityData' "; 
    spandata+="key='"+STSHtmlEncode(key)+"' displaytext='"+STSHtmlEncode(displayText)+"' isresolved='"+STSHtmlEncode(isResolved)+"' "; 
    spandata+="description='"+STSHtmlEncode(description)+"'>"; 
    var multipleMatches=EntityEditor_SelectSingleNode(entity, "MultipleMatches"); 
    matches[ctx][key]=multipleMatches; 
    var extraData=EntityEditor_SelectSingleNode(entity, "ExtraData"); 
    if(extraData) 
    { 
        var data; 
        if(extraData.firstChild) 
            data=extraData.firstChild.xml; 
        if(!data) data=extraData.innerXml || extraData.innerHTML; 
        if(!data && document.implementation && document.implementation.createDocument) 
        { 
            var serializer=new XMLSerializer(); 
            data=serializer.serializeToString(extraData.firstChild); 
 
                    // **** CUSTOM FUNCTION **** 
            data = fixDataInIE9(data); 
        } 
        if(!data) data=''; 
        spandata+="<div data='"+STSHtmlEncode(data)+"'></div>"; 
    } 
    else 
    { 
        spandata+="<div data=''></div>"; 
    } 
    spandata+="</div>"; 
    if(PreferContentEditableDiv(ctx)) 
    { 
        if(browseris.safari) 
        { 
            spandata+="<span id='content' tabindex='-1' contenteditable='false'  onmousedown='onMouseDownRw(event);' onContextMenu='onContextMenuSpnRw(event,ctx);' >"; 
        } 
        else 
        { 
            spandata+="<span id='content' tabindex='-1' contenteditable onmousedown='onMouseDownRw(event);' onContextMenu='onContextMenuSpnRw(event,ctx);' >"; 
        } 
    } 
    else 
    { 
        spandata+="<span id='content' tabindex='-1' contenteditable onmousedown='onMouseDownRw(event);' onContextMenu='onContextMenuSpnRw(event,ctx);' >"; 
    } 
    if (browseris.ie8standard) 
        spandata+="\r"; 
    if(displayText !='') 
        spandata+=STSHtmlEncode(displayText); 
    else 
        spandata+=STSHtmlEncode(key); 
    if (browseris.ie8standard) 
        spandata+="\r</span></span>\r"; 
    else 
        spandata+="</span></span>"; 
    return spandata; 
} 
 
// **** CUSTOM FUNCTION **** 
function fixDataInIE9(data) 
{ 
    if(data.indexOf('<ArrayOfDictionaryEntry>') >= 0) 
    { 
        data = data.replace('<ArrayOfDictionaryEntry>', '<ArrayOfDictionaryEntry xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema-instance\">'); 
    } 
    return data; 
} 