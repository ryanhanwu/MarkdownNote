$(function() {
    var Consts = {
            auth: "markdownNoteData"
        },
        editor, ref, opts = {
            container: 'epiceditor',
            basePath: 'epiceditor',
            clientSideStorage: true,
            useNativeFullsreen: true,
            parser: marked,
            file: {
                name: 'epiceditor',
                defaultContent: 'Note Data',
                autoSave: 100
            },
            theme: {
                base: '/themes/base/epiceditor.css',
                preview: '/themes/preview/github.css',
                editor: '/themes/editor/epic-dark.css'
            },
            focusOnLoad: false,
            shortcut: {
                modifier: 18,
                fullscreen: 70,
                preview: 80
            }
        };
    var App = {
        cache: {},
        initialize: function(argument) {
            if(typeof(user) !== "undefined") {
                App.authTokenEvernote = user.token;
                App.noteStoreURL = user.storeUrl;
                App.noteStoreTransport = new Thrift.BinaryHttpTransport(App.noteStoreURL);
                App.noteStoreProtocol = new Thrift.BinaryProtocol(App.noteStoreTransport);
                App.noteStore = new NoteStoreClient(App.noteStoreProtocol);
                App.noteStore.listNotebooks(App.authTokenEvernote, function(notebooks) {
                    App.notebooks = notebooks;
                    for(var i = notebooks.length; i--;) {
                        var notebook = notebooks[i];
                        $('<li role="presentation" data-guid="' + notebook.guid + '"><a role="menuitem" tabindex="-1">' + notebook.name + '</li>').insertBefore(Component.divider_nbSel);
                        if(notebook.defaultNotebook) {
                            $('<li role="presentation" data-guid="' + notebook.guid + '"><a role="menuitem" tabindex="-1">Default</li>').insertAfter(Component.divider_nbSel);
                        }
                    }
                }, function onerror(error) {
                    console.dir(error);
                    Component.alert("error", "<b>Error!</b> Something went wrong during login.");
                });
            }
        }
    },
        Component = {
            alert: function(level, message) {
                $('<div class="alert fade in"><button type="button" class="close" data-dismiss="alert">×</button>' + message + '</div>').addClass("alert-" + level).prependTo(".wrapper").delay(5000).slideUp(300);
            },
            menu_nbSel: $("#nbSelection .dropdown-menu"),
            field_title: $("#noteTitle"),
            label_nbSel: $("#nbSelected"),
            divider_nbSel: $("#nbSelection .divider"),
            btn_login: $("#login"),
            btn_logout: $("#logout"),
            btn_save: $("#save")
        },
        Actions = {
            selectNotebook: function(e) {
                var item = $(this);
                App.cache.guid = item.parent().data('guid');
                Component.label_nbSel.html("Current Notebook: " + item.html());
            },
            login: function() {
                location.href = '/auth/evernote';
            },
            logout: function(argument) {
                editor.getElement('editor').body.innerHTML = '';
                location.href = '/logout';
                App.initialize();
            },
            save: function(argument) {
                var preview = editor.getElement('previewer').body.innerHTML,
                    content = $(preview).html();
                var note = new Note();
                var skeleton = '<?xml version="1.0" encoding="UTF-8"?>';
                skeleton += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
                skeleton += '<en-note>' + content + '</en-note>';
                note.title = Component.field_title.val();
                note.guid = App.cache.guid;
                note.content = skeleton;
                App.noteStore.createNote(App.authTokenEvernote, note, function(argument) {
                    if(argument instanceof Thrift.TException) {
                        console.error(argument);
                        Component.alert.addClass("error").html("<b>Error!</b> Something went wrong during save.");
                    }
                    Component.alert("success", "<b>Success!!</b> Note Submitted!");
                });
            }
        };

    Component.menu_nbSel.on("click", 'a[role="menuitem"]', Actions.selectNotebook);
    Component.btn_login.click(Actions.login);
    Component.btn_logout.click(Actions.logout);
    Component.btn_save.click(Actions.save);

    editor = new EpicEditor(opts).load();

    $('.dropdown-toggle').dropdown();
    setTimeout(App.initialize, 0);
});