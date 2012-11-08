/**
 [lang:ja]
 * @scope enchant.Node.prototype
 [/lang]
 [lang:en]
 * @scope enchant.Node.prototype
 [/lang]
 */
enchant.Node = enchant.Class.create(enchant.EventTarget, {
    /**
     [lang:ja]
     * Sceneをルートとした表示オブジェクトツリーに属するオブジェクトの基底クラス.
     * 直接使用することはない.
     * @constructs
     * @extends enchant.EventTarget
     [/lang]
     [lang:en]
     * Base class for objects in displayed object tree routed to Scene.
     * Not directly used.
     * @constructs
     * @extends enchant.EventTarget
     [/lang]
     */
    initialize: function() {
        enchant.EventTarget.call(this);

        this._dirty = false;

        this._matrix = [ 1, 0, 0, 1, 0, 0 ];

        this._x = 0;
        this._y = 0;
        this._offsetX = 0;
        this._offsetY = 0;

        /**
         * [lang:ja]
         * Node が画面に表示されてから経過したフレーム数。
         * ENTER_FRAME イベントを受け取る前にインクリメントされる。
         * (ENTER_FRAME イベントのリスナが初めて実行される時に 1 となる。)
         * [/lang]
         * [lang:en]
         * age (frames) of this node which will be increased before this node receives ENTER_FRAME event.
         * [/lang]
         * @type {Number}
         */
        this.age = 0;

        /**
         [lang:ja]
         * Nodeの親Node.
         * @type {enchant.Group}
         [/lang]
         [lang:en]
         * Parent Node for Node.
         * @type {enchant.Group}
         [/lang]
         */
        this.parentNode = null;
        /**
         [lang:ja]
         * Nodeが属しているScene.
         * @type {enchant.Scene}
         [/lang]
         [lang:en]
         * Scene to which Node belongs.
         * @type {enchant.Scene}
         [/lang]
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
     [lang:ja]
     * Nodeを移動する.
     * @param {Number} x 移動先のx座標.
     * @param {Number} y 移動先のy座標.
     [/lang]
     [lang:en]
     * Move Node.
     * @param {Number} x Target x coordinates.
     * @param {Number} y Target y coordinates.
     [/lang]
     */
    moveTo: function(x, y) {
        this._x = x;
        this._y = y;
        this._dirty = true;
    },
    /**
     [lang:ja]
     * Nodeを移動する.
     * @param {Number} x 移動するx軸方向の距離.
     * @param {Number} y 移動するy軸方向の距離.
     [/lang]
     [lang:en]
     * Move Node.
     * @param {Number} x x axis movement distance.
     * @param {Number} y y axis movement distance.
     [/lang]
     */
    moveBy: function(x, y) {
        this._x += x;
        this._y += y;
        this._dirty = true;
    },
    /**
     [lang:ja]
     * Nodeのx座標.
     * @type {Number}
     [/lang]
     [lang:en]
     * x coordinates of Node.
     * @type {Number}
     [/lang]
     */
    x: {
        get: function() {
            return this._x;
        },
        set: function(x) {
            this._x = x;
            this._dirty = true;
        }
    },
    /**
     [lang:ja]
     * Nodeのy座標.
     * @type {Number}
     [/lang]
     [lang:en]
     * y coordinates of Node.
     * @type {Number}
     [/lang]
     */
    y: {
        get: function() {
            return this._y;
        },
        set: function(y) {
            this._y = y;
            this._dirty = true;
        }
    },
    _updateCoordinate: function() {
        var node = this;
        var tree = [ node ];
        var parent = node.parentNode;
        var scene = this.scene;
        while (parent && node._dirty) {
            tree.unshift(parent);
            node = node.parentNode;
            parent = node.parentNode;
        }
        var matrix = enchant.Matrix.instance;
        var stack = matrix.stack;
        var mat = [];
        var newmat, ox, oy;
        stack.push(tree[0]._matrix);
        for (var i = 1, l = tree.length; i < l; i++) {
            node = tree[i];
            newmat = [];
            matrix.makeTransformMatrix(node, mat);
            matrix.multiply(stack[stack.length - 1], mat, newmat);
            node._matrix = newmat;
            stack.push(newmat);
            ox = (typeof node._originX === 'number') ? node._originX : node._width / 2 || 0;
            oy = (typeof node._originY === 'number') ? node._originY : node._height / 2 || 0;
            var vec = [ ox, oy ];
            matrix.multiplyVec(newmat, vec, vec);
            node._offsetX = vec[0] - ox;
            node._offsetY = vec[1] - oy;
            node._dirty = false;
        }
        matrix.reset();
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
