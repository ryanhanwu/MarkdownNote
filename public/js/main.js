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
            App.cache.guid = $("li[data-default='true']").data('guid');
        }
    },
        Component = {
            alert: function(level, message) {
                $('<div class="alert fade in"><button type="button" class="close" data-dismiss="alert">×</button>' + message + '</div>').addClass("alert-" + level).appendTo(".wrapper").delay(5000).slideUp(300);
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
                var preview = editor.getElement('previewer').body.innerHTML;
                $.ajax({
                    type: "POST",
                    url: "/saveNote",
                    data: {
                        guid: App.cache.guid,
                        title: Component.field_title.val(),
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

    Component.menu_nbSel.on("click", 'a[role="menuitem"]', Actions.selectNotebook);
    Component.btn_login.click(Actions.login);
    Component.btn_logout.click(Actions.logout);
    Component.btn_save.click(Actions.save);

    editor = new EpicEditor(opts).load();

    $('.dropdown-toggle').dropdown();
    setTimeout(App.initialize, 0);
});