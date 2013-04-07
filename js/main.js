/* jQuery parseParams */
(function($) {
    var re = /([^&=]+)=?([^&]*)/g;
    var decodeREGX = /\+/g; 
    var decode = function(str) {
            return decodeURIComponent(str.replace(decodeREGX, " "));
        };
    $.parseParams = function(query) {
        var params = {},
            e;
        while(e = re.exec(query)) {
            var k = decode(e[1]),
                v = decode(e[2]);
            if(k.substring(k.length - 2) === '[]') {
                k = k.substring(0, k.length - 2);
                (params[k] || (params[k] = [])).push(v);
            } else params[k] = v;
        }
        return params;
    };
})(jQuery);
$(function() {
    var Consts = {
            auth : "markdownNoteData"
        },
        ref, checkAuthorized = function() {
            if(ref.document !== undefined && ref.document.URL !== undefined) {
                setTimeout(function() {

                    var url = ref.document.URL,
                        verifier = '';
                    var got_oauth = '';
                    var params = url.substr(url.indexOf('?') + 1);
                    params = params.split('&');
                    for(var i = 0; i < params.length; i++) {
                        var y = params[i].split('=');
                        if(y[0] === 'oauth_verifier') {
                            verifier = y[1];
                        } else if(y[0] === 'gotOAuth.html?oauth_token') {
                            got_oauth = y[1];
                        }
                    }
                    if(verifier !== '') {
                        app.oauth.setVerifier(verifier);
                        app.oauth.setAccessToken([got_oauth, app.cache.oauth_token_secret]);

                        var getData = {
                            'oauth_verifier': verifier
                        };
                        ref.close();
                        app.oauth.request({
                            'method': 'GET',
                            'url': app.evernoteHostName + '/oauth',
                            'success': app.success,
                            'failure': app.failure
                        });
                    } else {
                        checkAuthorized();
                    }
                }, 500);
            }
        },
        app = {
            cache: {},
            consumerKey: 'flyworld-2852',
            consumerSecret: '41ef7f788cbfe866',
            evernoteHostName: 'https://sandbox.evernote.com',
            success: function(data) {
                var isCallBackConfirmed = false;
                var token = '';
                var vars = data.text.split("&");
                for(var i = 0; i < vars.length; i++) {
                    var y = vars[i].split('=');
                    if(y[0] === 'oauth_token') {
                        token = y[1];
                    } else if(y[0] === 'oauth_token_secret') {
                        app.cache.oauth_token_secret = y[1];
                    } else if(y[0] === 'oauth_callback_confirmed') {
                        isCallBackConfirmed = true;
                    }
                }
                if(isCallBackConfirmed) {
                    ref = window.open(app.evernoteHostName + '/OAuth.action?oauth_token=' + token, '_blank');
                    checkAuthorized();
                } else {
                    app.cache.querystring = $.parseParams(data.text);
                    $.jStorage.set(Consts.auth, app.cache.querystring);
                    initialize();
                }
            },
            failure: function(error) {
                console.log('error ' + error.text);
            }
        };
    var loginWithEvernote = function() {
            options = {
                consumerKey: app.consumerKey,
                consumerSecret: app.consumerSecret,
                callbackUrl: "gotOAuth.html",
                signatureMethod: "HMAC-SHA1"
            };
            app.oauth = OAuth(options);
            // OAuth Step 1: Get request token
            app.oauth.request({
                'method': 'GET',
                'url': app.evernoteHostName + '/oauth',
                'success': app.success,
                'failure': app.failure
            });
        };
    var Component = {
        alert : function (level, message) {
            $('<div class="alert fade in"><button type="button" class="close" data-dismiss="alert">×</button>' + message + '</div>').addClass("alert-" + level).prependTo(".wrapper").delay(5000).slideUp(300);
        },
        sel_login : $(".needLogin"),
        menu_nbSel : $("#nbSelection .dropdown-menu"),
        field_title : $("#noteTitle"),
        label_nbSel : $("#nbSelected"),
        divider_nbSel : $("#nbSelection .divider"),
        btn_login : $("#login"),
        btn_logout : $("#logout"),
        btn_save : $("#save")
        },
        Actions = {
            selectNotebook : function (e) {
                var item = $(this);
                app.cache.guid = item.parent().data('guid');
                Component.label_nbSel.html("Current Notebook: " + item.html());
            }
        };

    Component.menu_nbSel.on("click", 'a[role="menuitem"]', Actions.selectNotebook);
    Component.btn_login.click(function(argument) {
        loginWithEvernote();
    });
    Component.btn_logout.click(function(){
        $.jStorage.flush();
        initialize();
    });
    Component.btn_save.click(function(argument) {
        var preview = editor.getElement('previewer').body.innerHTML,
            content = $(preview).html();
        var note = new Note();
        var skeleton = '<?xml version="1.0" encoding="UTF-8"?>';
        skeleton += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
        skeleton += '<en-note>' + content + '</en-note>';
        note.title = Component.field_title.val();
        note.guid = app.cache.guid;
        note.content = skeleton;
        app.noteStore.createNote(app.authTokenEvernote, note, function(argument) {
            if (argument instanceof Thrift.TException) {
                console.error(argument);
                Component.alert.addClass("error").html("<b>Error!</b> Something went wrong during save.");
            }
            Component.alert("success", "<b>Success!!</b> Note Submitted!");
        });
    });

    var opts = {
        container: 'epiceditor',
        basePath: 'epiceditor',
        clientSideStorage: true,
        localStorageName: 'epiceditor',
        useNativeFullsreen: true,
        parser: marked,
        file: {
            name: 'epiceditor',
            defaultContent: '',
            autoSave: 100
        },
        theme: {
            base: '/themes/base/epiceditor.css',
            preview: '/themes/preview/github.css',
            editor: '/themes/editor/epic-light.css'
        },
        focusOnLoad: false,
        shortcut: {
            modifier: 18,
            fullscreen: 70,
            preview: 80
        }
    };
    
    
    var initialize = function (argument) {
        var querystring = $.jStorage.get(Consts.auth);
        if (querystring !== null) {
            app.authTokenEvernote = querystring.oauth_token;
            app.noteStoreURL = querystring.edam_noteStoreUrl;
            app.noteStoreTransport = new Thrift.BinaryHttpTransport(app.noteStoreURL);
            app.noteStoreProtocol = new Thrift.BinaryProtocol(app.noteStoreTransport);
            app.noteStore = new NoteStoreClient(app.noteStoreProtocol);
            app.noteStore.listNotebooks(app.authTokenEvernote, function(notebooks) {
                app.notebooks = notebooks;
                for (var i = notebooks.length; i--;) {
                    var notebook = notebooks[i];
                    $('<li role="presentation" data-guid="' + notebook.guid + '"><a role="menuitem" tabindex="-1">' + notebook.name + '</li>').insertBefore(Component.divider_nbSel);
                    if(notebook.defaultNotebook) {
                        $('<li role="presentation" data-guid="' + notebook.guid + '"><a role="menuitem" tabindex="-1">Default</li>').insertAfter(Component.divider_nbSel);
                    }
                }
            }, function onerror(error) {
                console.dir(error);
                Component.alert.addClass("error").html("<b>Error!</b> Something went wrong during login.");
            });
            Component.btn_login.hide();
            Component.sel_login.show();
        } else {
            Component.btn_login.show();
            Component.sel_login.hide();
        }
    };
    var editor = new EpicEditor().load();
    $('.dropdown-toggle').dropdown();
    setTimeout(initialize, 0);
});