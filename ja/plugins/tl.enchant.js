/**
 * @fileOverview
 * tl.enchant.js
 * tl.enchant.js is now bundled into enchant.js.
 * you don't have to include tl.enchant.js
 *
 * @example
 * var bear = new Sprite(32, 32);
 * bear.tl.hide().tween({
 *     opacity: 0,
 *     scaleX: 3,
 *     scaleY: 3,
 *     time: 30
 * });
 * game.rootScene.addChild(bear);
 *
 * @example
 * var bear = new Sprite(32, 32);
 * bear.cue({
 *      0: function(){ do.something(); },
 *     10: function(){ do.something(); },
 *     20: function(){ do.something(); },
 *     30: function(){ do.something(); }
 * });
 *
 **/