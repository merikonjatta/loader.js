
$(document).ready(function(){

  // YOU NEED TO CHANGE THIS ACCORDING TO WHERE YOU PLACED loader.js!
  var loader_js_location = "file:///C:/Projects/Javascript/loader.js/";


  /****************************************************
   * TEST HELPERS
   ****************************************************/
  var get_scripts_added_by_loader = function(){
    var regex_loaded_script = new RegExp(Loader.filename_postfix.replace("?", "\\?")+"$");
    var ret = [];
    $("script").each(function(idx, elem){
      if(regex_loaded_script.test(elem.src)){ ret.push(elem); };
    });
    return ret;
  };

  var is_empty_object = function(o){
    for (var i in o){
      return false;
    }
    return true;
  };

  var Mock = {
    store: {},
    make: function(funcname, newfunc){
      if (this.store[funcname]==undefined){
        this.store[funcname] = (function(){
          return eval(funcname);
        }).apply(arguments.caller);
      }
      (function(){
        eval(funcname+"=newfunc;");
      }).apply(arguments.caller);
    },
    revert: function(funcname){
      if(this.store[funcname]!=undefined){
        var self = this;
        (function(){
          eval(funcname+"=self.store[funcname];");
        }).apply(arguments.caller);
        this.store[funcname] = undefined;
      }
    },
    revert_all: function(){
      for(var funcname in this.store){
        this.revert(funcname);
      }
    },
  };


  /****************************************************
   * TEST CASES for LOADER
   ****************************************************/
  module("Loader", {
    setup: function(){
    },
    teardown: function(){
      Mock.revert_all();
      // Remove all script elements added by loader.js
      $.each(get_scripts_added_by_loader(), function(idx, elem){
        $(elem).remove();
      });
      // Reset the loader
      Loader.reset();
      if(!is_empty_object(Loader.callbacks)) { alert("Loader.reset() is not working! Test may be inaccurate."); }
      if(!is_empty_object(Loader.loading)) { alert("Loader.reset() is not working! Test may be inaccurate."); }
      if(!is_empty_object(Loader.loaded)) { alert("Loader.reset() is not working! Test may be inaccurate."); }
    }
  });

    
  test("head tag is determined", function() {
    equals(Loader.head, document.getElementsByTagName("head")[0]);
  });


  test("base url is determined", function() {
    equals(Loader.base_url, loader_js_location, "You may need to modify loader_js_location in test.js");
  });


  test("filename_postfix is ?loaderjs plus some number string", function(){
    var beginning = Loader.filename_postfix.slice(0,9);
    equals(beginning, "?loaderjs");
    var the_rest = Loader.filename_postfix.slice(9);
    equals(the_rest, new Number(the_rest).toString()); 
  });


  test("_extend shallow-copies object attributes", function(){
    var dest = {a:"a", d:"d"};
    var more = {a:"A", b:"B", c:{c1:"C1", c2:"C2"}};
    Loader._extend(dest, more);
    equals(dest.a, "A");
    equals(dest.b, "B");
    equals(dest.c, more.c);
    equals(dest.d, "d");
  });


  test("_is_array checks if array", function(){
    ok(Loader._is_array([0,1,2]));
    ok(Loader._is_array([]));
    ok(Loader._is_array(new Array(3)));
    ok(Loader._is_array(new Array(0)));
    ok(Loader._is_array(new Array("a", "b", "c")));
    ok(!Loader._is_array({0:0, 1:1, 2:2}));
    ok(!Loader._is_array(null));
  });


  test("attach appends a script element to head in relative URI", function(){
    var previous_script_count = $("script").length;
    var attached_tag = Loader.attach("script.js");
    var found_tag = $("script")[previous_script_count];
    
    equals(attached_tag, found_tag);
    equals($(found_tag).attr("src"), loader_js_location+"script.js", "You may need to modify loader_js_location in test.js");
    equals($(found_tag).attr("charset"), "utf-8");
    equals($(found_tag).attr("type"), "text/javascript");
    equals($(found_tag).parent().get(0), $("head")[0]);
  });


  test("attach doesn't change src if it starts with / or contains ://", function(){
    var attached_tag = Loader.attach("/script.js");
    equals($(attached_tag).attr("src"), "/script.js");

    var attached_tag = Loader.attach("http://site.com/script.js");
    equals($(attached_tag).attr("src"), "http://site.com/script.js");
  });


  test("_add_callback adds a callback for a file", function(){
    var cb = function(){};
    var cb2 = function(){};
    Loader._add_callback("script.js", cb);
    equals(Loader.callbacks["script.js"].length, 1);
    equals(Loader.callbacks["script.js"][0], cb);
    Loader._add_callback("script.js", cb2);
    equals(Loader.callbacks["script.js"].length, 2);
    equals(Loader.callbacks["script.js"][1], cb2);
  });


  test("_add_callback just makes the array if param evaluates to false", function(){
    Loader._add_callback("script.js", null); 
    equals(Loader.callbacks["script.js"].length, 0);
  });


  test("_load_file (when new file) attaches, adds callback, and sets loading", function(){
    var cb = function(){};
    var callback_added = false;
    var file_attached = false;
    Mock.make("Loader._add_callback", function(filename, callback){
      callback_added = true;
      equals(filename, "script.js",                         "filename for _add_callback");
      equals(callback, cb,                                  "callback for _add_callback");
    });
    Mock.make("Loader.attach", function(filename){
      file_attached = true;
      equals(filename, "script.js"+Loader.filename_postfix, "filename attached");
    });
    
    Loader._load_file("script.js", cb);
    ok(callback_added,                                      "Callback added?");
    ok(file_attached,                                       "File attached?");
    equals(Loader.loading["script.js"], true,               "Loading flag set?");
  });


  test("_load_file (when loading file) adds a callback but doesn't attach", function(){
    var cb = function(){};
    Loader.loading["script.js"] = true;

    var callback_added = false;
    Mock.make("Loader._add_callback", function(filename, callback){
      callback_added = true;
      equals(filename, "script.js");
      equals(callback, cb);
    });
    Mock.make("Loader.attach", function(filename){
      ok(false, "double-attached");
    });
    Loader._load_file("script.js", cb); // Load twice
    ok(callback_added);
  });


  test("_load_file (when file is loaded) adds callback and calls done", function(){
    var cb = function(){};
    Loader._load_file("script.js", cb);
    Loader.done("script.js");

    var callback_added = false;
    Mock.make("Loader._add_callback", function(filename, callback){
      callback_added = true;
      equals(filename, "script.js");
      equals(callback, cb);
    });
    Mock.make("Loader.attach", function(filename){
      ok(false, "File was attached");
    });
    Mock.make("Loader.done", function(filename){
      equals(filename, "script.js");
    });
    Loader._load_file("script.js", cb);
    ok(callback_added);
  });

  test("_load_file (when no callback) attaches", function(){
    var file_attached = false;
    Mock.make("Loader.attach", function(filename){
      file_attached = true;
    });
    Loader._load_file("script.js");
    ok(file_attached);
  });

  test("_load_file (when no callback) doesn't attach twice", function(){
    var attached = 0;
    Mock.make("Loader.attach", function(filename){
      attached++;
    });
    Loader._load_file("script.js");
    Loader._load_file("script.js");
    equals(1, attached);
  });


  test("done fires and deletes all callbacks for a filename", function(){
    var callback_one_called = false;
    var callback_two_called = false;
    var cb_one = function(){ callback_one_called = true; };
    var cb_two = function(){ callback_two_called = true; };

    Loader._load_file("script.js", cb_one);
    Loader._load_file("script.js", cb_two);
    Loader.done("script.js");
    ok(callback_one_called, "Callback one was not called.");
    ok(callback_two_called, "Callback two was not called.");
    equals(Loader.callbacks["script.js"].length, 0, "Callbacks are left in the cue");
  });


  test("load takes a string and callback to call _load_file", function(){
    var cb = function(){};
    var load_file_called = false;
    Mock.make("Loader._load_file", function(filename, callback){
      load_file_called = true;
      equals(filename, "script.js");
      equals(callback, cb);
    });
    Loader.load("script.js", cb);
    ok(load_file_called);
  });


  test("load takes an array and callback to call _load_file", function(){
    var cb = function(){};
    var load_file_called = false;
    var load_file_called_twice = false;
    var new_callback;

    // First load should _load_file "script.js" with a newly created callback
    Mock.make("Loader._load_file", function(filename, callback){
      load_file_called = true;
      equals(filename, "script.js");
      new_callback = callback;
    });
    Loader.load(["script.js", "script2.js"], cb);
    ok(load_file_called);

    // The new callback, when called, should _load_file "script2" with the original callback
    Mock.make("Loader._load_file", function(filename, callback){
      load_file_called_twice = true;
      equals(filename, "script2.js");
      equals(callback, cb);
    });
    new_callback.call();
    ok(load_file_called_twice);
  });


  test("overall test #1", function(){
    var cb1_called = false;
    var cb2_called = false;
    var cb1 = function(){ cb1_called = true; }
    var cb2 = function(){ cb2_called = true; }

    Loader.load("script.js", cb1);
    Loader.load(["script.js", "script2.js"], cb2);
    Loader.load("script3.js");

    Loader.done("script.js");
    ok(cb1_called);
    ok(!cb2_called);

    Loader.done("script2.js");
    ok(cb2_called);

    Loader.done("script3.js");

    equals(get_scripts_added_by_loader().length, 3);
  });

  

  /****************************************************
   * TEST CASES for WAITFOR
   ****************************************************/
  var wait_for = Loader.wait_for;
  module("WaitFor", {
    setup: function(){
    },
    teardown: function(){
      for(var i=0; i<wait_for.handles.length; i++){
        window.clearInterval(wait_for.handles[i]);
      }
      wait_for.handles = [];
      wait_for.timeout = 10*1000;
      wait_for.interval = 50;
    }
  });

  
  test("_actual waits for a single expression then executes", function(){
    equals(wait_for.handles.length, 0);
    var callback_called = false;
    window.testvar = false;

    wait_for._actual("window.testvar", window, function(){
      callback_called = true;
    });
    equals(wait_for.handles.length, 1);
    ok(!callback_called);

    window.testvar = true;
    stop();
    setTimeout(function(){ start(); ok(callback_called); }, 200);
  });


  test("_actual polls periodically", function(){
    window.tested_count = 0;
    wait_for._actual("((++window.tested_count)==3)", window, function(){});

    stop();
    setTimeout(function(){ start(); equals(tested_count, 3); }, 200);
  });


  test("_actual times out", function(){
    var callback_called = false;
    window.testvar = false;
    wait_for.timeout = 500;
    wait_for._actual("window.testvar", window, function(){
      alert("oh!");
      callback_called = true;
    });
    stop();
    setTimeout(function(){ window.testvar = true; }, 1000);
    setTimeout(function(){ start(); ok(!callback_called); }, 800);
  });


  test("_actual can test with specified scope", function(){
    var callback_called = false;
    var obj = {
      testvar: false
    };
    wait_for._actual("this.testvar", obj, function(){
      callback_called = true;
    });

    obj.testvar = true;
    stop();
    setTimeout(function(){ start(); ok(callback_called); }, 200);
  });


  test("_actual supresses any errors during evaluation", function(){
    // make sure this var is not defined yet
    var thrown = false;
    try{
      testvar2;
    } catch(e) {
      thrown = true;
    } finally {
      ok(thrown, "testvar2 might be already defined");
    }

    // now for the main part
    var thrown = false;
    try {
      wait_for._actual("testvar2", window, function(){});
    } catch(e){
      thrown = true;
    } finally {
      ok(!thrown);
    }
  });


  test("_actual instantly calls the callback if expression is already true", function(){
    var callback_called = false;
    wait_for._actual("true", window, function(){
      callback_called = true;
    });

    ok(callback_called);
  });


  test("wait_for will work with omitted context", function(){
    var actual_called = false;
    var cb = function(){};
    Mock.make("wait_for._actual", function(test, context, callback){
      equals(test, "testvar");
      equals(context, window);
      equals(callback, cb);
      actual_called = true;
    });

    wait_for("testvar", cb);
    ok(actual_called);
  });

  test("wait_for will work with an array of tests", function(){
    var actual_called = false;
    var cb = function(){};

    var new_cb;
    Mock.make("wait_for._actual", function(test, context, callback){
      equals(test, "testvar1");
      equals(context, window);
      new_cb = callback;
      actual_called = true;
    });
    wait_for(["testvar1", "testvar2"], cb);
    ok(actual_called);

    // the new callback passed to _actual, when, executed...
    var actual_called_twice = false;
    Mock.make("wait_for._actual", function(test, context, callback){
      equals(test, "testvar2");
      equals(context, window);
      equals(callback, cb);
      actual_called_twice = true;
    });
    new_cb.call();
    ok(actual_called_twice);
  });


});
