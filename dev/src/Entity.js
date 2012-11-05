/**
 * @scope enchant.Entity.prototype
 */
enchant.Entity = enchant.Class.create(enchant.Node, {
    /**
     [lang:ja]
     * DOM上で表示する実体を持ったクラス.直接使用することはない.
     [/lang]
     [lang:en]
     * A class with objects displayed as DOM elements. Not used directly.
     [/lang]
     [lang:de]
     * Eine Klasse die Objekte mit Hilfe von DOM Elementen darstellt.
     * Sollte nicht direkt verwendet werden.
     [/lang]
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
         [lang:ja]
         * Entityにボタンの機能を設定する.
         * Entityに対するタッチ, クリックをleft, right, up, down, a, bいずれかの
         * ボタン入力として割り当てる.
         [/lang]
         [lang:en]
         * Defines this Entity as a button.
         * When touched or clicked the corresponding button event is dispatched.
         * Valid buttonModes are: left, right, up, down, a, b. 
         [/lang]
         [lang:de]
         * Definiert diese Entity als Schaltfläche (Button).
         * Bei einem Klick oder Touch wird das entsprechende
         * Button Ereignis (Event) ausgelöst.
         * Mögliche buttonModes sind: left, right, up, down, a, b. 
         [/lang]
         * @type {String}
         */
        this.buttonMode = null;
        /**
         [lang:ja]
         * Entityが押されているかどうか.
         * {@link enchant.Entity.buttonMode}が設定されているときだけ機能する.
         [/lang]
         [lang:en]
         * Indicates if this Entity is being clicked.
         * Only works when {@link enchant.Entity.buttonMode} is set.
         [/lang]
         [lang:de]
         * Zeigt an, ob auf die Entity geklickt wurde.
         * Funktioniert nur wenn {@link enchant.Entity.buttonMode} gesetzt ist.
         [/lang]
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
     [lang:ja]
     * Entityの横幅.
     [/lang]
     [lang:en]
     * The width of the Entity.
     [/lang]
     [lang:de]
     * Die Breite der Entity.
     [/lang]
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
     [lang:ja]
     * Entityの高さ.
     [/lang]
     [lang:en]
     * The height of the Entity.
     [/lang]
     [lang:de]
     * Die Höhe der Entity.
     [/lang]
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
     [lang:ja]
     * Entityの背景色.
     * CSSの'color'プロパティと同様の形式で指定できる.
     [/lang]
     [lang:en]
     * The Entity background color.
     * Must be provided in the same format as the CSS 'color' property.
     [/lang]
     [lang:de]
     * Die Hintergrundfarbe der Entity.
     * Muss im gleichen Format definiert werden wie das CSS 'color' Attribut.
     [/lang]
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
     [lang:ja]
     * Entityの透明度.
     * 0から1までの値を設定する(0が完全な透明, 1が完全な不透明).
     [/lang]
     [lang:en]
     * The transparency of this entity.
     * Defines the transparency level from 0 to 1
     * (0 is completely transparent, 1 is completely opaque).
     [/lang]
     [lang:de]
     * Transparenz der Entity.
     * Definiert den Level der Transparenz von 0 bis 1
     * (0 ist komplett transparent, 1 ist vollständig deckend).
     [/lang]
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
     [lang:ja]
     * Entityを表示するかどうかを指定する.
     [/lang]
     [lang:en]
     * Indicates whether or not to display this Entity.
     [/lang]
     [lang:de]
     * Zeigt an, ob die Entity dargestellt werden soll oder nicht.
     [/lang]
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
     [lang:ja]
     * Entityのタッチを有効にするかどうかを指定する.
     [/lang]
     [lang:en]
     * Indicates whether or not this Entity can be touched.
     [/lang]
     [lang:de]
     * Definiert ob auf die Entity geklickt werden kann. 
     [/lang]
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
     [lang:ja]
     * Entityの矩形が交差しているかどうかにより衝突判定を行う.
     * @param {*} other 衝突判定を行うEntityなどx, y, width, heightプロパティを持ったObject.
     * @return {Boolean} 衝突判定の結果.
     [/lang]
     [lang:en]
     * Performs a collision detection based on whether or not the bounding rectangles are intersecting.
     * @param {*} other An object like Entity, with the properties x, y, width, height, which are used for the 
     * collision detection.
     * @return {Boolean} True, if a collision was detected.
     [/lang]
     [lang:de]
     * Führt eine Kollisionsdetektion durch, die überprüft ob eine Überschneidung zwischen den
     * begrenzenden Rechtecken existiert. 
     * @param {*} other Ein Objekt wie Entity, welches x, y, width und height Variablen besitzt,
     * mit dem die Kollisionsdetektion durchgeführt wird.
     * @return {Boolean} True, falls eine Kollision festgestellt wurde.
     [/lang]
     */
    intersect: function(other) {
        return this._offsetX < other._offsetX + other.width && other._offsetX < this._offsetX + this.width &&
            this._offsetY < other._offsetY + other.height && other._offsetY < this._offsetY + this.height;
    },
    /**
     [lang:ja]
     * Entityの中心点どうしの距離により衝突判定を行う.
     * @param {*} other 衝突判定を行うEntityなどx, y, width, heightプロパティを持ったObject.
     * @param {Number} [distance] 衝突したと見なす最大の距離. デフォルト値は二つのEntityの横幅と高さの平均.
     * @return {Boolean} 衝突判定の結果.
     [/lang]
     [lang:en]
     * Performs a collision detection based on distance from the Entity's central point.
     * @param {*} other An object like Entity, with properties x, y, width, height, which are used for the 
     * collision detection.
     * @param {Number} [distance] The greatest distance to be considered for a collision.
     * The default distance is the average of both objects width and height.
     * @return {Boolean} True, if a collision was detected.
     [/lang]
     [lang:de]
     * Führt eine Kollisionsdetektion durch, die anhand der Distanz zwischen den Objekten feststellt,
     * ob eine Kollision aufgetreten ist.
     * @param {*} other Ein Objekt wie Entity, welches x, y, width und height Variablen besitzt,
     * mit dem die Kollisionsdetektion durchgeführt wird.
     * @param {Number} [distance] Die größte Distanz die für die Kollision in betracht gezogen wird.
     * Der Standardwert ist der Durchschnitt der Breite und Höhe beider Objekte.
     * @return {Boolean} True, falls eine Kollision festgestellt wurde.
     [/lang]
     */
    within: function(other, distance) {
        if (distance == null) {
            distance = (this.width + this.height + other.width + other.height) / 4;
        }
        var _;
        return (_ = this._offsetX - other._offsetX + (this.width - other.width) / 2) * _ +
            (_ = this._offsetY - other._offsetY + (this.height - other.height) / 2) * _ < distance * distance;
    }, /**
     [lang:ja]
     * Spriteを拡大縮小する.
     * @param {Number} x 拡大するx軸方向の倍率.
     * @param {Number} [y] 拡大するy軸方向の倍率.
     [/lang]
     [lang:en]
     * Enlarges or shrinks this Sprite.
     * @param {Number} x Scaling factor on the x axis.
     * @param {Number} [y] Scaling factor on the y axis.
     [/lang]
     [lang:de]
     * Vergrößert oder verkleinert dieses Sprite.
     * @param {Number} x Skalierungsfaktor auf der x-Achse.
     * @param {Number} [y] Skalierungsfaktor auf der y-Achse.
     [/lang]
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
     [lang:ja]
     * Spriteを回転する.
     * @param {Number} deg 回転する角度 (度数法).
     [/lang]
     [lang:en]
     * Rotate this Sprite.
     * @param {Number} deg Rotation angle (degree).
     [/lang]
     [lang:de]
     * Rotiert dieses Sprite.
     * @param {Number} deg Rotationswinkel (Grad).
     [/lang]
     */
    rotate: function(deg) {
        this._rotation += deg;
        this._dirty = true;
    },
    /**
     [lang:ja]
     * Spriteのx軸方向の倍率.
     [/lang]
     [lang:en]
     * Scaling factor on the x axis of this Sprite.
     [/lang]
     [lang:de]
     * Skalierungsfaktor auf der x-Achse dieses Sprites.
     [/lang]
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
     [lang:ja]
     * Spriteのy軸方向の倍率.
     [/lang]
     [lang:en]
     * Scaling factor on the y axis of this Sprite.
     [/lang]
     [lang:de]
     * Skalierungsfaktor auf der y-Achse dieses Sprites.
     [/lang]
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
     [lang:ja]
     * Spriteの回転角 (度数法).
     [/lang]
     [lang:en]
     * Sprite rotation angle (degree).
     [/lang]
     [lang:de]
     * Rotationswinkel des Sprites (Grad).
     [/lang]
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
     [lang:ja]
     * 回転・拡大縮小の基準点のX座標
     [/lang]
     [lang:en]
     * The point of origin used for rotation and scaling.
     [/lang]
     [lang:de]
     * Ausgangspunkt für Rotation und Skalierung.
     [/lang]
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
     [lang:ja]
     * 回転・拡大縮小の基準点のY座標
     [/lang]
     [lang:en]
     * The point of origin used for rotation and scaling.
     [/lang]
     [lang:de]
     * Ausgangspunkt für Rotation und Skalierung.
     [/lang]
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
