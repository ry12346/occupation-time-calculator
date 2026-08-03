(function () {
    "use strict";

    var calculator = window.OccupationCalculator;
    var form = document.getElementById("calculator-form");
    var startInput = document.getElementById("start-datetime");
    var tileInput = document.getElementById("tile-count");
    var nowButton = document.getElementById("set-now");
    var copyButton = document.getElementById("copy-result");
    var errorBox = document.getElementById("error-message");
    var resultSection = document.getElementById("results");

    var dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        hourCycle: "h23"
    });

    var compactFormatter = new Intl.DateTimeFormat("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        hourCycle: "h23"
    });

    function pad(value) {
        return String(value).padStart(2, "0");
    }

    function toDateTimeLocalValue(date) {
        return date.getFullYear() + "-" +
            pad(date.getMonth() + 1) + "-" +
            pad(date.getDate()) + "T" +
            pad(date.getHours()) + ":" +
            pad(date.getMinutes());
    }

    function parseLocalDateTime(value) {
        var match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);

        if (!match) {
            return new Date(NaN);
        }

        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3]),
            Number(match[4]),
            Number(match[5]),
            Number(match[6] || 0),
            0
        );
    }

    function formatDuration(totalSeconds) {
        var seconds = Math.floor(totalSeconds);
        var days = Math.floor(seconds / 86400);
        seconds %= 86400;
        var hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        var minutes = Math.floor(seconds / 60);
        seconds %= 60;

        var parts = [];
        if (days > 0) {
            parts.push(days + "日");
        }
        if (hours > 0 || days > 0) {
            parts.push(hours + "時間");
        }
        if (minutes > 0 || hours > 0 || days > 0) {
            parts.push(minutes + "分");
        }
        if (seconds > 0 || parts.length === 0) {
            parts.push(seconds + "秒");
        }

        return parts.join("");
    }

    function formatEntry(entry, emptyText) {
        if (!entry) {
            return "<span class=\"entry-none\">" + emptyText + "</span>";
        }

        return "<strong>" + entry.tile.toLocaleString("ja-JP") + "マス目から</strong>" +
            "<span>" + compactFormatter.format(entry.time) + " 開始</span>";
    }

    function getBandClass(key) {
        if (key === "midnight") {
            return "band-midnight";
        }
        if (key === "earlyMorning") {
            return "band-early";
        }
        return "band-normal";
    }

    function renderSegments(segments) {
        return segments.map(function (segment) {
            var range = segment.startTile === segment.endTile
                ? segment.startTile.toLocaleString("ja-JP") + "マス目"
                : segment.startTile.toLocaleString("ja-JP") + "〜" + segment.endTile.toLocaleString("ja-JP") + "マス目";

            return "<li class=\"timeline-item\">" +
                "<span class=\"timeline-dot " + getBandClass(segment.band.key) + "\"></span>" +
                "<div class=\"timeline-content\">" +
                    "<div class=\"timeline-title\">" +
                        "<strong>" + range + "</strong>" +
                        "<span class=\"band-badge " + getBandClass(segment.band.key) + "\">1マス " + segment.band.shortLabel + "</span>" +
                    "</div>" +
                    "<p>" + compactFormatter.format(segment.startTime) + " にこの時間帯へ移行</p>" +
                "</div>" +
            "</li>";
        }).join("");
    }

    function setText(id, value) {
        document.getElementById(id).textContent = value;
    }

    function renderResult(result, shouldScroll) {
        setText("end-time", dateTimeFormatter.format(result.endTime));
        setText("elapsed-time", formatDuration(result.totalSeconds));
        setText("occupation-time", formatDuration(result.occupationSeconds));
        setText("movement-time", formatDuration(result.movementSeconds));

        document.getElementById("entry-midnight").innerHTML = formatEntry(
            result.firstEntry.midnight,
            "今回の計算では0:00〜2:00に入りません"
        );
        document.getElementById("entry-early").innerHTML = formatEntry(
            result.firstEntry.earlyMorning,
            "今回の計算では2:00〜6:00に入りません"
        );

        document.getElementById("timeline-list").innerHTML = renderSegments(result.segments);

        setText("normal-count", result.tileCountsByBand.normal.toLocaleString("ja-JP") + "マス");
        setText("midnight-count", result.tileCountsByBand.midnight.toLocaleString("ja-JP") + "マス");
        setText("early-count", result.tileCountsByBand.earlyMorning.toLocaleString("ja-JP") + "マス");
        setText("normal-total", formatDuration(result.secondsByBand.normal));
        setText("midnight-total", formatDuration(result.secondsByBand.midnight));
        setText("early-total", formatDuration(result.secondsByBand.earlyMorning));

        resultSection.hidden = false;
        copyButton.disabled = false;
        if (shouldScroll) {
            resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function calculate(event) {
        if (event) {
            event.preventDefault();
        }

        errorBox.hidden = true;
        errorBox.textContent = "";

        try {
            var start = parseLocalDateTime(startInput.value);
            var tileCount = Number(tileInput.value);
            var result = calculator.calculateOccupation(start, tileCount);
            renderResult(result, Boolean(event));
            try {
                window.localStorage.setItem("occupationStart", startInput.value);
                window.localStorage.setItem("occupationTiles", tileInput.value);
            } catch (storageError) {
                // 保存できない環境でも計算自体は継続します。
            }
        } catch (error) {
            resultSection.hidden = true;
            copyButton.disabled = true;
            errorBox.textContent = error.message || "計算中にエラーが発生しました。";
            errorBox.hidden = false;
        }
    }

    function setNow() {
        var now = new Date();
        now.setSeconds(0, 0);
        startInput.value = toDateTimeLocalValue(now);
    }

    function buildCopyText() {
        var result = calculator.calculateOccupation(parseLocalDateTime(startInput.value), Number(tileInput.value));
        var midnightText = result.firstEntry.midnight
            ? result.firstEntry.midnight.tile.toLocaleString("ja-JP") + "マス目（" + compactFormatter.format(result.firstEntry.midnight.time) + "）"
            : "該当なし";
        var earlyText = result.firstEntry.earlyMorning
            ? result.firstEntry.earlyMorning.tile.toLocaleString("ja-JP") + "マス目（" + compactFormatter.format(result.firstEntry.earlyMorning.time) + "）"
            : "該当なし";

        return [
            "占領時間計算結果",
            "開始: " + dateTimeFormatter.format(result.startTime),
            "マス数: " + result.tileCount.toLocaleString("ja-JP") + "マス",
            "終了予想: " + dateTimeFormatter.format(result.endTime),
            "所要時間: " + formatDuration(result.totalSeconds),
            "10分帯に入るマス: " + midnightText,
            "30分帯に入るマス: " + earlyText
        ].join("\n");
    }

    function copyResult() {
        var text;

        try {
            text = buildCopyText();
        } catch (error) {
            return;
        }

        navigator.clipboard.writeText(text).then(function () {
            var original = copyButton.textContent;
            copyButton.textContent = "コピーしました";
            window.setTimeout(function () {
                copyButton.textContent = original;
            }, 1600);
        }).catch(function () {
            var textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "readonly");
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        });
    }

    form.addEventListener("submit", calculate);
    nowButton.addEventListener("click", setNow);
    copyButton.addEventListener("click", copyResult);

    var savedStart = null;
    var savedTiles = null;

    try {
        savedStart = window.localStorage.getItem("occupationStart");
        savedTiles = window.localStorage.getItem("occupationTiles");
    } catch (storageError) {
        // 保存領域を利用できない環境では既定値を使います。
    }

    if (savedStart) {
        startInput.value = savedStart;
    } else {
        setNow();
    }

    if (savedTiles) {
        tileInput.value = savedTiles;
    }

    calculate();
}());
