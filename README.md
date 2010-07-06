loader.js
=========

This is a script loader for in-browser javascript (similar to [RequireJS](http://requirejs.org/)).


Features
========

Load a single file or multiple files.
    Loader.load("util.js");
    Loader.load(["util.js", "i18n.js", "tetris.js"]);

Fire a callback after a file is loaded.
(This is different from RequireJS in that you need to specifically inform Loader that your file has been loaded.)
    Loader.load("fish.js", function(){
      Fish.splash(); 
    });

    // in fish.js
    Loader.done("fish.js");

Wait for a certain expression to be true, then execute a function.
    Loader.wait_for("MyLibrary", function(){
      MyLibrary.doThat().doThis();
    });


