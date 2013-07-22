var util = require('util'),
    _ = require("underscore"),
    Evernote = require('evernote').Evernote;

exports.auth = function (req, res, next) {
    if (!req.user) {
        res.redirect("/");
        return;
    }
    next();
};
exports.index = function(req, res) {
    // console.dir(Evernote);
    var renderObj = {
        title: 'MarkdownNote',
        auth: false
    };
    if(req.user) {
        // console.dir(req.user);
        var token = req.user.token,
            transport = new Evernote.Thrift.NodeBinaryHttpTransport(req.user.storeUrl),
            protocol = new Evernote.Thrift.BinaryProtocol(transport),
            note_store = new Evernote.NoteStoreClient(protocol);
        note_store.listNotebooks(token, function(notebooks) {
            console.dir(notebooks);
            var userNotebooks = [];
            for(var i = notebooks.length; i--;) {
                var nb = notebooks[i];
                userNotebooks.push({
                    guid: nb.guid,
                    name: nb.name,
                    defaultNotebook: nb.defaultNotebook
                });
            }
            _.extend(renderObj, {
                auth: true,
                notebooks: userNotebooks
            });
            res.render('index', renderObj);
        });

    } else {
        res.render('index', renderObj);
    }


};
exports.validateSave = function (req, res, next) {
    req.assert('content', "Content is null").notEmpty();
    req.assert('title', "Title is null").notEmpty();
    req.assert('guid', "Didn't select any notebook").notEmpty();
    
    req.sanitize('content').trim();
    req.sanitize('title').trim();
    req.sanitize('guid').trim();

    var errors = req.validationErrors();

    if (errors) {
        res.send('Validation errors: ' + util.inspect(errors), 500);
        return;
    }
    next();
};
exports.save = function(req, res, next) {
    var token = req.user.token,
        transport = new Evernote.Thrift.NodeBinaryHttpTransport(req.user.storeUrl),
        protocol = new Evernote.Thrift.BinaryProtocol(transport),
        note_store = new Evernote.NoteStoreClient(protocol);
    var note = new Evernote.Note();
    var skeleton = '<?xml version="1.0" encoding="UTF-8"?>';
    skeleton += '<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd">';
    skeleton += '<en-note>' + req.body.content + '</en-note>';
    note.title = req.body.title;
    note.guid = req.body.guid;
    note.content = skeleton;
    note_store.createNote(token, note, function(argument) {
        if(argument instanceof Evernote.Thrift.TException) {
            console.error(argument);
            
            res.send({error : 100}, 500);
        }
        res.json({ success : 100});
    });
};