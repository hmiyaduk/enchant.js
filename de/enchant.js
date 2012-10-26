/**
 * enchant.js v0.5.2
 *
 * Copyright (c) Ubiquitous Entertainment Inc.
 * Dual licensed under the MIT or GPL Version 3 licenses
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

if (typeof Object.defineProperty !== 'function') {
    Object.defineProperty = function(obj, prop, desc) {
        if ('value' in desc) {
            obj[prop] = desc.value;
        }
        if ('get' in desc) {
            obj.__defineGetter__(prop, desc.get);
        }
        if ('set' in desc) {
            obj.__defineSetter__(prop, desc.set);
        }
        return obj;
    };
}
if (typeof Object.defineProperties !== 'function') {
    Object.defineProperties = function(obj, descs) {
        for (var prop in descs) {
            if (descs.hasOwnProperty(prop)) {
                Object.defineProperty(obj, prop, descs[prop]);
            }
        }
        return obj;
    };
}
if (typeof Object.create !== 'function') {
    Object.create = function(prototype, descs) {
        function F() {
        }

        F.prototype = prototype;
        var obj = new F();
        if (descs != null){
            Object.defineProperties(obj, descs);
        }
        return obj;
    };
}
if (typeof Object.getPrototypeOf !== 'function') {
    Object.getPrototypeOf = function(obj) {
        return obj.__proto__;
    };
}

if (typeof Function.prototype.bind !== 'function') {
    Function.prototype.bind = function(thisObject) {
        var func = this;
        var args = Array.prototype.slice.call(arguments, 1);
        var Nop = function() {
        };
        var bound = function() {
            var a = args.concat(Array.prototype.slice.call(arguments));
            return func.apply(
                this instanceof Nop ? this : thisObject || window, a);
        };
        Nop.prototype = func.prototype;
        bound.prototype = new Nop();
        return bound;
    };
}

/**
 * Globaler Export der Programmbibliotheken.
 *
 * Wenn keine Argument übergeben werden, werden alle Klassen die in enchant.js und in den Plugins
 * definiert sind exportiert. Falls mehr als ein Argument übergeben wurde, werden standardmäßig nur Klassen
 * die in enchant.js selbst definiert sind exporitert. Wenn auch Plugin Klassen exportiert werden sollen,
 * müssen die Plugin Bezeichner explizit als Argumente übergeben werden.
 *
 * @example
 *   enchant();     // alle Klassen werden exportiert.
 *   enchant('');   // nur Klassen die in enchant.js definiert sind werden exportiert.
 *   enchant('ui'); // enchant.js Klassen und ui.enchant.js Klassen werden exportiert.
 *
 * @param {...String} [modules] Module die exportiert werden sollen.
 */
var enchant = function(modules) {
    if (modules != null) {
        if (!(modules instanceof Array)) {
            modules = Array.prototype.slice.call(arguments);
        }
        modules = modules.filter(function(module) {
            return [module].join();
        });
    }
    (function include(module, prefix) {
        var submodules = [],
            i, len;
        for (var prop in module){
            if (module.hasOwnProperty(prop)) {
                if (typeof module[prop] === 'function') {
                    window[prop] = module[prop];
                } else if (typeof module[prop] === 'object' && Object.getPrototypeOf(module[prop]) === Object.prototype) {
                    if (modules == null) {
                        submodules.push(prop);
                    } else {
                        i = modules.indexOf(prefix + prop);
                        if (i !== -1) {
                            submodules.push(prop);
                            modules.splice(i, 1);
                        }
                    }
                }
            }
        }

        for (i = 0, len = submodules.length; i < len; i++) {
            include(module[submodules[i]], prefix + submodules[i] + '.');
        }
    }(enchant, ''));

    if (modules != null && modules.length) {
        throw new Error('Cannot load module: ' + modules.join(', '));
    }
};

window.addEventListener("message", function(msg, origin) {
    try {
        var data = JSON.parse(msg.data);
        if (data.type === "event") {
            enchant.Core.instance.dispatchEvent(new enchant.Event(data.value));
        } else if (data.type === "debug") {
            switch (data.value) {
                case "start":
                    enchant.Core.instance.start();
                    break;
                case "pause":
                    enchant.Core.instance.pause();
                    break;
                case "resume":
                    enchant.Core.instance.resume();
                    break;
                case "tick":
                    enchant.Core.instance._tick();
                    break;
                default:
                    break;
            }
        }
    } catch (e) {
        // ignore
    }
}, false);

/**
 * Eine Klasse für Klassen, die Vererbung unterstützen.
 *
 * @param {Function} [superclass] Die Klasse, deren Klassendefinition
 * die neue Klasse erben wird.
 * @param {*} definition Klassendefinition.
 * @constructor
 */

enchant.Class = function(superclass, definition) {
    return enchant.Class.create(superclass, definition);
};

/**
 * Erstellt eine neue Klasse
 *
 * Wenn eine Klasse definiert wird, die von einer anderen Klasse erbt, wird der Konstruktor der
 * Basisklasse als Standard definiert. Sollte dieser Konstruktor in der neuen Klasse überschrieben
 * werden, sollte der vorherige Konstruktor explizit aufgerufen werden, um eine korrekte
 * Klasseninitialisierung sicherzustellen.
 * 
 * @example
 *   var Ball = Class.create({ // definiert eine unabhängige Klasse.
 *       initialize: function(radius) { ... }, // Methodendefinitionen
 *       fall: function() { ... }
 *   });
 *
 *   var Ball = Class.create(Sprite);  // definiert eine Klasse die von "Sprite" erbt.
 *   var Ball = Class.create(Sprite, { // definiert eine Klasse die von "Sprite" erbt.
 *       initialize: function(radius) { // überschreibt den Standardkonstruktor.
 *          Sprite.call(this, radius*2, radius*2); // Aufruf des Konstruktors der Basisklasse.
 *          this.image = game.assets['ball.gif'];
 *       }
 *   });
 *
 * @param {Function} [superclass] Die Klasse, deren Klassendefinition
 * die neue Klasse erben wird.
 * @param {*} definition Klassendefinition.
 * @static
 */
enchant.Class.create = function(superclass, definition) {
    if (arguments.length === 0) {
        return enchant.Class.create(Object, definition);
    } else if (arguments.length === 1 && typeof arguments[0] !== 'function') {
        return enchant.Class.create(Object, arguments[0]);
    }

    for (var prop in definition) {
        if (definition.hasOwnProperty(prop)) {
            if (typeof definition[prop] === 'object' && Object.getPrototypeOf(definition[prop]) === Object.prototype) {
                if (!('enumerable' in definition[prop])) {
                    definition[prop].enumerable = true;
                }
            } else {
                definition[prop] = { value: definition[prop], enumerable: true, writable: true };
            }
        }
    }
    var Constructor = function() {
        if (this instanceof Constructor) {
            Constructor.prototype.initialize.apply(this, arguments);
        } else {
            return new Constructor();
        }
    };
    Constructor.prototype = Object.create(superclass.prototype, definition);
    Constructor.prototype.constructor = Constructor;
    if (Constructor.prototype.initialize == null) {
        Constructor.prototype.initialize = function() {
            superclass.apply(this, arguments);
        };
    }

    return Constructor;
};
/**
 * Umgebungsvariable
 * @type {Object}
 */
enchant.ENV = {
    /**
     * css vendor prefix in current browser
     * @type {String}
     */
    VENDOR_PREFIX: (function() {
        var ua = navigator.userAgent;
        if (ua.indexOf('Opera') !== -1) {
            return 'O';
        } else if (ua.indexOf('MSIE') !== -1) {
            return 'ms';
        } else if (ua.indexOf('WebKit') !== -1) {
            return 'webkit';
        } else if (navigator.product === 'Gecko') {
            return 'Moz';
        } else {
            return '';
        }
    }()),
    /**
     * CSS vendor prefix in current browser
     * @type {String}
     */
    TOUCH_ENABLED: (function() {
        var div = document.createElement('div');
        div.setAttribute('ontouchstart', 'return');
        return typeof div.ontouchstart === 'function';
    }()),
    /**
     * Is this browser iPhone with Retina display?
     * @type {String}
     */
    RETINA_DISPLAY: (function() {
        if (navigator.userAgent.indexOf('iPhone') !== -1 && window.devicePixelRatio === 2) {
            var viewport = document.querySelector('meta[name="viewport"]');
            if (viewport == null) {
                viewport = document.createElement('meta');
                document.head.appendChild(viewport);
            }
            viewport.setAttribute('content', 'width=640');
            return true;
        } else {
            return false;
        }
    }()),
    /**
     * Use Flash instead of native Audio class?
     * @type {String}
     */
    USE_FLASH_SOUND: (function() {
        var ua = navigator.userAgent;
        var vendor = navigator.vendor || "";
        // ローカルではなく、モバイル端末向けでもなく、Safariでもない場合 (デフォルト)
        return (location.href.indexOf('http') === 0 && ua.indexOf('Mobile') === -1 && vendor.indexOf('Apple') !== -1);
    }()),
    /**
     * On click/touch event in these tags, setPreventDefault() will not be called
     */
    USE_DEFAULT_EVENT_TAGS: ['input', 'textarea', 'select', 'area'],
    CANVAS_DRAWING_METHODS: [
        'putImageData', 'drawImage', 'drawFocusRing', 'fill', 'stroke',
        'clearRect', 'fillRect', 'strokeRect', 'fillText', 'strokeText'
    ],
    KEY_BIND_TABLE: {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    },
    PREVENT_DEFAULT_KEY_CODES: [37, 38, 39, 40, 32]
};

/**
 * @scope enchant.Event.prototype
 */
enchant.Event = enchant.Class.create({
    /**
     * Eine Klasse für eine unabhängige Implementierung von Ereignissen 
     * (Events), ähnlich wie DOM Events.
     * Jedoch wird das Phasenkonzept nicht unterstützt.
     * @param {String} type Event Typ.
     * @constructs
     */
    initialize: function(type) {
        /**
         * Typ des Ereignis.
         * @type {String}
         */
        this.type = type;
        /**
         * Ziel des Ereignis.
         * @type {*}
         */
        this.target = null;
        /**
         * X Koordinate des Auftretens des Ereignis.
         * @type {Number}
         */
        this.x = 0;
        /**
         * Y Koordinate des Auftretens des Ereignis.
         * @type {Number}
         */
        this.y = 0;
        /**
         * X Koordinate des lokalen Koordinatensystems des Auftretens des Ereignis.
         * @type {Number}
         */
        this.localX = 0;
        /**
         * Y Koordinate des lokalen Koordinatensystems des Auftretens des Ereignis.
         * @type {Number}
         */
        this.localY = 0;
    },
    _initPosition: function(pageX, pageY) {
        var core = enchant.Core.instance;
        this.x = this.localX = (pageX - core._pageX) / core.scale;
        this.y = this.localY = (pageY - core._pageY) / core.scale;
    }
});

/**
 * Ereignis, dass auftritt wenn das Laden des Spieles abgeschlossen wurde.
 *
 * Wenn Grafiken im voraus geladen werden ist es notwendig, auf dieses Ereignis zu warten bis mit
 * diesen gearbeitet werden kann. 
 * Objekt des Auftretens: {@link enchant.Game}
 *
 * @example
 *   var game = new Game(320, 320);
 *   game.preload('player.gif');
 *   game.onload = function() {
 *      ... // initialisierung des Spieles 
 *   };
 *   game.start();
 *
 * @type {String}
 */
enchant.Event.LOAD = 'load';

/**
 * Ereignis, welches während des Ladens des Spieles auftritt.
 * Das Ereignis tritt jedesmal auf, wenn eine im voraus geladene Grafik geladen wurde.
 * Objekt des Auftretens: enchant.Core
 * @type {String}
 */
enchant.Event.PROGRESS = 'progress';

/**
 * Ereignis, welches auftritt wenn ein neuer Frame bearbeitet wird.
 * Objekt des Auftretens: enchant.Core, enchant.Node
 * @type {String}
 */
enchant.Event.ENTER_FRAME = 'enterframe';

/**
 * Ereignis, welches auftritt wenn ein Frame beendet wird.
 * Objekt des Auftretens: enchant.Core
 * @type {String}
 */
