
//  Light Bootstrap Painel - v2.0.1
// =========================================================
//
//  Product Page: https:
//  Copyright 2019 Creative Tim (https:
//  Licensed under MIT (https:
//
//  Coded by Creative Tim
//
// =========================================================
//
//  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

var searchVisible = 0;
var transparent = true;

var transparentDemo = true;
var fixedTop = false;

var navbar_initialized = false;
var mobile_menu_visible = 0,
    mobile_menu_initialized = false,
    toggle_initialized = false,
    bootstrap_nav_initialized = false,
    $sidebar,
    isWindows;

$(document).ready(function() {
    window_width = $(window).width();

                    mobile_menu_visible = 1;

                }
            });

            toggle_initialized = true;
        }
    }
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        }, wait);
        if (immediate && !timeout) func.apply(context, args);
    };
};
