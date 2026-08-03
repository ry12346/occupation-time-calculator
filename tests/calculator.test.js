"use strict";

var assert = require("assert");
var calculator = require("../calculator.js");

function localDate(year, month, day, hour, minute, second) {
    return new Date(year, month - 1, day, hour, minute, second || 0, 0);
}

function assertDate(actual, expected, message) {
    assert.strictEqual(actual.getTime(), expected.getTime(), message);
}

(function run() {
    var result;

    result = calculator.calculateOccupation(localDate(2026, 8, 3, 12, 0), 1);
    assertDate(result.endTime, localDate(2026, 8, 3, 12, 5), "通常帯の1マスは5分");

    result = calculator.calculateOccupation(localDate(2026, 8, 3, 0, 0), 1);
    assertDate(result.endTime, localDate(2026, 8, 3, 0, 10), "0時台の1マスは10分");

    result = calculator.calculateOccupation(localDate(2026, 8, 3, 2, 0), 1);
    assertDate(result.endTime, localDate(2026, 8, 3, 2, 30), "2時台の1マスは30分");

    result = calculator.calculateOccupation(localDate(2026, 8, 3, 6, 0), 1);
    assertDate(result.endTime, localDate(2026, 8, 3, 6, 5), "6時から通常帯へ戻る");

    result = calculator.calculateOccupation(localDate(2026, 8, 3, 23, 55), 2);
    assertDate(result.endTime, localDate(2026, 8, 4, 0, 10, 15), "移動後に0時帯へ入る");
    assert.strictEqual(result.firstEntry.midnight.tile, 2, "10分帯は2マス目から");

    result = calculator.calculateOccupation(localDate(2026, 8, 3, 1, 59), 2);
    assertDate(result.endTime, localDate(2026, 8, 3, 2, 39, 15), "マス開始時刻で所要時間を決める");
    assert.strictEqual(result.firstEntry.earlyMorning.tile, 2, "30分帯は2マス目から");

    assert.throws(function () {
        calculator.calculateOccupation(localDate(2026, 8, 3, 12, 0), 0);
    }, /1以上/, "0マスはエラー");

    console.log("All calculator tests passed.");
}());