enchant.Event.EXIT_FRAME = 'exitframe';

/**
 * Ereignis, dass auftritt wenn eine neue Szene
 * ({@link enchant.Scene}) beginnt.
 * Objekt des Auftretens: {@link enchant.Scene}
 * @type {String}
 */
enchant.Event.ENTER = 'enter';

/**
 * Ereignis, dass auftritt wenn eine Szene
 * ({@link enchant.Scene}) endet.
 * Objekt des Auftretens: {@link enchant.Scene}
 * @type {String}
 */
enchant.Event.EXIT = 'exit';

/**
 * Ereignis, welchses auftritt wenn ein Kindelement zu einem Node
 * hinzugefügt wird.
 * Objekt des Auftretens: {@link enchant.Group}, {@link enchant.Scene}
 * @type {String}
 */
enchant.Event.CHILD_ADDED = 'childadded';

/**
 * Ereignis, welchses auftritt wenn der Node zu einer Gruppe
 * hinzugefügt wird.
 * Objekt des Auftretens: {@link enchant.Node}
 * @type {String}
 */
enchant.Event.ADDED = 'added';

/**
 * Ereignis, welchses auftritt wenn der Node zu einer Szene
 * hinzugefügt wird.
 * Objekt des Auftretens: {@link enchant.Node}
 * @type {String}
 */
enchant.Event.ADDED_TO_SCENE = 'addedtoscene';

/**
 * Ereignis, welchses auftritt wenn ein Kindelement von einem Node
 * entfernt wird.
 * Objekt des Auftretens: {@link enchant.Group}, {@link enchant.Scene}
 * @type {String}
 */
enchant.Event.CHILD_REMOVED = 'childremoved';

/**
 * Ereignis, welchses auftritt wenn der Node aus einer Gruppe
 * entfernt wird.
 * Objekt des Auftretens: {@link enchant.Node}
 * @type {String}
 */
enchant.Event.REMOVED = 'removed';

/**
 * Ereignis, welchses auftritt wenn der Node aus einer Szene
 * entfernt wird.
 * Objekt des Auftretens: {@link enchant.Node}
 * @type {String}
 */
enchant.Event.REMOVED_FROM_SCENE = 'removedfromscene';

/**
 * Ereignis, welchses auftritt wenn ein Touch auf einen Node
 * beginnt. Klicks werden als Touch behandelt.
 * Objekt des Auftretens: {@link enchant.Node}
 * @type {String}
 */
enchant.Event.TOUCH_START = 'touchstart';

/**
 * Ereignis, welchses auftritt wenn ein Touch auf einen Node
 * bewegt wurde. Klicks werden als Touch behandelt.
 * Objekt des Auftretens: {@link enchant.Node}
 * @type {String}
 */
enchant.Event.TOUCH_MOVE = 'touchmove';

/**
 * Ereignis, welchses auftritt wenn ein Touch auf einen Node
 * endet. Klicks werden als Touch behandelt.
 * Objekt des Auftretens: {@link enchant.Node}
 * @type {String}
 */
enchant.Event.TOUCH_END = 'touchend';

/**
 * Ereignis, welchses auftritt wenn eine Entity
 * gerendert wird.
 * Objekt des Auftretens: {@link enchant.Entity}
 * @type {String}
 */
enchant.Event.RENDER = 'render';

/**
 * Ereignis, welchses auftritt wenn ein Knopf gedückt wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.INPUT_START = 'inputstart';

/**
 * Ereignis, welchses auftritt wenn eine Knopfeingabe verändert wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scen}
 * @type {String}
 */
enchant.Event.INPUT_CHANGE = 'inputchange';

/**
 * Ereignis, welchses auftritt wenn eine Knopf losgelassen wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.INPUT_END = 'inputend';

/**
 * Ereignis, welchses auftritt wenn der "Nach Links"-Knopf gedrückt wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.LEFT_BUTTON_DOWN = 'leftbuttondown';

/**
 * Ereignis, welchses auftritt wenn der "Nach Links"-Knopf losgelassen wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.LEFT_BUTTON_UP = 'leftbuttonup';

/**
 * Ereignis, welchses auftritt wenn der "Nach Rechts"-Knopf gedrückt wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.RIGHT_BUTTON_DOWN = 'rightbuttondown';

/**
 * Ereignis, welchses auftritt wenn der "Nach Rechts"-Knopf losgelassen wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.RIGHT_BUTTON_UP = 'rightbuttonup';

/**
 * Ereignis, welchses auftritt wenn der "Nach Oben"-Knopf gedrückt wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.UP_BUTTON_DOWN = 'upbuttondown';

/**
 * Ereignis, welchses auftritt wenn der "Nach Oben"-Knopf losgelassen wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.UP_BUTTON_UP = 'upbuttonup';

/**
 * Ereignis, welchses auftritt wenn der "Nach Unten"-Knopf gedrückt wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.DOWN_BUTTON_DOWN = 'downbuttondown';

/**
 * Ereignis, welchses auftritt wenn der "Nach Unten"-Knopf losgelassen wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.DOWN_BUTTON_UP = 'downbuttonup';

/**
 * Ereignis, welchses auftritt wenn der "A"-Knopf gedrückt wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.A_BUTTON_DOWN = 'abuttondown';

/**
 * Ereignis, welchses auftritt wenn der "A"-Knopf losgelassen wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.A_BUTTON_UP = 'abuttonup';

/**
 * Ereignis, welchses auftritt wenn der "B"-Knopf gedrückt wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.B_BUTTON_DOWN = 'bbuttondown';

/**
 * Ereignis, welchses auftritt wenn der "B"-Knopf losgelassen wird.
 * Objekt des Auftretens: enchant.Core, enchant.Scene
 * @type {String}
 */
enchant.Event.B_BUTTON_UP = 'bbuttonup';

/**
 * @scope enchant.EventTarget.prototype
 */
enchant.EventTarget = enchant.Class.create({
    /**
     * Eine Klasse für eine unabhängige Implementierung von Ereignissen 
     * (Events), ähnlich wie DOM Events.
     * Jedoch wird das Phasenkonzept nicht unterstützt.
     * @constructs
     */
    initialize: function() {
        this._listeners = {};
    },
    /**
     * Fügt einen neuen Ereignisbeobachter hinzu, welcher beim Auftreten des
     * Events ausgeführt wird.
     * @param {String} type Ereignis Typ.
     * @param {function(e:enchant.Event)} listener Der Ereignisbeobachter 
     * der hinzugefügt wird.
     */
    addEventListener: function(type, listener) {
        var listeners = this._listeners[type];
        if (listeners == null) {
            this._listeners[type] = [listener];
        } else if (listeners.indexOf(listener) === -1) {
            listeners.unshift(listener);

        }
    },
    /**
     * Synonym for addEventListener
     * @see {enchant.EventTarget#addEventListener}
     * @param {String} type Event type.
     * @param {function(e:enchant.Event)} listener EventListener to be added.
     */
    on: function() {
        this.addEventListener.apply(this, arguments);
    },
    /**
     * Entfernt einen Ereignisbeobachter.
     * @param {String} type Ereignis Typ.
     * @param {function(e:enchant.Event)} listener Der Ereignisbeobachter 
     * der entfernt wird.
     */
    removeEventListener: function(type, listener) {
        var listeners = this._listeners[type];
        if (listeners != null) {
            var i = listeners.indexOf(listener);
            if (i !== -1) {
                listeners.splice(i, 1);
            }
        }
    },
    /**
     * Entfernt alle Ereignisbeobachter für einen Typ.
     * Wenn kein Typ gegeben ist, werden alle 
     * Ereignisbeobachter entfernt.
     * @param [String] type Ereignis Typ.
     */
    clearEventListener: function(type) {
        if (type != null) {
            delete this._listeners[type];
        } else {
            this._listeners = {};
        }
    },
    /**
     * Löst ein Ereignis aus.
     * @param {enchant.Event} e Ereignis das ausgelöst werden soll.
     */
    dispatchEvent: function(e) {
        e.target = this;
        e.localX = e.x - this._offsetX;
        e.localY = e.y - this._offsetY;
        if (this['on' + e.type] != null){
            this['on' + e.type](e);
        }
        var listeners = this._listeners[e.type];
        if (listeners != null) {
            listeners = listeners.slice();
            for (var i = 0, len = listeners.length; i < len; i++) {
                listeners[i].call(this, e);
            }
        }
    }
});

/**
 * @scope enchant.Core.prototype
 */

