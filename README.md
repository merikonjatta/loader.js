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


License
=======

The MIT License

Copyright (c) 2011 Shinya Maeyama.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
