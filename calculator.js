(function (root, factory) {
    var api = factory();

    if (typeof module === "object" && module.exports) {
        module.exports = api;
    }

    root.OccupationCalculator = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    var MOVE_SECONDS = 15;
    var MAX_TILES = 100000;

    var BANDS = {
        normal: {
            key: "normal",
            label: "通常時間帯",
            shortLabel: "5分",
            secondsPerTile: 5 * 60,
            description: "7:00〜24:00"
        },
        midnight: {
            key: "midnight",
            label: "深夜時間帯",
            shortLabel: "10分",
            secondsPerTile: 10 * 60,
            description: "0:00〜2:00"
        },
        earlyMorning: {
            key: "earlyMorning",
            label: "早朝時間帯",
            shortLabel: "30分",
            secondsPerTile: 30 * 60,
            description: "2:00〜6:00"
        },
        morningTen: {
            key: "morningTen",
            label: "朝時間帯",
            shortLabel: "10分",
            secondsPerTile: 10 * 60,
            description: "6:00〜7:00"
        }
    };

    function cloneBand(band) {
        return {
            key: band.key,
            label: band.label,
            shortLabel: band.shortLabel,
            secondsPerTile: band.secondsPerTile,
            description: band.description
        };
    }

    function getBand(date) {
        var hour = date.getHours();

        if (hour >= 0 && hour < 2) {
            return BANDS.midnight;
        }

        if (hour >= 2 && hour < 6) {
            return BANDS.earlyMorning;
        }

        if (hour >= 6 && hour < 7) {
            return BANDS.morningTen;
        }

        return BANDS.normal;
    }

    function validateInput(start, tileCount) {
        if (!(start instanceof Date) || isNaN(start.getTime())) {
            throw new Error("開始日時が正しくありません。");
        }

        if (!Number.isInteger(tileCount) || tileCount < 1) {
            throw new Error("マス数は1以上の整数で入力してください。");
        }

        if (tileCount > MAX_TILES) {
            throw new Error("マス数は" + MAX_TILES.toLocaleString("ja-JP") + "以下で入力してください。");
        }
    }

    function calculateOccupation(start, tileCount) {
        validateInput(start, tileCount);

        var currentMs = start.getTime();
        var totals = {
            normal: 0,
            midnight: 0,
            earlyMorning: 0,
            morningTen: 0,
            movement: Math.max(0, tileCount - 1) * MOVE_SECONDS
        };
        var tileCounts = {
            normal: 0,
            midnight: 0,
            earlyMorning: 0,
            morningTen: 0
        };
        var transitions = [];
        var segments = [];
        var activeSegment = null;
        var firstEntry = {
            midnight: null,
            earlyMorning: null,
            morningTen: null
        };

        for (var tile = 1; tile <= tileCount; tile += 1) {
            var tileStart = new Date(currentMs);
            var band = getBand(tileStart);

            if (!activeSegment || activeSegment.band.key !== band.key) {
                if (activeSegment) {
                    activeSegment.endTile = tile - 1;
                    segments.push(activeSegment);
                }

                activeSegment = {
                    band: cloneBand(band),
                    startTile: tile,
                    endTile: tile,
                    startTime: new Date(currentMs)
                };

                transitions.push({
                    tile: tile,
                    time: new Date(currentMs),
                    band: cloneBand(band)
                });
            }

            if ((band.key === "midnight" || band.key === "earlyMorning" || band.key === "morningTen") && !firstEntry[band.key]) {
                firstEntry[band.key] = {
                    tile: tile,
                    time: new Date(currentMs),
                    band: cloneBand(band)
                };
            }

            totals[band.key] += band.secondsPerTile;
            tileCounts[band.key] += 1;
            currentMs += band.secondsPerTile * 1000;

            if (tile < tileCount) {
                currentMs += MOVE_SECONDS * 1000;
            }
        }

        activeSegment.endTile = tileCount;
        segments.push(activeSegment);

        var occupationSeconds = totals.normal + totals.midnight + totals.earlyMorning + totals.morningTen;
        var totalSeconds = occupationSeconds + totals.movement;

        return {
            startTime: new Date(start.getTime()),
            endTime: new Date(currentMs),
            tileCount: tileCount,
            moveSecondsPerTile: MOVE_SECONDS,
            totalSeconds: totalSeconds,
            occupationSeconds: occupationSeconds,
            movementSeconds: totals.movement,
            secondsByBand: {
                normal: totals.normal,
                midnight: totals.midnight,
                earlyMorning: totals.earlyMorning,
                morningTen: totals.morningTen
            },
            tileCountsByBand: tileCounts,
            firstEntry: firstEntry,
            transitions: transitions,
            segments: segments
        };
    }

    return {
        BANDS: BANDS,
        MOVE_SECONDS: MOVE_SECONDS,
        MAX_TILES: MAX_TILES,
        getBand: getBand,
        calculateOccupation: calculateOccupation
    };
}));