(function() {
    var core;

    /**
     */
    enchant.Core = enchant.Class.create(enchant.EventTarget, {
        /**
         */
        initialize: function(width, height) {
            if (window.document.body === null) {
                throw new Error("document.body is null. Please excute 'new Core()' in window.onload.");
            }

            enchant.EventTarget.call(this);
            var initial = true;
            if (core) {
                initial = false;
                core.stop();
            }
            core = enchant.Core.instance = this;

            /**
             */
            this.width = width || 320;
            /**
             */
            this.height = height || 320;
            /**
             */
            this.scale = 1;

            var stage = document.getElementById('enchant-stage');
            if (!stage) {
                stage = document.createElement('div');
                stage.id = 'enchant-stage';
                stage.style.width = window.innerWidth + 'px';
                stage.style.height = window.innerHeight + 'px';
                stage.style.position = 'absolute';
                if (document.body.firstChild) {
                    document.body.insertBefore(stage, document.body.firstChild);
                } else {
                    document.body.appendChild(stage);
                }
                this.scale = Math.min(
                    window.innerWidth / this.width,
                    window.innerHeight / this.height
                );
                this._pageX = 0;
                this._pageY = 0;
            } else {
                var style = window.getComputedStyle(stage);
                width = parseInt(style.width, 10);
                height = parseInt(style.height, 10);
                if (width && height) {
                    this.scale = Math.min(
                        width / this.width,
                        height / this.height
                    );
                } else {
                    stage.style.width = this.width + 'px';
                    stage.style.height = this.height + 'px';
                }
                while (stage.firstChild) {
                    stage.removeChild(stage.firstChild);
                }
                stage.style.position = 'relative';
                var bounding = stage.getBoundingClientRect();
                this._pageX = Math.round(window.scrollX + bounding.left);
                this._pageY = Math.round(window.scrollY + bounding.top);
            }
            if (!this.scale) {
                this.scale = 1;
            }
            stage.style.fontSize = '12px';
            stage.style.webkitTextSizeAdjust = 'none';
            this._element = stage;

            /**
             */
            this.fps = 30;
            /**
             */
            this.frame = 0;
            /**
             */
            this.ready = null;
            /**
             */
            this.running = false;
            /**
             */
            this.assets = {};
            var assets = this._assets = [];
            (function detectAssets(module) {
                if (module.assets instanceof Array) {
                    [].push.apply(assets, module.assets);
                }
                for (var prop in module) {
                    if (module.hasOwnProperty(prop)) {
                        if (typeof module[prop] === 'object' && Object.getPrototypeOf(module[prop]) === Object.prototype) {
                            detectAssets(module[prop]);
                        }
                    }
                }
            }(enchant));

            this._scenes = [];
            /**
             */
            this.currentScene = null;
            /**
             */
            this.rootScene = new enchant.Scene();
            this.pushScene(this.rootScene);
            /**
             */
            this.loadingScene = new enchant.Scene();
            this.loadingScene.backgroundColor = '#000';
            var barWidth = this.width * 0.4 | 0;
            var barHeight = this.width * 0.05 | 0;
            var border = barWidth * 0.03 | 0;
            var bar = new enchant.Sprite(barWidth, barHeight);

            bar.x = (this.width - barWidth) / 2;
            bar.y = (this.height - barHeight) / 2;
            var image = new enchant.Surface(barWidth, barHeight);
            image.context.fillStyle = '#fff';
            image.context.fillRect(0, 0, barWidth, barHeight);
            image.context.fillStyle = '#000';
            image.context.fillRect(border, border, barWidth - border * 2, barHeight - border * 2);
            bar.image = image;
            var progress = 0, _progress = 0;
            this.addEventListener('progress', function(e) {
                progress = e.loaded / e.total;
            });
            bar.addEventListener('enterframe', function() {
                _progress *= 0.9;
                _progress += progress * 0.1;
                image.context.fillStyle = '#fff';
                image.context.fillRect(border, 0, (barWidth - border * 2) * _progress, barHeight);
            });
            this.loadingScene.addChild(bar);

            this._mousedownID = 0;
            this._surfaceID = 0;
            this._soundID = 0;
            this._intervalID = null;

            this._offsetX = 0;
            this._offsetY = 0;

            /**
             */
            this.input = {};
            this._keybind = enchant.ENV.KEY_BIND_TABLE || {};

            var c = 0;
            ['left', 'right', 'up', 'down', 'a', 'b'].forEach(function(type) {
                this.addEventListener(type + 'buttondown', function(e) {
                    var inputEvent;
                    if (!this.input[type]) {
                        this.input[type] = true;
                        inputEvent = new enchant.Event((c++) ? 'inputchange' : 'inputstart');
                        this.dispatchEvent(inputEvent);
                    }
                    this.currentScene.dispatchEvent(e);
                    if (inputEvent) {
                        this.currentScene.dispatchEvent(inputEvent);
                    }
                });
                this.addEventListener(type + 'buttonup', function(e) {
                    var inputEvent;
                    if (this.input[type]) {
                        this.input[type] = false;
                        inputEvent = new enchant.Event((--c) ? 'inputchange' : 'inputend');
                        this.dispatchEvent(inputEvent);
                    }
                    this.currentScene.dispatchEvent(e);
                    if (inputEvent) {
                        this.currentScene.dispatchEvent(inputEvent);
                    }
                });
            }, this);

            if (initial) {
                stage = enchant.Core.instance._element;
                var evt;
                document.addEventListener('keydown', function(e) {
                    core.dispatchEvent(new enchant.Event('keydown'));
                    if (enchant.ENV.PREVENT_DEFAULT_KEY_CODES.indexOf(e.keyCode) !== -1) {
                        e.preventDefault();
                        e.stopPropagation();
                    }

                    if (!core.running) {
                        return;
                    }
                    var button = core._keybind[e.keyCode];
                    if (button) {
                        evt = new enchant.Event(button + 'buttondown');
                        core.dispatchEvent(evt);
                    }
                }, true);
                document.addEventListener('keyup', function(e) {
                    if (!core.running) {
                        return;
                    }
                    var button = core._keybind[e.keyCode];
                    if (button) {
                        evt = new enchant.Event(button + 'buttonup');
                        core.dispatchEvent(evt);
                    }
                }, true);

                if (enchant.ENV.TOUCH_ENABLED) {
                    stage.addEventListener('touchstart', function(e) {
                        var tagName = (e.target.tagName).toLowerCase();
                        if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                            e.preventDefault();
                            if (!core.running) {
                                e.stopPropagation();
                            }
                        }
                    }, true);
                    stage.addEventListener('touchmove', function(e) {
                        var tagName = (e.target.tagName).toLowerCase();
                        if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                            e.preventDefault();
                            if (!core.running) {
                                e.stopPropagation();
                            }
                        }
                    }, true);
                    stage.addEventListener('touchend', function(e) {
                        var tagName = (e.target.tagName).toLowerCase();
                        if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                            e.preventDefault();
                            if (!core.running) {
                                e.stopPropagation();
                            }
                        }
                    }, true);
                }
                stage.addEventListener('mousedown', function(e) {
                    var tagName = (e.target.tagName).toLowerCase();
                    if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                        e.preventDefault();
                        core._mousedownID++;
                        if (!core.running) {
                            e.stopPropagation();
                        }
                    }
                }, true);
                stage.addEventListener('mousemove', function(e) {
                    var tagName = (e.target.tagName).toLowerCase();
                    if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                        e.preventDefault();
                        if (!core.running) {
                            e.stopPropagation();
                        }
                    }
                }, true);
                stage.addEventListener('mouseup', function(e) {
                    var tagName = (e.target.tagName).toLowerCase();
                    if (enchant.ENV.USE_DEFAULT_EVENT_TAGS.indexOf(tagName) === -1) {
                        // フォームじゃない
                        e.preventDefault();
                        if (!core.running) {
                            e.stopPropagation();
                        }
                    }
                }, true);
            }
        },
        /**
         */
        preload: function(assets) {
            if (!(assets instanceof Array)) {
                assets = Array.prototype.slice.call(arguments);
            }
            [].push.apply(this._assets, assets);
        },
        /**
         */
        load: function(src, callback) {
            if (callback == null) {
                callback = function() {
                };
            }

            var ext = enchant.Core.findExt(src);

            if (enchant.Core._loadFuncs[ext]) {
                enchant.Core._loadFuncs[ext].call(this, src, callback, ext);
            }
            else {
                var req = new XMLHttpRequest();
                req.open('GET', src, true);
                req.onreadystatechange = function(e) {
                    if (req.readyState === 4) {
                        if (req.status !== 200 && req.status !== 0) {
                            throw new Error(req.status + ': ' + 'Cannot load an asset: ' + src);
                        }

                        var type = req.getResponseHeader('Content-Type') || '';
                        if (type.match(/^image/)) {
                            core.assets[src] = enchant.Surface.load(src);
                            core.assets[src].addEventListener('load', callback);
                        } else if (type.match(/^audio/)) {
                            core.assets[src] = enchant.Sound.load(src, type);
                            core.assets[src].addEventListener('load', callback);
                        } else {
                            core.assets[src] = req.responseText;
                            callback();
                        }
                    }
                };
                req.send(null);
            }
        },
        /**
         */
        start: function() {
            if (this._intervalID) {
                window.clearInterval(this._intervalID);
            } else if (this._assets.length) {
                if (enchant.Sound.enabledInMobileSafari && !core._touched &&
                    enchant.ENV.VENDOR_PREFIX === 'webkit' && enchant.ENV.TOUCH_ENABLED) {
                    var scene = new enchant.Scene();
                    scene.backgroundColor = '#000';
                    var size = Math.round(core.width / 10);
                    var sprite = new enchant.Sprite(core.width, size);
                    sprite.y = (core.height - size) / 2;
                    sprite.image = new enchant.Surface(core.width, size);
                    sprite.image.context.fillStyle = '#fff';
                    sprite.image.context.font = (size - 1) + 'px bold Helvetica,Arial,sans-serif';
                    var width = sprite.image.context.measureText('Touch to Start').width;
                    sprite.image.context.fillText('Touch to Start', (core.width - width) / 2, size - 1);
                    scene.addChild(sprite);
                    document.addEventListener('touchstart', function() {
                        core._touched = true;
                        core.removeScene(scene);
                        core.start();
                    }, true);
                    core.pushScene(scene);
                    return;
                }

                var o = {};
                var assets = this._assets.filter(function(asset) {
                    return asset in o ? false : o[asset] = true;
                });
                var loaded = 0,
                    len = assets.length,
                    loadFunc = function() {
                        var e = new enchant.Event('progress');
                        e.loaded = ++loaded;
                        e.total = len;
                        core.dispatchEvent(e);
                        if (loaded === len) {
                            core.removeScene(core.loadingScene);
                            core.dispatchEvent(new enchant.Event('load'));
                        }
                    };

                for (var i = 0; i < len; i++) {
                    this.load(assets[i], loadFunc);
                }
                this.pushScene(this.loadingScene);
            } else {
                this.dispatchEvent(new enchant.Event('load'));
            }
            this.currentTime = Date.now();
            this._intervalID = window.setInterval(function() {
                core._tick();
            }, 1000 / this.fps);
            this.running = true;
        },
        /**
         */
        debug: function() {
            this._debug = true;
            this.rootScene.addEventListener("enterframe", function(time) {
                this._actualFps = (1 / time);
            });
            this.start();
        },
        actualFps: {
            get: function() {
                return this._actualFps || this.fps;
            }
        },
        _tick: function() {
            var now = Date.now();
            var e = new enchant.Event('enterframe');
            e.elapsed = now - this.currentTime;
            this.currentTime = now;

            var nodes = this.currentScene.childNodes.slice();
            var push = Array.prototype.push;
            while (nodes.length) {
                var node = nodes.pop();
                node.age++;
                node.dispatchEvent(e);
                if (node.childNodes) {
                    push.apply(nodes, node.childNodes);
                }
            }

            this.currentScene.age++;
            this.currentScene.dispatchEvent(e);
            this.dispatchEvent(e);

            this.dispatchEvent(new enchant.Event('exitframe'));
            this.frame++;
        },
        /**
         */
        stop: function() {
            if (this._intervalID) {
                window.clearInterval(this._intervalID);
                this._intervalID = null;
            }
            this.running = false;
        },
        /**
         */
        pause: function() {
            if (this._intervalID) {
                window.clearInterval(this._intervalID);
                this._intervalID = null;
            }
        },
        /**
         */
        resume: function() {
            if (this._intervalID) {
                return;
            }
            this.currentTime = Date.now();
            this._intervalID = window.setInterval(function() {
                core._tick();
            }, 1000 / this.fps);
            this.running = true;
        },

        /**
         */
        pushScene: function(scene) {
            this._element.appendChild(scene._element);
            if (this.currentScene) {
                this.currentScene.dispatchEvent(new enchant.Event('exit'));
            }
            this.currentScene = scene;
            this.currentScene.dispatchEvent(new enchant.Event('enter'));
            return this._scenes.push(scene);
        },
        /**
         */
        popScene: function() {
            if (this.currentScene === this.rootScene) {
                return this.currentScene;
            }
            this._element.removeChild(this.currentScene._element);
            this.currentScene.dispatchEvent(new enchant.Event('exit'));
            this.currentScene = this._scenes[this._scenes.length - 2];
            this.currentScene.dispatchEvent(new enchant.Event('enter'));
            return this._scenes.pop();
        },
        /**
         */
        replaceScene: function(scene) {
            this.popScene();
            return this.pushScene(scene);
        },
        /**
         */
        removeScene: function(scene) {
            if (this.currentScene === scene) {
                return this.popScene();
            } else {
                var i = this._scenes.indexOf(scene);
                if (i !== -1) {
                    this._scenes.splice(i, 1);
                    this._element.removeChild(scene._element);
                    return scene;
                } else {
                    return null;
                }
            }
        },
        /**
         */
        keybind: function(key, button) {
            this._keybind[key] = button;
        },
        /**
         */
        getElapsedTime: function() {
            return this.frame / this.fps;
        }
    });

    enchant.Core._loadFuncs = {};
    enchant.Core._loadFuncs['jpg'] =
        enchant.Core._loadFuncs['jpeg'] =
            enchant.Core._loadFuncs['gif'] =
                enchant.Core._loadFuncs['png'] =
                    enchant.Core._loadFuncs['bmp'] = function(src, callback) {
                        this.assets[src] = enchant.Surface.load(src);
                        this.assets[src].addEventListener('load', callback);
                    };
    enchant.Core._loadFuncs['mp3'] =
        enchant.Core._loadFuncs['aac'] =
            enchant.Core._loadFuncs['m4a'] =
                enchant.Core._loadFuncs['wav'] =
                    enchant.Core._loadFuncs['ogg'] = function(src, callback, ext) {
                        this.assets[src] = enchant.Sound.load(src, 'audio/' + ext);
                        this.assets[src].addEventListener('load', callback);
                    };


    /**
     * find extension from path
     * @param path
     * @return {*}
     */
    enchant.Core.findExt = function(path) {
        var matched = path.match(/\.\w+$/);
        if (matched && matched.length > 0) {
            return matched[0].slice(1).toLowerCase();
        }

        // for data URI
        if (path.indexOf('data:') === 0) {
            return path.split(/[\/;]/)[1].toLowerCase();
        }
        return null;
    };

    /**
     */
    enchant.Core.instance = null;
}());

/**
 * enchant.Core is moved to enchant.Core from v0.6
 * @type {*}
 */
enchant.Game = enchant.Core;

/**
 * @scope enchant.Node.prototype
 */
