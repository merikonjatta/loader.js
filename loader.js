(function(global){
  var Loader = {};
  Loader.regex_self       = /loader\.js$/i;
  Loader.regex_absolute   = /^\/|:\/\//;

  // Initialize. Note that this is called instantly afterwards
  Loader.init = Loader.reset = function(){
    this.filename_postfix = "?loaderjs"+((new Date()).getTime().toString());
    this.head             = null;
    this.base_url         = null;
    this.callbacks        = {};
    this.loading          = {};
    this.loaded           = {};

    // Determine the base URL and retrieve the head element.
    this.head = document.getElementsByTagName("head")[0] || document.documentElement;
    var scripts = document.getElementsByTagName("script");
    var src,idx,i;
    for (i=0; i<scripts.length; i++){
      if ((src=scripts[i].src) && ( (idx=src.search(this.regex_self) )!=-1)){
        this.base_url = src.substring(0, idx);
        break;
      }
    }
  };
  Loader.init();


  /**
   * Utilities
   */
  var extend = Loader._extend = function(target, subject){
    for (var i in subject){
      if (subject[i]!==null && subject.hasOwnProperty(i)){
        target[i] = subject[i];
      }
    }
  };
  var is_array = Loader._is_array = function(that){
    return (Object.prototype.toString.call(that) === "[object Array]");
  };
  var is_string = Loader._is_string = function(that){
    return (Object.prototype.toString.call(that) === "[object String]");
  };

  /*******************************************************************
   * The main Loader object
   *******************************************************************/
  extend(Loader, {

    /**
     * Load a script file.
     * Params:
     *   files: A filename string or an array of filenames.
     *   callback: A function to be called when all the files are completely loaded.
     *
     * The file paths will be modified to be relative to this file (loader.js).
     * So if this file is located at
     *   http://site.com/js/loader.js
     * and you do
     *   Loader.load("lib/a.js", function(){});
     * then you get
     *   http://site.com/js/lib/a.js
     * Filenames that start with "/" or contain "://" will not be modified.
     *
     * If you give an array of filenames, not that they will not be loaded in 
     * parallel: they will be loaded one after the other.
     *
     * File loading is deemed done when Loader.done(filename) is called.
     * For example, if you do 
     *   Loader.load(["a.js", "b.js"], function(){...});
     * the callback will be fired after
     *   Loader.done("a.js");
     *   Loader.done("b.js");
     * are both called. You should put these lines in a.js and b.js respectively.
     */
    load: function(files, callback){
      if (is_string(files)){ files = [files]; }
      if (is_array(files) && files.length>0){
        var filename=files.shift(), cb;
        if (files.length===0){
          cb = callback;
        } else {
          cb = function(){ Loader.load(files, callback); };
        }
        Loader._load_file(filename, cb);
      }
    },

    /**
     * Attach a script element to <head>.
     * Params:
     *   filename: A filename string
     * Returns: The script element
     *
     * The path will be interpreted relative to this file (loader.js).
     * Thus, if this file is located at
     *   http://site.com/js/loader.js
     * and you do
     *   Loader.attach("lib/a.js");
     * then you get
     *   http://site.com/js/lib/a.js
     */
    attach: function(filename){
      var node = document.createElement("script");
      node.type = "text/javascript";
      node.charset = "utf-8";
      if (Loader.regex_absolute.test(filename)){
        node.src = filename;
      } else {
        node.src = Loader.base_url + filename; 
      }
      Loader.head.appendChild(node);
      return node;
    },

    /**
     * A call to this function will declare a file loaded
     * and fire any callbacks registered for it.
     * Params:
     *   filename: A filename String
     */
    done: function(filename){
      Loader.loaded[filename] = true;
      Loader.loading[filename] = false;
      var callbacks = Loader.callbacks[filename];
      if (!callbacks){ return; }
      while(callbacks.length>0){
        callbacks.shift().call();
      }
    },

    // Attach a file and register a callback. 
    // Takes a single filename string and a callback function.
    _load_file: function(filename, callback){
      // Add the callback
      Loader._add_callback(filename, callback);
      
      // Already loaded?
      if(Loader.loaded[filename]) {
        Loader.done(filename);
        return;
      }

      // Already trying to load?
      if (Loader.loading[filename]) {
        return;
      }

      // New file?
      Loader.loading[filename] = true;
      Loader.attach(filename+Loader.filename_postfix);
      return;
    },

    // Add a callback for a file.
    _add_callback: function(filename, callback){
      var cbs = Loader.callbacks;
      if (!cbs[filename]){ cbs[filename] = []; }
      if (!callback){ return; }
      cbs[filename].push(callback);
    }

  });



  /*******************************************************************
   * The WaitFor functionality
   *******************************************************************/

  /**
   * Wait for a certain expression to evaluate to true, then
   * execute a function.
   * Params:
   *   test:     An expression String to be evaluated.
   *   context:  (optional) The test string will be eval'ed in this object's context.
   *   callback: The function to be executed
   *
   * The test string can be something like
   * 'typeof(MyLib)!=="undefined"'     or     'my_file_loaded===true'
   * We will suppress any ReferenceErrors, so If you want to
   * check for a presense of an object, you can simply do
   *   'MyLib'
   * 
   * If you omit the context arg, test will be evaluated in global scope.
   *
   * Evaluation of the test string will be done periodically until
   * it becomes true or the timeout is met.
   * If it times out, the callback will never be called.
   * You can change the interval and timeout with:
   *   Loader.wait_for.interval = 50;      // <- the default interval: 50 millisecs
   *   Loader.wait_for.timeout  = 10*1000; // <- the default timeout:  10 seconds
   */
  var WaitFor = function(){
    // Normalize arguments
    var test, context, callback;
    if (arguments.length===2){
      test = arguments[0];
      context = global;
      callback = arguments[1];
    } else if (arguments.length===3){
      test = arguments[0];
      context = arguments[1];
      callback = arguments[2];
    } else {
      throw new Error("wait_for() needs 2 or 3 arguments.");
    }

    // Are there multiple expressions to test?
    if (is_array(test)){
      if (test.length===1){
        WaitFor._actual(test[0], context, callback);
      } else {
        WaitFor._actual(test.shift(), context, function(){ WaitFor(test, context, callback); });
      }
    } else {
      WaitFor._actual(test, context, callback);
    }
  };

  extend(WaitFor, {
    // Settings
    interval: 50,
    timeout:  7*1000,
    throw_errors: false,

    // Keep a list of interval handles, just in case
    handles: [],

    // This is the function that actually does the waiting and executing.
    // test must be a single string, and context must be specified.
    _actual: function(test, context, callback){
      // Go ahead and try. Lucky if it's already there
      if (WaitFor._test_expression(test,context)){ callback.call(global); return; }

      // Otherwise set an interval
      var handle = global.setInterval((function(){
        var cnt=0;
        var cnt_limit = Math.floor(WaitFor.timeout/WaitFor.interval);
        return function(){
          if (WaitFor._test_expression(test,context)){
            global.clearInterval(handle);
            callback.call(global);
          } else {
            if (cnt++>=cnt_limit){
              global.clearInterval(handle);
              if (WaitFor.throw_errors){ throw new Error("wait_for() has timed out: aborted on \""+test+"\" after "+WaitFor.timeout+" msec."); }
            }
          }
        };
      })(), WaitFor.interval);
      this.handles.push(handle);
    },

    // Does an expression test to true in a certain context?
    // This will suppress any errors thrown
    _test_expression: function(test, context){
      try{
        return (function(){ return eval(test); }).apply(context);
      }catch(e){
      }
    }
  });


  // Set WaitFor as a property of Loader
  Loader.wait_for = WaitFor;

  // Expose to global
  global.Loader = Loader;
})(window);
