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
                defaultContent: 'Note Data...',
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
            Component.menu_nbSel.on("click", 'a[role="menuitem"]', Actions.selectNotebook);
            Component.btn_reset.click(Actions.resetData);
            Component.btn_login.click(Actions.login);
            Component.btn_logout.click(Actions.logout);
            Component.btn_save.click(Actions.save);
            editor = new EpicEditor(opts).load();
            var localStorageData = $.jStorage.get(Consts.auth);
            if (localStorageData)
                Actions.fallback(localStorageData);
            App.cache.guid = $("li[data-default='true']").data('guid');
            window.autoSave = setInterval(Actions.autosave, 50);
            $('.dropdown-toggle').dropdown();
        }
    },
        Component = {
            alert: function(level, message) {
                $('<div class="alert fade in"><button type="button" class="close" data-dismiss="alert">×</button>' + message + '</div>')
                .addClass("alert-" + level)
                .appendTo(".wrapper")
                .delay(5000).slideUp(300);
            },
            menu_nbSel: $("#nbSelection .dropdown-menu"),
            field_title: $("#noteTitle"),
            label_nbSel: $("#nbSelected"),
            divider_nbSel: $("#nbSelection .divider"),
            btn_reset: $("#reset"),
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
            resetData: function () {
                clearInterval(window.autoSave);
                $.jStorage.deleteKey(Consts.auth);
                editor.unload();
                localStorage.removeItem("epiceditor");
                Component.field_title.val("");
                window.autoSave = setInterval(Actions.autosave, 100);
                editor.load();
            },
            login: function() {
                location.href = '/auth/evernote';
            },
            logout: function() {
                editor.getElement('editor').body.innerHTML = '';
                location.href = '/logout';
                App.initialize();
            },
            fallback: function (savedData) {
                Component.field_title.val(savedData.title);
            },
            autosave: function() {
                App.cache.title = Component.field_title.val();
                $.jStorage.set(Consts.auth, App.cache);
            },
            save: function(argument) {
                var preview = editor.getElement('previewer').body.innerHTML;
                $.ajax({
                    type: "POST",
                    url: "/saveNote",
                    data: {
                        guid: App.cache.guid,
                        title: App.cache.title,
                        content: $(preview).html()
                    },
                    error: function(argument) {
                        console.error(arguments);
                        Component.alert("error", "<b>Error!</b> Something went wrong during save.");
                    },
                    success: function() {
                        console.dir(arguments);
                        Component.alert("success", "<b>Success!!</b> Note Submitted!");

                    },
                    dataType: "json"
                });
            }
        };
    setTimeout(App.initialize, 0);
});