enchant.Node = enchant.Class.create(enchant.EventTarget, {
    /**
     * Basisklasse für Objekte die im Darstellungsbaum, 
     * dessen Wurzel eine Szene ist, enthalten sind.
     * Sollte nicht direkt verwendet werden.
     * @constructs
     * @extends enchant.EventTarget
     */
    initialize: function() {
        enchant.EventTarget.call(this);

        this._dirty = false;

        this._x = 0;
        this._y = 0;
        this._offsetX = 0;
        this._offsetY = 0;

        /**
         *         *         *         * Das Alter (Frames) dieses Nodes welches vor dem {@link enchant.Event.ENTER_FRAME} Ereignis erhöht wird.
         *         * @type {Number}
         */
        this.age = 0;

        /**
         * Der Eltern-Node dieses Node.
         * @type {enchant.Group}
         */
        this.parentNode = null;
        /**
         * Die Szene, zu welcher dieser Node gehört.
         * @type {enchant.Scene}
         */
        this.scene = null;

        this.addEventListener('touchstart', function(e) {
            if (this.parentNode) {
                this.parentNode.dispatchEvent(e);
            }
        });
        this.addEventListener('touchmove', function(e) {
            if (this.parentNode) {
                this.parentNode.dispatchEvent(e);
            }
        });
        this.addEventListener('touchend', function(e) {
            if (this.parentNode) {
                this.parentNode.dispatchEvent(e);
            }
        });
    },
    /**
     * Bewegt diesen Node zu den gegebenen Ziel Koordinaten.
     * @param {Number} x Ziel x Koordinaten.
     * @param {Number} y Ziel y Koordinaten.
     */
    moveTo: function(x, y) {
        this._x = x;
        this._y = y;
        this._updateCoordinate();
    },
    /**
     * Bewegt diesen Node relativ zur aktuellen Position.
     * @param {Number} x Distanz auf der x Achse.
     * @param {Number} y Distanz auf der y Achse.
     */
    moveBy: function(x, y) {
        this._x += x;
        this._y += y;
        this._updateCoordinate();
    },
    /**
     * Die x Koordinaten des Nodes.
     * @type {Number}
     */
    x: {
        get: function() {
            return this._x;
        },
        set: function(x) {
            this._x = x;
            this._updateCoordinate();
        }
    },
    /**
     * Die y Koordinaten des Nodes.
     * @type {Number}
     */
    y: {
        get: function() {
            return this._y;
        },
        set: function(y) {
            this._y = y;
            this._updateCoordinate();
        }
    },
    _updateCoordinate: function() {
        if (this.parentNode) {
            this._offsetX = this.parentNode._offsetX + this._x;
            this._offsetY = this.parentNode._offsetY + this._y;
        } else {
            this._offsetX = this._x;
            this._offsetY = this._y;
        }
        this._dirty = true;
    },
    remove: function() {
        if (this._listener) {
            this.clearEventListener();
        }
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }
});

/**
 * @scope enchant.Entity.prototype
 */
enchant.Entity = enchant.Class.create(enchant.Node, {
    /**
     * Eine Klasse die Objekte mit Hilfe von DOM Elementen darstellt.
     * Sollte nicht direkt verwendet werden.
     * @constructs
     * @extends enchant.Node
     */
    initialize: function() {
        var core = enchant.Core.instance;
        enchant.Node.call(this);

        this._rotation = 0;
        this._scaleX = 1;
        this._scaleY = 1;

        this._originX = null;
        this._originY = null;

        this._width = 0;
        this._height = 0;
        this._backgroundColor = null;
        this._opacity = 1;
        this._visible = true;
        this._buttonMode = null;

        this._style = {};

        /**
         * Definiert diese Entity als Schaltfläche (Button).
         * Bei einem Klick oder Touch wird das entsprechende
         * Button Ereignis (Event) ausgelöst.
         * Mögliche buttonModes sind: left, right, up, down, a, b. 
         * @type {String}
         */
        this.buttonMode = null;
        /**
         * Zeigt an, ob auf die Entity geklickt wurde.
         * Funktioniert nur wenn buttonMode gesetzt ist.
         * @type {Boolean}
         */
        this.buttonPressed = false;
        this.addEventListener('touchstart', function() {
            if (!this.buttonMode) {
                return;
            }
            this.buttonPressed = true;
            var e = new enchant.Event(this.buttonMode + 'buttondown');
            this.dispatchEvent(e);
            core.dispatchEvent(e);
        });
        this.addEventListener('touchend', function() {
            if (!this.buttonMode) {
                return;
            }
            this.buttonPressed = false;
            var e = new enchant.Event(this.buttonMode + 'buttonup');
            this.dispatchEvent(e);
            core.dispatchEvent(e);
        });

        var that = this;
        var event = new enchant.Event('render');
        var render = function() {
            that.dispatchEvent(event);
        };
        this.addEventListener('addedtoscene', function() {
            render();
            core.addEventListener('exitframe', render);
        });
        this.addEventListener('removedfromscene', function() {
            core.removeEventListener('exitframe', render);
        });

    },
    /**
     * Die Breite der Entity.
     * @type {Number}
     */
    width: {
        get: function() {
            return this._width;
        },
        set: function(width) {
            this._width = width;
            this._dirty = true;
        }
    },
    /**
     * Die Höhe der Entity.
     * @type {Number}
     */
    height: {
        get: function() {
            return this._height;
        },
        set: function(height) {
            this._height = height;
            this._dirty = true;
        }
    },
    /**
     * Die Hintergrundfarbe der Entity.
     * Muss im gleichen Format definiert werden wie das CSS 'color' Attribut.
     * @type {String}
     */
    backgroundColor: {
        get: function() {
            return this._backgroundColor;
        },
        set: function(color) {
            this._backgroundColor = color;
        }
    },
    /**
     * Transparenz der Entity.
     * Definiert den Level der Transparenz von 0 bis 1
     * (0 ist komplett transparent, 1 ist vollständig deckend).
     * @type {Number}
     */
    opacity: {
        get: function() {
            return this._opacity;
        },
        set: function(opacity) {
            this._opacity = opacity;
        }
    },
    /**
     * Zeigt an, ob die Entity dargestellt werden soll oder nicht.
     * @type {Boolean}
     */
    visible: {
        get: function() {
            return this._visible;
        },
        set: function(visible) {
            this._visible = visible;
        }
    },
    /**
     * Definiert ob auf die Entity geklickt werden kann. 
     * @type {Boolean}
     */
    touchEnabled: {
        get: function() {
            return this._touchEnabled;
        },
        set: function(enabled) {
            this._touchEnabled = enabled;
            /*
            if (this._touchEnabled = enabled) {
                this._style.pointerEvents = 'all';
            } else {
                this._style.pointerEvents = 'none';
            }
            */
        }
    },
    /**
     * Führt eine Kollisionsdetektion durch, die überprüft ob eine Überschneidung zwischen den
     * begrenzenden Rechtecken existiert. 
     * @param {*} other Ein Objekt wie Entity, welches x, y, width und height Variablen besitzt,
     * mit dem die Kollisionsdetektion durchgeführt wird.
     * @return {Boolean} True, falls eine Kollision festgestellt wurde.
     */
    intersect: function(other) {
        return this._offsetX < other._offsetX + other.width && other._offsetX < this._offsetX + this.width &&
            this._offsetY < other._offsetY + other.height && other._offsetY < this._offsetY + this.height;
    },
    /**
     * Führt eine Kollisionsdetektion durch, die anhand der Distanz zwischen den Objekten feststellt,
     * ob eine Kollision aufgetreten ist.
     * @param {*} other Ein Objekt wie Entity, welches x, y, width und height Variablen besitzt,
     * mit dem die Kollisionsdetektion durchgeführt wird.
     * @param {Number} [distance] Die größte Distanz die für die Kollision in betracht gezogen wird.
     * Der Standardwert ist der Durchschnitt der Breite und Höhe beider Objekte.
     * @return {Boolean} True, falls eine Kollision festgestellt wurde.
     */
    within: function(other, distance) {
        if (distance == null) {
            distance = (this.width + this.height + other.width + other.height) / 4;
        }
        var _;
        return (_ = this._offsetX - other._offsetX + (this.width - other.width) / 2) * _ +
            (_ = this._offsetY - other._offsetY + (this.height - other.height) / 2) * _ < distance * distance;
    }, /**
     * Vergrößert oder verkleinert ein Sprite.
     * @param {Number} x Skalierungsfaktor auf der x-Achse.
     * @param {Number} [y] Skalierungsfaktor auf der y-Achse.
     */
    scale: function(x, y) {
        if (y == null) {
            y = x;
        }
        this._scaleX *= x;
        this._scaleY *= y;
        this._dirty = true;
    },
    /**
     * Rotiert ein Sprite.
     * @param {Number} deg Rotationswinkel (Grad).
     */
    rotate: function(deg) {
        this._rotation += deg;
        this._dirty = true;
    },
    /**
     * Skalierungsfaktor auf der x-Achse eines Sprites.
     * @type {Number}
     */
    scaleX: {
        get: function() {
            return this._scaleX;
        },
        set: function(scaleX) {
            this._scaleX = scaleX;
            this._dirty = true;
        }
    },
    /**
     * Skalierungsfaktor auf der y-Achse eines Sprites.
     * @type {Number}
     */
    scaleY: {
        get: function() {
            return this._scaleY;
        },
        set: function(scaleY) {
            this._scaleY = scaleY;
            this._dirty = true;
        }
    },
    /**
     * Rotationswinkel des Sprites (Grad).
     * @type {Number}
     */
    rotation: {
        get: function() {
            return this._rotation;
        },
        set: function(rotation) {
            this._rotation = rotation;
            this._dirty = true;
        }
    },
    /**
     * Ausgangspunkt für Rotation und Skalierung.
     * @type {Number}
     */
    originX: {
        get: function() {
            return this._originX;
        },
        set: function(originX) {
            this._originX = originX;
            this._dirty = true;
        }
    },
    /**
     * Ausgangspunkt für Rotation und Skalierung.
     * @type {Number}
     */
    originY: {
        get: function() {
            return this._originY;
        },
        set: function(originY) {
            this._originY = originY;
            this._dirty = true;
        }
    }
});

/**
 * @scope enchant.Sprite.prototype
 */
enchant.Sprite = enchant.Class.create(enchant.Entity, {
    /**
     * Eine Klasse die Grafiken darstellen kann.
     * 
     * @param {Number} [width] Die Breite des Sprites.
     * @param {Number} [height] Die Höhe des Sprites.
     * @example
     *   var bear = new Sprite(32, 32);
     *   bear.image = core.assets['chara1.gif'];
     *   
     * @constructs
     * @extends enchant.Entity
     */
    initialize: function(width, height) {
        enchant.Entity.call(this);

        this.width = width;
        this.height = height;
        this._image = null;
        this._frameLeft = 0;
        this._frameTop = 0;
        this._frame = 0;
        this._frameSequence = [];

        /**
         * frame に配列が指定されたときの処理。
         * _frameSeuence に
         */
        this.addEventListener('enterframe', function() {
            if (this._frameSequence.length !== 0) {
                var nextFrame = this._frameSequence.shift();
                if (nextFrame === null) {
                    this._frameSequence = [];
                } else {
                    this._setFrame(nextFrame);
                    this._frameSequence.push(nextFrame);
                }
            }
        });
    },
    /**
     * Die Grafik die im Sprite dargestellt wird.
     * @type {enchant.Surface}
     */
    image: {
        get: function() {
            return this._image;
        },
        set: function(image) {
            if (image === this._image) {
                return;
            }
            this._image = image;
            this._setFrame(this._frame);
        }
    },
    /**
     * Die Indizes der darzustellenden Frames.
     * Die Frames mit der selben Größe wie das Sprite werden aus der {@link enchant.Sprite#image} image Variable,
     * beginnend an der oberen linken Ecke, angeordnet. Wenn eine Nummbersequenz übergeben wird, wird
     * der dargestellte Frame automatisch gewechselt. Am ende des Arrays der Sequenz wird diese neugestartet.
     * Wenn ein Wert in der Sequenz auf null gesetzt wird, wird das automatische Framewechseln gestoppt.
     * @example
     * var sprite = new Sprite(32, 32);
     * sprite.frame = [0, 1, 0, 2]
     * //-> 0, 1, 0, 2, 0, 1, 0, 2,..
     * sprite.frame = [0, 1, 0, 2, null]
     * //-> 0, 1, 0, 2, (2, 2,.. :stop)
     *
     * @type {Number|Array}
     */
    frame: {
        get: function() {
            return this._frame;
        },
        set: function(frame) {
            if (frame instanceof Array) {
                var frameSequence = frame;
                var nextFrame = frameSequence.shift();
                this._setFrame(nextFrame);
                frameSequence.push(nextFrame);
                this._frameSequence = frameSequence;
            } else {
                this._setFrame(frame);
                this._frameSequence = [];
                this._frame = frame;
            }
        }
    },
    /**
     * 0 <= frame
     * 0以下の動作は未定義.
     * @param frame
     * @private
     */
    _setFrame: function(frame) {
        var image = this._image;
        var row, col;
        if (image != null) {
            this._frame = frame;
            row = image.width / this._width | 0;
            this._frameLeft = (frame % row | 0) * this._width;
            this._frameTop = (frame / row | 0) * this._height % image.height;
        }
    }
});

