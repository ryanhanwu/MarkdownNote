/* jQuery parseParams */
(function($) {
var re = /([^&=]+)=?([^&]*)/g;
var decodeRE = /\+/g;  // Regex for replacing addition symbol with a space
var decode = function (str) {return decodeURIComponent( str.replace(decodeRE, " ") );};
$.parseParams = function(query) {
    var params = {}, e;
    while ( e = re.exec(query) ) {
        var k = decode( e[1] ), v = decode( e[2] );
        if (k.substring(k.length - 2) === '[]') {
            k = k.substring(0, k.length - 2);
            (params[k] || (params[k] = [])).push(v);
        }
        else params[k] = v;
    }
    return params;
};
})(jQuery);

$(function() {
    var ref;
    function checkAuthorized() {
        if (ref.document !== undefined && ref.document.URL !== undefined) {
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
                console.dir('Check : ' + url);
                if (verifier !== '') {
                    app.oauth.setVerifier(verifier);
                    app.oauth.setAccessToken([got_oauth, localStorage.getItem("oauth_token_secret")]);

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
    }

    var app = {
        consumerKey: 'flyworld-2852',
        consumerSecret: '41ef7f788cbfe866',
        evernoteHostName: 'https://sandbox.evernote.com',
        // success: function() {
        //     console.dir('Success');
        //     console.dir(arguments);
        // },
        // failure: function() {
        //     console.dir("Faild");
        //     console.dir(arguments);
        // },
        success: function(data) {
            var isCallBackConfirmed = false;
            var token = '';
            var vars = data.text.split("&");
            for(var i = 0; i < vars.length; i++) {
                var y = vars[i].split('=');
                if(y[0] === 'oauth_token') {
                    token = y[1];
                } else if(y[0] === 'oauth_token_secret') {
                    this.oauth_token_secret = y[1];
                    localStorage.setItem("oauth_token_secret", y[1]);
                } else if(y[0] === 'oauth_callback_confirmed') {
                    isCallBackConfirmed = true;
                }
            }

            if(isCallBackConfirmed) {
                // step 2
                ref = window.open(app.evernoteHostName + '/OAuth.action?oauth_token=' + token, '_blank');
                checkAuthorized();
            } else {
                var querystring = $.parseParams(data.text);
                var authTokenEvernote = querystring.oauth_token;
                var noteStoreURL = querystring.edam_noteStoreUrl;
                var noteStoreTransport = new Thrift.BinaryHttpTransport(noteStoreURL);
                var noteStoreProtocol = new Thrift.BinaryProtocol(noteStoreTransport);
                var noteStore = new NoteStoreClient(noteStoreProtocol);
                noteStore.listNotebooks(authTokenEvernote, function(notebooks) {
                    console.log(notebooks);
                }, function onerror(error) {
                    console.log(error);
                });

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
                // this filename doesn't matter in this example
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
    $("#t").click(function(argument) {
        loginWithEvernote();
    });

    var opts = {
        container: 'epiceditor',
        basePath: 'epiceditor',
        clientSideStorage: false,
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
            preview: '/themes/preview/preview-dark.css',
            editor: '/themes/editor/epic-dark.css'
        },
        focusOnLoad: false,
        shortcut: {
            modifier: 18,
            fullscreen: 70,
            preview: 80
        }
    };
    var editor = new EpicEditor().load();
    editor.reflow();
    //Token : S=s1:U=64cae:E=1453b19e92f:C=13de368bd32:P=1cd:A=en-devtoken:V=2:H=d08d0e83a4929dd361998aae724d6366
    //NoteStore : https://sandbox.evernote.com/shard/s1/notestore
});