enchant.Sprite.prototype.cvsRender = function(ctx) {
    var img, imgdata, row, frame;
    var sx, sy, sw, sh;
    if (this._image) {
        frame = Math.abs(this._frame) || 0;
        img = this._image;
        imgdata = img._element;
        sx = this._frameLeft;
        sy = Math.min(this._frameTop, img.height - this._height);
        sw = Math.min(img.width - sx, this._width);
        sh = Math.min(img.height - sy, this._height);
        ctx.drawImage(imgdata, sx, sy, sw, sh, 0, 0, this._width, this._height);
    }
};

/**
 * @scope enchant.Label.prototype
 */
enchant.Label = enchant.Class.create(enchant.Entity, {
    /**
     * Erstellt ein Label Objekt.
     * @constructs
     * @extends enchant.Entity
     */
    initialize: function(text) {
        enchant.Entity.call(this);

        this.width = 300;
        this.text = text;
        this.textAlign = 'left';
    },
    /**
     * Darzustellender Text.
     * @type {String}
     */
    text: {
        get: function() {
            return this._text;
        },
        set: function(text) {
            this._text = text;
        }
    },
    /**
     * Spezifiziert die horizontale Ausrichtung des Textes.
     * Kann im gleichen Format wie die CSS 'text-align' Eigenschaft angegeben werden.
     * @type {String}
     */
    textAlign: {
        get: function() {
            return this._style.textAlign;
        },
        set: function(textAlign) {
            this._style.textAlign = textAlign;
        }
    },
    /**
     * Text Eigenschaften.
     * Kann im gleichen Format wie die CSS 'font' Eigenschaft angegeben werden.
     * @type {String}
     */
    font: {
        get: function() {
            return this._style.font;
        },
        set: function(font) {
            this._style.font = font;
        }
    },
    /**
     * Text Farbe.
     * Kann im gleichen Format wie die CSS 'color' Eigenschaft angegeben werden.
     * @type {String}
     */
    color: {
        get: function() {
            return this._style.color;
        },
        set: function(color) {
            this._style.color = color;
        }
    }
});

enchant.Label.prototype.cvsRender = function(ctx) {
    if (this.text) {
        ctx.textBaseline = 'top';
        ctx.font = this.font;
        ctx.fillStyle = this.color || '#000000';
        ctx.fillText(this.text, 0, 0);
    }
};

/**
 * @scope enchant.Map.prototype
 */
enchant.Map = enchant.Class.create(enchant.Entity, {
    /**
     * Eine Klasse mit der Karten aus Kacheln (Tiles)
     * erstellt und angezeigt werden können.
     *
     * @param {Number} tileWidth Kachelbreite.
     * @param {Number} tileHeight Kachelhöhe.
     * @constructs
     * @extends enchant.Entity
     */
    initialize: function(tileWidth, tileHeight) {
        var core = enchant.Core.instance;

        enchant.Entity.call(this);

        var canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        if (enchant.ENV.RETINA_DISPLAY && core.scale === 2) {
            canvas.width = core.width * 2;
            canvas.height = core.height * 2;
            this._style.webkitTransformOrigin = '0 0';
            this._style.webkitTransform = 'scale(0.5)';
        } else {
            canvas.width = core.width;
            canvas.height = core.height;
        }
        this._context = canvas.getContext('2d');

        this._tileWidth = tileWidth || 0;
        this._tileHeight = tileHeight || 0;
        this._image = null;
        this._data = [
            [
                []
            ]
        ];
        this._dirty = false;
        this._tight = false;

        this.touchEnabled = false;

        /**
         * Ein 2-Dimensionales Array um zu speichern, ob für eine Kachel
         * Kollesionsdetektion durchgeführt werden soll.
         * @type {Array.<Array.<Number>>}
         */
        this.collisionData = null;

        this._listeners['render'] = null;
        this.addEventListener('render', function() {
            if (this._dirty || this._previousOffsetX == null) {
                this._dirty = false;
                this.redraw(0, 0, core.width, core.height);
            } else if (this._offsetX !== this._previousOffsetX ||
                this._offsetY !== this._previousOffsetY) {
                if (this._tight) {
                    var x = -this._offsetX;
                    var y = -this._offsetY;
                    var px = -this._previousOffsetX;
                    var py = -this._previousOffsetY;
                    var w1 = x - px + core.width;
                    var w2 = px - x + core.width;
                    var h1 = y - py + core.height;
                    var h2 = py - y + core.height;
                    if (w1 > this._tileWidth && w2 > this._tileWidth &&
                        h1 > this._tileHeight && h2 > this._tileHeight) {
                        var sx, sy, dx, dy, sw, sh;
                        if (w1 < w2) {
                            sx = 0;
                            dx = px - x;
                            sw = w1;
                        } else {
                            sx = x - px;
                            dx = 0;
                            sw = w2;
                        }
                        if (h1 < h2) {
                            sy = 0;
                            dy = py - y;
                            sh = h1;
                        } else {
                            sy = y - py;
                            dy = 0;
                            sh = h2;
                        }

                        if (core._buffer == null) {
                            core._buffer = document.createElement('canvas');
                            core._buffer.width = this._context.canvas.width;
                            core._buffer.height = this._context.canvas.height;
                        }
                        var context = core._buffer.getContext('2d');
                        if (this._doubledImage) {
                            context.clearRect(0, 0, sw * 2, sh * 2);
                            context.drawImage(this._context.canvas,
                                sx * 2, sy * 2, sw * 2, sh * 2, 0, 0, sw * 2, sh * 2);
                            context = this._context;
                            context.clearRect(dx * 2, dy * 2, sw * 2, sh * 2);
                            context.drawImage(core._buffer,
                                0, 0, sw * 2, sh * 2, dx * 2, dy * 2, sw * 2, sh * 2);
                        } else {
                            context.clearRect(0, 0, sw, sh);
                            context.drawImage(this._context.canvas,
                                sx, sy, sw, sh, 0, 0, sw, sh);
                            context = this._context;
                            context.clearRect(dx, dy, sw, sh);
                            context.drawImage(core._buffer,
                                0, 0, sw, sh, dx, dy, sw, sh);
                        }

                        if (dx === 0) {
                            this.redraw(sw, 0, core.width - sw, core.height);
                        } else {
                            this.redraw(0, 0, core.width - sw, core.height);
                        }
                        if (dy === 0) {
                            this.redraw(0, sh, core.width, core.height - sh);
                        } else {
                            this.redraw(0, 0, core.width, core.height - sh);
                        }
                    } else {
                        this.redraw(0, 0, core.width, core.height);
                    }
                } else {
                    this.redraw(0, 0, core.width, core.height);
                }
            }
            this._previousOffsetX = this._offsetX;
            this._previousOffsetY = this._offsetY;
        });
    },
    /**
     * Setzt die Kartendaten.
     * Setzt die Kartendaten, wobei die Daten (ein 2-Dimensionales Array bei dem die Indizes bei 0 beginnen) 
     * auf das Bild, beginned bei der linken oberen Ecke) projeziert werden.
     * Sollte mehr als ein Array übergeben worden sein, werden die Karten in invertierter Reihenfolge dargestellt. 
     * @param {...Array<Array.<Number>>} data 2-Dimensionales Array mit Kachel Indizes. Mehrfachangaben möglich.
     */
    loadData: function(data) {
        this._data = Array.prototype.slice.apply(arguments);
        this._dirty = true;

        this._tight = false;
        for (var i = 0, len = this._data.length; i < len; i++) {
            var c = 0;
            data = this._data[i];
            for (var y = 0, l = data.length; y < l; y++) {
                for (var x = 0, ll = data[y].length; x < ll; x++) {
                    if (data[y][x] >= 0) {
                        c++;
                    }
                }
            }
            if (c / (data.length * data[0].length) > 0.2) {
                this._tight = true;
                break;
            }
        }
    },
    /**
     * Überprüft welche Kachel an der gegeben Position vorhanden ist.
     * @param {Number} x Die x Koordinataten des Punktes auf der Karte.
     * @param {Number} y Die y Koordinataten des Punktes auf der Karte.
     * @return {*} Die Kachel für die angegebene Position.
     */
    checkTile: function(x, y) {
        if (x < 0 || this.width <= x || y < 0 || this.height <= y) {
            return false;
        }
        var width = this._image.width;
        var height = this._image.height;
        var tileWidth = this._tileWidth || width;
        var tileHeight = this._tileHeight || height;
        x = x / tileWidth | 0;
        y = y / tileHeight | 0;
        //		return this._data[y][x];
        var data = this._data[0];
        return data[y][x];
    },
    /**
     * Überprüft ob auf der Karte Hindernisse vorhanden sind.
     * @param {Number} x Die x Koordinataten des Punktes auf der Karte, der überprüft werden soll.
     * @param {Number} y Die y Koordinataten des Punktes auf der Karte, der überprüft werden soll.
     * @return {Boolean} True, falls Hindernisse vorhanden sind.
     */
    hitTest: function(x, y) {
        if (x < 0 || this.width <= x || y < 0 || this.height <= y) {
            return false;
        }
        var width = this._image.width;
        var height = this._image.height;
        var tileWidth = this._tileWidth || width;
        var tileHeight = this._tileHeight || height;
        x = x / tileWidth | 0;
        y = y / tileHeight | 0;
        if (this.collisionData != null) {
            return this.collisionData[y] && !!this.collisionData[y][x];
        } else {
            for (var i = 0, len = this._data.length; i < len; i++) {
                var data = this._data[i];
                var n;
                if (data[y] != null && (n = data[y][x]) != null &&
                    0 <= n && n < (width / tileWidth | 0) * (height / tileHeight | 0)) {
                    return true;
                }
            }
            return false;
        }
    },
    /**
     * Das Bild mit dem die Kacheln auf der Karte dargestellt werden.
     * @type {enchant.Surface}
     */
    image: {
        get: function() {
            return this._image;
        },
        set: function(image) {
            var core = enchant.Core.instance;

            this._image = image;
            if (enchant.ENV.RETINA_DISPLAY && core.scale === 2) {
                var img = new enchant.Surface(image.width * 2, image.height * 2);
                var tileWidth = this._tileWidth || image.width;
                var tileHeight = this._tileHeight || image.height;
                var row = image.width / tileWidth | 0;
                var col = image.height / tileHeight | 0;
                for (var y = 0; y < col; y++) {
                    for (var x = 0; x < row; x++) {
                        img.draw(image, x * tileWidth, y * tileHeight, tileWidth, tileHeight,
                            x * tileWidth * 2, y * tileHeight * 2, tileWidth * 2, tileHeight * 2);
                    }
                }
                this._doubledImage = img;
            }
            this._dirty = true;
        }
    },
    /**
     * Kachelbreite
     * @type {Number}
     */
    tileWidth: {
        get: function() {
            return this._tileWidth;
        },
        set: function(tileWidth) {
            this._tileWidth = tileWidth;
            this._dirty = true;
        }
    },
    /**
     * Kachelhöhe.
     * @type {Number}
     */
    tileHeight: {
        get: function() {
            return this._tileHeight;
        },
        set: function(tileHeight) {
            this._tileHeight = tileHeight;
            this._dirty = true;
        }
    },
    /**
     * @private
     */
    width: {
        get: function() {
            return this._tileWidth * this._data[0][0].length;
        }
    },
    /**
     * @private
     */
    height: {
        get: function() {
            return this._tileHeight * this._data[0].length;
        }
    },
    /**
     * @private
     */
    redraw: function(x, y, width, height) {
        if (this._image == null) {
            return;
        }

        var image, tileWidth, tileHeight, dx, dy;
        if (this._doubledImage) {
            image = this._doubledImage;
            tileWidth = this._tileWidth * 2;
            tileHeight = this._tileHeight * 2;
            dx = -this._offsetX * 2;
            dy = -this._offsetY * 2;
            x *= 2;
            y *= 2;
            width *= 2;
            height *= 2;
        } else {
            image = this._image;
            tileWidth = this._tileWidth;
            tileHeight = this._tileHeight;
            dx = -this._offsetX;
            dy = -this._offsetY;
        }
        var row = image.width / tileWidth | 0;
        var col = image.height / tileHeight | 0;
        var left = Math.max((x + dx) / tileWidth | 0, 0);
        var top = Math.max((y + dy) / tileHeight | 0, 0);
        var right = Math.ceil((x + dx + width) / tileWidth);
        var bottom = Math.ceil((y + dy + height) / tileHeight);

        var source = image._element;
        var context = this._context;
        var canvas = context.canvas;
        context.clearRect(x, y, width, height);
        for (var i = 0, len = this._data.length; i < len; i++) {
            var data = this._data[i];
            var r = Math.min(right, data[0].length);
            var b = Math.min(bottom, data.length);
            for (y = top; y < b; y++) {
                for (x = left; x < r; x++) {
                    var n = data[y][x];
                    if (0 <= n && n < row * col) {
                        var sx = (n % row) * tileWidth;
                        var sy = (n / row | 0) * tileHeight;
                        context.drawImage(source, sx, sy, tileWidth, tileHeight,
                            x * tileWidth - dx, y * tileHeight - dy, tileWidth, tileHeight);
                    }
                }
            }
        }
    }
});

enchant.Map.prototype.cvsRender = function(ctx) {
    var core = enchant.Core.instance;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var cvs = this._context.canvas;
    ctx.drawImage(cvs, 0, 0, core.width, core.height);
    ctx.restore();
};

/**
 * @scope enchant.Group.prototype
 */
enchant.Group = enchant.Class.create(enchant.Node, {
    /**
     * Eine Klasse die mehrere {@link enchant.Node} beinhalten kann.
     *
     * @example
     *   var stage = new Group();
     *   stage.addChild(player);
     *   stage.addChild(enemy);
     *   stage.addChild(map);
     *   stage.addEventListener('enterframe', function() {
     *      // Bewegt den gesamten Frame je nach der aktuelle Spielerposition.
     *      if (this.x > 64 - player.x) {
     *          this.x = 64 - player.x;
     *      }
     *   });
     *
     * @constructs
     * @extends enchant.Node
     */
    initialize: function() {
        enchant.Node.call(this);

        /**
         * Kind-Nodes.
         * @type {Array.<enchant.Node>}
         */
        this.childNodes = [];

        this._rotation = 0;
        this._scaleX = 1;
        this._scaleY = 1;

        this._originX = null;
        this._originY = null;

        [enchant.Event.ADDED_TO_SCENE, enchant.Event.REMOVED_FROM_SCENE]
            .forEach(function(event) {
                this.addEventListener(event, function(e) {
                    this.childNodes.forEach(function(child) {
                        child.scene = this.scene;
                        child.dispatchEvent(e);
                    }, this);
                });
            }, this);
    },
    /**
     * Fügt einen Node zu der Gruppe hinzu.
     * @param {enchant.Node} node Node der hinzugeügt werden soll.
     */
    addChild: function(node) {
        this.childNodes.push(node);
        node.parentNode = this;
        var childAdded = new enchant.Event('childadded');
        childAdded.node = node;
        childAdded.next = null;
        this.dispatchEvent(childAdded);
        node.dispatchEvent(new enchant.Event('added'));
        if (this.scene) {
            node.scene = this.scene;
            var addedToScene = new enchant.Event('addedtoscene');
            node.dispatchEvent(addedToScene);
        }
    },
    /**
     * Fügt einen Node vor einen anderen Node zu dieser Gruppe hinzu.
     * @param {enchant.Node} node Der Node der hinzugefügt werden soll.
     * @param {enchant.Node} reference Der Node der sich vor dem einzufügendem Node befindet.
     */
    insertBefore: function(node, reference) {
        var i = this.childNodes.indexOf(reference);
        if (i !== -1) {
            this.childNodes.splice(i, 0, node);
            node.parentNode = this;
            var childAdded = new enchant.Event('childadded');
            childAdded.node = node;
            childAdded.next = reference;
            this.dispatchEvent(childAdded);
            node.dispatchEvent(new enchant.Event('added'));
            if (this.scene) {
                node.scene = this.scene;
                var addedToScene = new enchant.Event('addedtoscene');
                node.dispatchEvent(addedToScene);
            }
        } else {
            this.addChild(node);
        }
    },
    /**
     * Entfernt einen Node aus der Gruppe.
     * @param {enchant.Node} node Der Node der entfernt werden soll.
     */
    removeChild: function(node) {
        var i;
        if ((i = this.childNodes.indexOf(node)) !== -1) {
            this.childNodes.splice(i, 1);
            node.parentNode = null;
            var childRemoved = new enchant.Event('childremoved');
            childRemoved.node = node;
            this.dispatchEvent(childRemoved);
            node.dispatchEvent(new enchant.Event('removed'));
            if (this.scene) {
                node.scene = null;
                var removedFromScene = new enchant.Event('removedfromscene');
                node.dispatchEvent(removedFromScene);
            }
        }
    },
    /**
     * Der Node, welcher das erste Kind der Gruppe darstellt.
     * @type {enchant.Node}
     */
    firstChild: {
        get: function() {
            return this.childNodes[0];
        }
    },
    /**
     * Der Node, welcher das letzte Kind der Gruppe darstellt.
     * @type {enchant.Node}
     */
    lastChild: {
        get: function() {
            return this.childNodes[this.childNodes.length - 1];
        }
    },
    _updateCoordinate: function() {
        if (this.parentNode) {
            this._offsetX = this.parentNode._offsetX + this._x;
            this._offsetY = this.parentNode._offsetY + this._y;
        } else {
            this._offsetX = this._x;
            this._offsetY = this._y;
        }
        for (var i = 0, len = this.childNodes.length; i < len; i++) {
            this.childNodes[i]._updateCoordinate();
        }
        this._dirty = true;
    },
    /**
    * Rotationswinkel der Gruppe (Grad).
    * @type {Number}
    */
    rotation: {
        get: function() {
            return this._rotation;
        },
        set: function(rotation) {
            this._rotation = rotation;
            this._dirty = true;
        }
    },
    /**
    * Skalierungsfaktor auf der x-Achse der Gruppe.
    * @type {Number}
    * @see enchant.CanvasGroup.originX
    * @see enchant.CanvasGroup.originY
    */
    scaleX: {
        get: function() {
            return this._scaleX;
        },
        set: function(scale) {
            this._scaleX = scale;
            this._dirty = true;
        }
    },
    /**
    * Skalierungsfaktor auf der y-Achse der Gruppe.
    * @type {Number}
    * @see enchant.CanvasGroup.originX
    * @see enchant.CanvasGroup.originY
    */
    scaleY: {
        get: function() {
            return this._scaleY;
        },
        set: function(scale) {
            this._scaleY = scale;
            this._dirty = true;
        }
    },
    /**
    * Ausgangspunkt für Rotation und Skalierung.
    * @type {Number}
    */
    originX: {
        get: function() {
            return this._originX;
        },
        set: function(originX) {
            this._originX = originX;
            this._dirty = true;
        }
    },
    /**
    * Ausgangspunkt für Rotation und Skalierung.
    * @type {Number}
    */
    originY: {
        get: function() {
            return this._originY;
        },
        set: function(originY) {
            this._originY = originY;
            this._dirty = true;
        }
    }
});

(function() {
    /**
     * @scope enchant.CanvasGroup.prototype
     */
    enchant.CanvasGroup = enchant.Class.create(enchant.Group, {
        /**
         * Eine Klasse die HTML Canvas für das Rendern nutzt.
         * Das Rendern der Kinder wird durch das Canvas Rendering ersetzt.
         * @constructs
         */
        initialize: function() {
            var core = enchant.Core.instance;
            var that = this;

            enchant.Group.call(this);

            this._cvsCache = {
                matrix: [1, 0, 0, 1, 0, 0],
                detectColor: '#000000'
            };

            this.width = core.width;
            this.height = core.height;

            this._element = document.createElement('canvas');
            this._element.width = core.width;
            this._element.height = core.height;
            this._element.style.position = 'absolute';

            this._detect = document.createElement('canvas');
            this._detect.width = core.width;
            this._detect.height = core.height;
            this._detect.style.position = 'absolute';
            this._lastDetected = 0;

            this.context = this._element.getContext('2d');
            this._dctx = this._detect.getContext('2d');

            this._colorManager = new DetectColorManager(16, 256);

            /**
             * canvas タグに対して、DOM のイベントリスナを貼る
             */
            if (enchant.ENV.TOUCH_ENABLED) {
                this._element.addEventListener('touchstart', function(e) {
                    var touches = e.touches;
                    for (var i = 0, len = touches.length; i < len; i++) {
                        e = new enchant.Event('touchstart');
                        e.identifier = touches[i].identifier;
                        e._initPosition(touches[i].pageX, touches[i].pageY);
                        _touchstartFromDom.call(that, e);
                    }
                }, false);
                this._element.addEventListener('touchmove', function(e) {
                    var touches = e.touches;
                    for (var i = 0, len = touches.length; i < len; i++) {
                        e = new enchant.Event('touchmove');
                        e.identifier = touches[i].identifier;
                        e._initPosition(touches[i].pageX, touches[i].pageY);
                        _touchmoveFromDom.call(that, e);
                    }
                }, false);
                this._element.addEventListener('touchend', function(e) {
                    var touches = e.changedTouches;
                    for (var i = 0, len = touches.length; i < len; i++) {
                        e = new enchant.Event('touchend');
                        e.identifier = touches[i].identifier;
                        e._initPosition(touches[i].pageX, touches[i].pageY);
                        _touchendFromDom.call(that, e);
                    }
                }, false);
            }
                this._element.addEventListener('mousedown', function(e) {
                    var x = e.pageX;
                    var y = e.pageY;
                    e = new enchant.Event('touchstart');
                    e.identifier = core._mousedownID;
                    e._initPosition(x, y);
                    _touchstartFromDom.call(that, e);
                    that._mousedown = true;
                }, false);
                core._element.addEventListener('mousemove', function(e) {
                    if (!that._mousedown) {
                        return;
                    }
                    var x = e.pageX;
                    var y = e.pageY;
                    e = new enchant.Event('touchmove');
                    e.identifier = core._mousedownID;
                    e._initPosition(x, y);
                    _touchmoveFromDom.call(that, e);
                }, false);
                core._element.addEventListener('mouseup', function(e) {
                    if (!that._mousedown) {
                        return;
                    }
                    var x = e.pageX;
                    var y = e.pageY;
                    e = new enchant.Event('touchend');
                    e.identifier = core._mousedownID;
                    e._initPosition(x, y);
                    _touchendFromDom.call(that, e);
                    that._mousedown = false;
                }, false);

            var start = [
                enchant.Event.ENTER,
                enchant.Event.ADDED_TO_SCENE
            ];
            var end = [
                enchant.Event.EXIT,
                enchant.Event.REMOVED_FROM_SCENE
            ];
            start.forEach(function(type) {
                this.addEventListener(type, this._startRendering);
                this.addEventListener(type, function() {
                    canvasGroupInstances.push(this);
                });
            }, this);
            end.forEach(function(type) {
                this.addEventListener(type, this._stopRendering);
                this.addEventListener(type, function() {
                    var i = canvasGroupInstances.indexOf(this);
                    if (i !== -1) {
                        canvasGroupInstances.splice(i, 1);
                    }
                });
            }, this);

            var __onchildadded = function(e) {
                var child = e.node;
                if (child.childNodes) {
                    child.addEventListener('childadded', __onchildadded);
                    child.addEventListener('childremoved', __onchildremoved);
                }
                attachCache.call(child, that._colorManager);
                rendering.call(child, that.context);
            };

            var __onchildremoved = function(e) {
                var child = e.node;
                if (child.childNodes) {
                    child.removeEventListener('childadded', __onchildadded);
                    child.removeEventListener('childremoved', __onchildremoved);
                }
                detachCache.call(child, that._colorManager);
            };

            this.addEventListener('childremoved', __onchildremoved);
            this.addEventListener('childadded', __onchildadded);

            this._onexitframe = function() {
                var ctx = that.context;
                ctx.clearRect(0, 0, core.width, core.height);
                rendering.call(that, ctx);
            };
        },
        /**
         * レンダリング用のイベントリスナを Core オブジェクトに登録
         * @private
         */
        _startRendering: function() {
            var core = enchant.Core.instance;
            if (!core._listeners['exitframe']) {
                core._listeners['exitframe'] = [];
            }
            core._listeners['exitframe'].push(this._onexitframe);

        },
        /**
         * _startRendering で登録したレンダリング用のイベントリスナを削除
         * @private
         */
        _stopRendering: function() {
            var core = enchant.Core.instance;
            core.removeEventListener('exitframe', this._onexitframe);
        },
        _getEntityByPosition: function(x, y) {
            var ctx = this._dctx;
            ctx.clearRect(0, 0, this.width, this.height);
            if (this._lastDetected < this.age) {
                detectrendering.call(this, ctx);
                this._lastDetected = this.age;
            }
            var color = ctx.getImageData(x, y, 1, 1).data;
            return this._colorManager.getSpriteByColor(color);
        },
        _touchstartPropagation: function(e) {
            this._touching = this._getEntityByPosition(e.x, e.y);
            if (this._touching) {
                propagationUp.call(this._touching, e, this.parentNode);
            } else {
                this._touching = enchant.Core.instance.currentScene;
                this._touching.dispatchEvent(e);
            }
            return this._touching;
        },
        _touchmovePropagation: function(e) {
            propagationUp.call(this._touching, e, this.parentNode);
        },
        _touchendPropagation: function(e) {
            propagationUp.call(this._touching, e, this.parentNode);
            this._touching = null;
        }
    });

    var canvasGroupInstances = [];
    var touchingEntity = null;
    var touchingGroup = null;

    var _touchstartFromDom = function(e) {
        var core = enchant.Core.instance;
        var group;
        for (var i = canvasGroupInstances.length - 1; i >= 0; i--) {
            group = canvasGroupInstances[i];
            if (group.scene !== core.currentScene) {
                continue;
            }
            var sp = group._touchstartPropagation(e);
            if (sp) {
                touchingEntity = sp;
                touchingGroup = group;
                return;
            }
        }
    };

    var _touchmoveFromDom = function(e) {
        if (touchingGroup != null) {
            touchingGroup._touchmovePropagation(e);
        }
    };
    var _touchendFromDom = function(e) {
        if (touchingGroup != null) {
            touchingGroup._touchendPropagation(e);
            touchingEntity = null;
            touchingGroup = null;
        }
    };

    var DetectColorManager = enchant.Class.create({
        initialize: function(reso, max) {
            this.reference = [];
            this.detectColorNum = 0;
            this.colorResolution = reso || 16;
            this.max = max || 1;
        },
        attachDetectColor: function(sprite) {
            this.detectColorNum += 1;
            this.reference[this.detectColorNum] = sprite;
            return this._createNewColor();
        },
        detachDetectColor: function(sprite) {
            var i = this.reference.indexOf(sprite);
            if (i !== -1) {
                this.reference[i] = null;
            }
        },
        _createNewColor: function() {
            var n = this.detectColorNum;
            var C = this.colorResolution;
            var d = C / this.max;
            return [
                parseInt((n / C / C) % C, 10) / d,
                parseInt((n / C) % C, 10) / d,
                parseInt(n % C, 10) / d, 1.0
            ];
        },
        _decodeDetectColor: function(color) {
            var C = this.colorResolution;
            return ~~(color[0] * C * C * C / 256) +
                ~~(color[1] * C * C / 256) +
                ~~(color[2] * C / 256);
        },
        getSpriteByColor: function(color) {
            return this.reference[this._decodeDetectColor(color)];
        }
    });

    var nodesWalker = function(pre, post) {
        pre = pre || function() {
        };
        post = post || function() {
        };
        var walker = function() {
            pre.apply(this, arguments);
            var child;
            if (this.childNodes) {
                for (var i = 0, l = this.childNodes.length; i < l; i++) {
                    child = this.childNodes[i];
                    walker.apply(child, arguments);
                }
            }
            post.apply(this, arguments);
        };
        return walker;
    };

    var makeTransformMatrix = function(node, dest) {
        var x = node._x;
        var y = node._y;
        var width = node._width || 0;
        var height = node._height || 0;
        var rotation = node._rotation || 0;
        var scaleX = (typeof node._scaleX === 'number') ? node._scaleX : 1;
        var scaleY = (typeof node._scaleY === 'number') ? node._scaleY : 1;
        var theta = rotation * Math.PI / 180;
        var tmpcos = Math.cos(theta);
        var tmpsin = Math.sin(theta);
        var w = (typeof node._originX === 'number') ? node._originX : width / 2;
        var h = (typeof node._originY === 'number') ? node._originY : height / 2;
        var a = scaleX * tmpcos;
        var b = scaleX * tmpsin;
        var c = scaleY * tmpsin;
        var d = scaleY * tmpcos;
        dest[0] = a;
        dest[1] = b;
        dest[2] = -c;
        dest[3] = d;
        dest[4] = (-a * w + c * h + x + w);
        dest[5] = (-b * w - d * h + y + h);
    };

    var alpha = function(ctx, node) {
        if (node.alphaBlending) {
            ctx.globalCompositeOperation = node.alphaBlending;
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = (typeof node.opacity === 'number') ? node.opacity : 1.0;
    };

    var _multiply = function(m1, m2, dest) {
        var a11 = m1[0], a21 = m1[2], adx = m1[4],
            a12 = m1[1], a22 = m1[3], ady = m1[5];
        var b11 = m2[0], b21 = m2[2], bdx = m2[4],
            b12 = m2[1], b22 = m2[3], bdy = m2[5];

        dest[0] = a11 * b11 + a21 * b12;
        dest[1] = a12 * b11 + a22 * b12;
        dest[2] = a11 * b21 + a21 * b22;
        dest[3] = a12 * b21 + a22 * b22;
        dest[4] = a11 * bdx + a21 * bdy + adx;
        dest[5] = a12 * bdx + a22 * bdy + ady;
    };

    var _multiplyVec = function(mat, vec, dest) {
        var x = vec[0], y = vec[1];
        var m11 = mat[0], m21 = mat[2], mdx = mat[4],
            m12 = mat[1], m22 = mat[3], mdy = mat[5];
        dest[0] = m11 * x + m21 * y + mdx;
        dest[1] = m12 * x + m22 * y + mdy;
    };

    var _stuck = [ [ 1, 0, 0, 1, 0, 0 ] ];
    var _transform = function(mat) {
        var newmat = [];
        _multiply(_stuck[_stuck.length - 1], mat, newmat);
        _stuck.push(newmat);
    };

    var transform = function(ctx, node) {
        if (node._dirty) {
            makeTransformMatrix(node, node._cvsCache.matrix);
        }
        _transform(node._cvsCache.matrix);
        var mat = _stuck[_stuck.length - 1];
        ctx.setTransform.apply(ctx, mat);
        var ox = (typeof node._originX === 'number') ? node._originX : node._width / 2 || 0;
        var oy = (typeof node._originY === 'number') ? node._originY : node._height / 2 || 0;
        var vec = [ ox, oy ];
        _multiplyVec(mat, vec, vec);
        node._offsetX = vec[0] - ox;
        node._offsetY = vec[1] - oy;
        node._dirty = false;
    };

    var render = function(ctx, node) {
        var core = enchant.Core.instance;
        if (typeof node.visible !== 'undefined' && !node.visible) {
            return;
        }
        if (node.backgroundColor) {
            ctx.fillStyle = node.backgroundColor;
            ctx.fillRect(0, 0, node.width, node.height);
        }

        if (node.cvsRender) {
            node.cvsRender(ctx);
        }

        if (core._debug) {
            if (node instanceof enchant.Label || node instanceof enchant.Sprite) {
                ctx.strokeStyle = '#ff0000';
            } else {
                ctx.strokeStyle = '#0000ff';
            }
            ctx.strokeRect(0, 0, node.width, node.height);
        }
    };

    var rendering = nodesWalker(
        function(ctx) {
            ctx.save();
            alpha(ctx, this);
            transform(ctx, this);
            render(ctx, this);
        },
        function(ctx) {
            ctx.restore();
            _stuck.pop();
        }
    );

    var array2hexrgb = function(arr) {
        return '#' + ("00" + Number(parseInt(arr[0], 10)).toString(16)).slice(-2) +
            ("00" + Number(parseInt(arr[1], 10)).toString(16)).slice(-2) +
            ("00" + Number(parseInt(arr[2], 10)).toString(16)).slice(-2);
    };

    var detectrender = function(ctx, node) {
        ctx.fillStyle = node._cvsCache.detectColor;
        ctx.fillRect(0, 0, node.width, node.height);
    };

    var detectrendering = nodesWalker(
        function(ctx) {
            ctx.save();
            transform(ctx, this);
            detectrender(ctx, this);
        },
        function(ctx) {
            ctx.restore();
            _stuck.pop();
        }
    );

    var attachCache = nodesWalker(
        function(colorManager) {
            if (!this._cvsCache) {
                this._cvsCache = {};
                this._cvsCache.matrix = [ 1, 0, 0, 1, 0, 0 ];
                this._cvsCache.detectColor = array2hexrgb(colorManager.attachDetectColor(this));
            }
        }
    );

    var detachCache = nodesWalker(
        function(colorManager) {
            if (this._cvsCache) {
                colorManager.detachDetectColor(this);
                delete this._cvsCache;
            }
        }
    );

    var propagationUp = function(e, end) {
        this.dispatchEvent(e);
    };
}());

/**
 * @scope enchant.Scene.prototype
 */
enchant.CanvasScene = enchant.Class.create(enchant.CanvasGroup, {
    /**
     * Eine Klasse die zur Wurzel in Objektbaum wird, welcher dargestellt werden kann.
     *
     * @example
     *   var scene = new CanvasScene();
     *   scene.addChild(player);
     *   scene.addChild(enemy);
     *   core.pushScene(scene);
     *
     * @constructs
     * @extends enchant.CanvasGroup
     */
    initialize: function() {
        enchant.CanvasGroup.call(this);
        this.scene = this;
        this._element.style[enchant.ENV.VENDOR_PREFIX + 'TransformOrigin'] = '0 0';
        this._element.style[enchant.ENV.VENDOR_PREFIX + 'Transform'] = 'scale(' + enchant.Core.instance.scale + ')';
    },
    /**
    * Die Hintergrundfarbe der Canvas Szene.
    * Muss im gleichen Format definiert werden wie das CSS 'color' Attribut.
    * @type {String}
    */
    backgroundColor: {
        get: function() {
            return this._backgroundColor;
        },
        set: function(color) {
            this._backgroundColor = color;
        }
    },
    _updateCoordinate: function() {
        this._offsetX = this._x;
        this._offsetY = this._y;
        for (var i = 0, len = this.childNodes.length; i < len; i++) {
            this.childNodes[i]._updateCoordinate();
        }
        this._dirty = true;
    }
});

enchant.Scene = enchant.CanvasScene;
/**
 * @scope enchant.Surface.prototype
 */
enchant.Surface = enchant.Class.create(enchant.EventTarget, {
    /**
     * Diese Klasse dient als Hüllenklasse (Wrapper) für Canvas Elemente.
     *
     * Mit dieser Klasse können die image Felder der {@link enchant.Sprite} und {@link enchant.Map}'s
     * Klassen gesetzt werden und dadurch dargestellt werden.
     * Falls die Canvas API genutzt werden möchte kann dies über die 
     * {@link enchant.Surface#context} Variable erfolgen.
     *
     * @example
     *   // Erstellt einen Sprite und stellt einen Kreis dar.
     *   var ball = new Sprite(50, 50);
     *   var surface = new Surface(50, 50);
     *   surface.context.beginPath();
     *   surface.context.arc(25, 25, 25, 0, Math.PI*2, true);
     *   surface.context.fill();
     *   ball.image = surface;
     *
     * @param {Number} width Die Breite der Surface.
     * @param {Number} height Die Höhe der Surface.
     * @constructs
     */
    initialize: function(width, height) {
        enchant.EventTarget.call(this);

        var core = enchant.Core.instance;

        /**
         * Die Breite der Surface.
         * @type {Number}
         */
        this.width = width;
        /**
         * Die Höhe der Surface.
         * @type {Number}
         */
        this.height = height;
        /**
         * Der Surface Zeichenkontext.
         * @type {CanvasRenderingContext2D}
         */
        this.context = null;

        var id = 'enchant-surface' + core._surfaceID++;
        if (document.getCSSCanvasContext) {
            this.context = document.getCSSCanvasContext('2d', id, width, height);
            this._element = this.context.canvas;
            this._css = '-webkit-canvas(' + id + ')';
            var context = this.context;
        } else if (document.mozSetImageElement) {
            this._element = document.createElement('canvas');
            this._element.width = width;
            this._element.height = height;
            this._css = '-moz-element(#' + id + ')';
            this.context = this._element.getContext('2d');
            document.mozSetImageElement(id, this._element);
        } else {
            this._element = document.createElement('canvas');
            this._element.width = width;
            this._element.height = height;
            this._element.style.position = 'absolute';
            this.context = this._element.getContext('2d');

            enchant.ENV.CANVAS_DRAWING_METHODS.forEach(function(name) {
                var method = this.context[name];
                this.context[name] = function() {
                    method.apply(this, arguments);
                    this._dirty = true;
                };
            }, this);
        }
    },
    /**
     * Liefert einen Pixel der Surface.
     * @param {Number} x Die x Koordinaten des Pixel.
     * @param {Number} y Die y Koordinaten des Pixel.
     * @return {Array.<Number>} Ein Array das die Pixelinformationen im [r, g, b, a] Format enthält.
     */
    getPixel: function(x, y) {
        return this.context.getImageData(x, y, 1, 1).data;
    },
    /**
     * Setzt einen Pixel in der Surface.
     * @param {Number} x Die x Koordinaten des Pixel.
     * @param {Number} y Die y Koordinaten des Pixel.
     * @param {Number} r Der Rotwert des Pixel.
     * @param {Number} g Der Grünwert des Pixel.
     * @param {Number} b Der Blauwert des Pixels.
     * @param {Number} a Die Transparenz des Pixels
     */
    setPixel: function(x, y, r, g, b, a) {
        var pixel = this.context.createImageData(1, 1);
        pixel.data[0] = r;
        pixel.data[1] = g;
        pixel.data[2] = b;
        pixel.data[3] = a;
        this.context.putImageData(pixel, x, y);
    },
    /**
     * Löscht alle Pixel und setzt macht die Pixel transparent.
     */
    clear: function() {
        this.context.clearRect(0, 0, this.width, this.height);
    },
    /**
     * Zeichnet den Inhalt der gegebenen Surface auf diese Surface.
     *
     * Umhüllt (wraps) die Canvas drawImage Methode und sollten mehrere Argumente
     * übergeben werden, werden diese auf die Canvas drawImage Methode angewendet.
     *
     * @example
     *   var src = game.assets['src.gif'];
     *   var dst = new Surface(100, 100);
     *   dst.draw(src);         // Zeichnet src bei (0, 0)
     *   dst.draw(src, 50, 50); // Zeichnet src bei (50, 50)
     *   // Zeichnet src an der Position (50,50), jedoch nur 30x30 Pixel
     *   dst.draw(src, 50, 50, 30, 30);
     *   // Skaliert und zeichnet den Bereich mit der (Breite, Höhe) von (40, 40)
     *   // in src ab (10,10) in diese Surface bei (50,50) mit einer (Breite, Höhe) von (30, 30).
     *   dst.draw(src, 10, 10, 40, 40, 50, 50, 30, 30);
     *
     * @param {enchant.Surface} image Surface used in drawing.
     */
    draw: function(image) {
        image = image._element;
        if (arguments.length === 1) {
            this.context.drawImage(image, 0, 0);
        } else {
            var args = arguments;
            args[0] = image;
            this.context.drawImage.apply(this.context, args);
        }
    },
    /**
     * Kopiert diese Surface.
     * @return {enchant.Surface} Die kopierte Surface.
     */
    clone: function() {
        var clone = new enchant.Surface(this.width, this.height);
        clone.draw(this);
        return clone;
    },
    /**
     * Erstellt eine Data-URL (URI Schema) für diese Surface.
     * @return {String} Die Data-URL, welche diese Surface identifiziert und 
     * welche genutzt werden kann um diese in einen DOM Baum einzubinden.
     */
    toDataURL: function() {
        var src = this._element.src;
        if (src) {
            if (src.slice(0, 5) === 'data:') {
                return src;
            } else {
                return this.clone().toDataURL();
            }
        } else {
            return this._element.toDataURL();
        }
    }
});

/**
 * Läd eine Grafik und erstellt daraus ein Surface Objekt.
 *
 * Bei Grafiken die mit dieser Methode erstellt wurden ist es nicht möglich auf Variablen oder Methoden des {@link enchant.Surface#context} 
 * zuzugreifen, oder Methoden die die Canvas API nutzen, wie {@link enchant.Surface#draw}, {@link enchant.Surface#clear}, 
 * {@link enchant.Surface#getPixel}, {@link enchant.Surface#setPixel}.., aufzurufen.
 * Jedoch ist es möglich diese Surface zu nutzen um sie in eine andere Surface mittels der {@link enchant.Surface#draw} zu zeichen.
 * Die daraus resultierende Surface kann dann manipuliert werden. (Wenn Bilder in einer Cross-Origin Resource Sharing Umgebung
 * geladen werden, kann es sein, dass die Pixelabfrage und andere Bildmanipulationen limitiert sind)
 *
 * @param {String} src Der Dateipfad der Grafik die geladen werden soll.
 * @static
 */
enchant.Surface.load = function(src) {
    var image = new Image();
    var surface = Object.create(enchant.Surface.prototype, {
        context: { value: null },
        _css: { value: 'url(' + src + ')' },
        _element: { value: image }
    });
    enchant.EventTarget.call(surface);
    image.src = src;
    image.onerror = function() {
        throw new Error('Cannot load an asset: ' + image.src);
    };
    image.onload = function() {
        surface.width = image.width;
        surface.height = image.height;
        surface.dispatchEvent(new enchant.Event('load'));
    };
    return surface;
};

/**
 * @scope enchant.Sound.prototype
 */
enchant.Sound = enchant.Class.create(enchant.EventTarget, {
    /**
     * Klasse die eine Hüllenklasse (Wrapper) für Audio Elemente darstellt. 
     *
     * Safari, Chrome, Firefox, Opera, und IE können alle MP3 Dateien abspielen
     * (Firefox und Opera spielen diese mit Hilfe von Flash ab). WAVE Dateien können 
     * Safari, Chrome, Firefox, and Opera abspielen. Sollte der Browser nicht mit
     * dem genutzten Codec kompatibel sein, wird die Datei nicht abgespielt. 
     *
     * Instanzen dieser Klasse werden nicht mit Hilfe des Konstruktors, sondern mit 
     * {@link enchant.Sound.load} erstellt.
     * @constructs
     */
    initialize: function() {
        enchant.EventTarget.call(this);
        /**
         * Die länge der Sounddatei in Sekunden.
         * @type {Number}
         */
        this.duration = 0;
        throw new Error("Illegal Constructor");
    },
    /**
     * Startet die Wiedergabe.
     */
    play: function() {
        if (this._element){
            this._element.play();
        }
    },
    /**
     * Pausiert die Wiedergabe.
     */
    pause: function() {
        if (this._element){
            this._element.pause();
        }
    },
    /**
     * Stoppt die Wiedergabe.
     */
    stop: function() {
        this.pause();
        this.currentTime = 0;
    },
    /**
     * Erstellt eine Kopie dieses Soundobjektes.
     * @return {enchant.Sound} Kopiertes Sound Objekt.
     */
    clone: function() {
        var clone;
        if (this._element instanceof Audio) {
            clone = Object.create(enchant.Sound.prototype, {
                _element: { value: this._element.cloneNode(false) },
                duration: { value: this.duration }
            });
        } else if (enchant.ENV.USE_FLASH_SOUND) {
            return this;
        } else {
            clone = Object.create(enchant.Sound.prototype);
        }
        enchant.EventTarget.call(clone);
        return clone;
    },
    /**
     * Aktuelle Wiedergabeposition (seconds).
     * @type {Number}
     */
    currentTime: {
        get: function() {
            return this._element ? this._element.currentTime : 0;
        },
        set: function(time) {
            if (this._element){
                this._element.currentTime = time;
            }
        }
    },
    /**
     * Lautstärke. 0 (stumm) ～ 1 (volle Lautstärke).
     * @type {Number}
     */
    volume: {
        get: function() {
            return this._element ? this._element.volume : 1;
        },
        set: function(volume) {
            if (this._element){
                this._element.volume = volume;
            }
        }
    }
});

/**
 * Läd eine Audio Datei und erstellt ein Sound objekt.
 *
 * @param {String} src Pfad zu der zu ladenden Audiodatei.
 * @param {String} [type] MIME Type der Audtiodatei.
 * @static
 */
enchant.Sound.load = function(src, type) {
    if (type == null) {
        var ext = enchant.Core.findExt(src);
        if (ext) {
            type = 'audio/' + ext;
        } else {
            type = '';
        }
    }
    type = type.replace('mp3', 'mpeg').replace('m4a', 'mp4');

    var sound = Object.create(enchant.Sound.prototype);
    enchant.EventTarget.call(sound);
    var audio = new Audio();
    if (!enchant.Sound.enabledInMobileSafari &&
        enchant.ENV.VENDOR_PREFIX === 'webkit' && enchant.ENV.TOUCH_ENABLED) {
        window.setTimeout(function() {
            sound.dispatchEvent(new enchant.Event('load'));
        }, 0);
    } else {
        if (!enchant.ENV.USE_FLASH_SOUND && audio.canPlayType(type)) {
            audio.src = src;
            audio.load();
            audio.autoplay = false;
            audio.onerror = function() {
                throw new Error('Cannot load an asset: ' + audio.src);
            };
            audio.addEventListener('canplaythrough', function() {
                sound.duration = audio.duration;
                sound.dispatchEvent(new enchant.Event('load'));
            }, false);
            sound._element = audio;
        } else if (type === 'audio/mpeg') {
            var embed = document.createElement('embed');
            var id = 'enchant-audio' + enchant.Core.instance._soundID++;
            embed.width = embed.height = 1;
            embed.name = id;
            embed.src = 'sound.swf?id=' + id + '&src=' + src;
            embed.allowscriptaccess = 'always';
            embed.style.position = 'absolute';
            embed.style.left = '-1px';
            sound.addEventListener('load', function() {
                Object.defineProperties(embed, {
                    currentTime: {
                        get: function() {
                            return embed.getCurrentTime();
                        },
                        set: function(time) {
                            embed.setCurrentTime(time);
                        }
                    },
                    volume: {
                        get: function() {
                            return embed.getVolume();
                        },
                        set: function(volume) {
                            embed.setVolume(volume);
                        }
                    }
                });
                sound._element = embed;
                sound.duration = embed.getDuration();
            });
            enchant.Core.instance._element.appendChild(embed);
            enchant.Sound[id] = sound;
        } else {
            window.setTimeout(function() {
                sound.dispatchEvent(new enchant.Event('load'));
            }, 0);
        }
    }
    return sound;
};

enchant.Sound.enabledInMobileSafari = false;
