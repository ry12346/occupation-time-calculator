(function () {
    "use strict";

    var calculator = window.OccupationCalculator;
    var form = document.getElementById("calculator-form");
    var startInput = document.getElementById("start-datetime");
    var startDisplay = document.getElementById("start-datetime-display");
    var tileInput = document.getElementById("tile-count");
    var nowButton = document.getElementById("set-now");
    var copyButton = document.getElementById("copy-result");
    var errorBox = document.getElementById("error-message");
    var resultSection = document.getElementById("results");
    var coordinateInput = document.getElementById("coordinate-input");
    var addCoordinateButton = document.getElementById("add-coordinate");
    var clearCoordinatesButton = document.getElementById("clear-coordinates");
    var coordinateList = document.getElementById("coordinate-list");
    var coordinateSummary = document.getElementById("coordinate-summary");
    var coordinateTotal = document.getElementById("coordinate-total");
    var coordinateMessage = document.getElementById("coordinate-message");
    var routePoints = [];

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

    function formatDateTimeInputDisplay(value) {
        var match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value || ""));

        if (!match) {
            return "日時を選択";
        }

        return match[1] + "/" + match[2] + "/" + match[3] + " " + match[4] + ":" + match[5];
    }

    function syncStartDisplay() {
        var hasValue = Boolean(startInput.value);
        startDisplay.textContent = formatDateTimeInputDisplay(startInput.value);
        startDisplay.classList.toggle("is-empty", !hasValue);
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
        if (key === "morningTen") {
            return "band-morning";
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
                        "<span class=\"band-badge " + getBandClass(segment.band.key) + "\">" + segment.band.description + "・1マス " + segment.band.shortLabel + "</span>" +
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
        document.getElementById("entry-morning-ten").innerHTML = formatEntry(
            result.firstEntry.morningTen,
            "今回の計算では6:00〜7:00に入りません"
        );

        document.getElementById("timeline-list").innerHTML = renderSegments(result.segments);

        setText("normal-count", result.tileCountsByBand.normal.toLocaleString("ja-JP") + "マス");
        setText("midnight-count", result.tileCountsByBand.midnight.toLocaleString("ja-JP") + "マス");
        setText("early-count", result.tileCountsByBand.earlyMorning.toLocaleString("ja-JP") + "マス");
        setText("morning-ten-count", result.tileCountsByBand.morningTen.toLocaleString("ja-JP") + "マス");
        setText("normal-total", formatDuration(result.secondsByBand.normal));
        setText("midnight-total", formatDuration(result.secondsByBand.midnight));
        setText("early-total", formatDuration(result.secondsByBand.earlyMorning));
        setText("morning-ten-total", formatDuration(result.secondsByBand.morningTen));

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
        syncStartDisplay();
    }

    function setCoordinateMessage(text, isError) {
        coordinateMessage.textContent = text;
        coordinateMessage.classList.toggle("is-error", Boolean(isError));
    }

    function formatCoordinate(point) {
        return point.x.toLocaleString("ja-JP", { useGrouping: false }) + "," +
            point.y.toLocaleString("ja-JP", { useGrouping: false });
    }

    function saveRoutePoints() {
        try {
            if (routePoints.length > 0) {
                window.localStorage.setItem("occupationRoutePoints", JSON.stringify(routePoints));
            } else {
                window.localStorage.removeItem("occupationRoutePoints");
            }
        } catch (storageError) {
            // 保存できない環境でも座標計算自体は継続します。
        }
    }

    function createCoordinateItem(point, index, route) {
        var item = document.createElement("li");
        item.className = "coordinate-item";

        var main = document.createElement("div");
        main.className = "coordinate-item-main";

        var number = document.createElement("span");
        number.className = "coordinate-number";
        number.textContent = String(index + 1);

        var details = document.createElement("div");
        details.className = "coordinate-details";

        var value = document.createElement("strong");
        value.className = "coordinate-value";
        value.textContent = formatCoordinate(point);
        details.appendChild(value);

        var role = document.createElement("span");
        role.className = "coordinate-role";
        if (index === 0) {
            role.textContent = "スタート";
        } else if (index === route.points.length - 1) {
            role.textContent = "現在の終点";
        } else {
            role.textContent = "経由";
        }
        details.appendChild(role);

        var remove = document.createElement("button");
        remove.type = "button";
        remove.className = "coordinate-remove";
        remove.textContent = "削除";
        remove.setAttribute("aria-label", formatCoordinate(point) + " を削除");
        remove.addEventListener("click", function () {
            routePoints.splice(index, 1);
            renderCoordinateRoute(true);
            if (routePoints.length === 0) {
                setCoordinateMessage("最初の座標がスタート地点になります。", false);
            } else if (routePoints.length === 1) {
                setCoordinateMessage("もう1地点追加するとマス数を自動計算します。", false);
            }
        });

        main.appendChild(number);
        main.appendChild(details);
        main.appendChild(remove);
        item.appendChild(main);

        if (index > 0) {
            var segment = route.segments[index - 1];
            var segmentText = document.createElement("div");
            segmentText.className = "coordinate-segment";
            segmentText.textContent = "前地点から +" + segment.tiles.toLocaleString("ja-JP") +
                "マス（ΔX " + segment.dx.toLocaleString("ja-JP") +
                " / ΔY " + segment.dy.toLocaleString("ja-JP") + "）";
            item.appendChild(segmentText);
        }

        return item;
    }

    function renderCoordinateRoute(applyToTileCount) {
        var route = calculator.calculateRoute(routePoints);
        coordinateList.replaceChildren();

        route.points.forEach(function (point, index) {
            coordinateList.appendChild(createCoordinateItem(point, index, route));
        });

        clearCoordinatesButton.disabled = route.points.length === 0;
        coordinateSummary.hidden = route.points.length < 2;

        if (route.points.length >= 2) {
            coordinateTotal.textContent = route.totalTiles.toLocaleString("ja-JP");

            if (applyToTileCount) {
                if (route.totalTiles < 1) {
                    setCoordinateMessage("経路の距離が0マスです。異なる座標を追加してください。", true);
                } else if (route.totalTiles > calculator.MAX_TILES) {
                    setCoordinateMessage("推定マス数が上限を超えています。座標を確認してください。", true);
                } else {
                    tileInput.value = String(route.totalTiles);
                    calculate();
                    setCoordinateMessage(
                        route.points.length.toLocaleString("ja-JP") + "地点を登録。推定" +
                        route.totalTiles.toLocaleString("ja-JP") + "マスを自動反映しました。",
                        false
                    );
                }
            }
        } else {
            coordinateTotal.textContent = "0";
        }

        saveRoutePoints();
        return route;
    }

    function hasAmbiguousJoinedCoordinates(source) {
        var commaIndexes = [];
        var index;

        for (index = 0; index < source.length; index += 1) {
            if (source[index] === "," || source[index] === "，") {
                commaIndexes.push(index);
            }
        }

        for (index = 0; index < commaIndexes.length - 1; index += 1) {
            var betweenCommas = source.slice(commaIndexes[index] + 1, commaIndexes[index + 1]);
            if (/^\s*-?\d+\s*$/.test(betweenCommas)) {
                return true;
            }
        }

        return false;
    }

    function addCoordinatesFromText(text) {
        var source = String(text || "").trim();
        if (!source) {
            setCoordinateMessage("座標を入力または貼り付けてください。", true);
            coordinateInput.focus();
            return;
        }

        if (hasAmbiguousJoinedCoordinates(source)) {
            setCoordinateMessage("座標同士の区切りを判別できませんでした。1地点ずつ貼り付けてください。", true);
            coordinateInput.value = "";
            coordinateInput.focus();
            return;
        }

        var parsed = calculator.parseCoordinateText(source);
        var commaCount = (source.match(/[,，]/g) || []).length;

        if (parsed.length === 0) {
            setCoordinateMessage("座標を認識できません。例: 642,1671", true);
            coordinateInput.focus();
            return;
        }

        if (commaCount > parsed.length) {
            setCoordinateMessage("座標同士の区切りを判別できませんでした。1地点ずつ貼り付けてください。", true);
            coordinateInput.value = "";
            coordinateInput.focus();
            return;
        }

        var added = 0;
        parsed.forEach(function (point) {
            var last = routePoints[routePoints.length - 1];
            if (last && last.x === point.x && last.y === point.y) {
                return;
            }
            routePoints.push(point);
            added += 1;
        });

        coordinateInput.value = "";
        coordinateInput.focus();

        if (added === 0) {
            setCoordinateMessage("直前と同じ座標のため追加しませんでした。", true);
            return;
        }

        renderCoordinateRoute(true);
        if (routePoints.length === 1) {
            setCoordinateMessage("スタート地点を登録しました。次の座標を貼り付けてください。", false);
        }
    }

    function clearCoordinates() {
        routePoints = [];
        renderCoordinateRoute(false);
        coordinateInput.value = "";
        setCoordinateMessage("座標をクリアしました。マス数の手動入力値はそのままです。", false);
        coordinateInput.focus();
    }

    function buildCopyText() {
        var result = calculator.calculateOccupation(parseLocalDateTime(startInput.value), Number(tileInput.value));
        var midnightText = result.firstEntry.midnight
            ? result.firstEntry.midnight.tile.toLocaleString("ja-JP") + "マス目（" + compactFormatter.format(result.firstEntry.midnight.time) + "）"
            : "該当なし";
        var earlyText = result.firstEntry.earlyMorning
            ? result.firstEntry.earlyMorning.tile.toLocaleString("ja-JP") + "マス目（" + compactFormatter.format(result.firstEntry.earlyMorning.time) + "）"
            : "該当なし";
        var morningTenText = result.firstEntry.morningTen
            ? result.firstEntry.morningTen.tile.toLocaleString("ja-JP") + "マス目（" + compactFormatter.format(result.firstEntry.morningTen.time) + "）"
            : "該当なし";

        return [
            "占領時間計算結果",
            "開始: " + dateTimeFormatter.format(result.startTime),
            "マス数: " + result.tileCount.toLocaleString("ja-JP") + "マス",
            "終了予想: " + dateTimeFormatter.format(result.endTime),
            "所要時間: " + formatDuration(result.totalSeconds),
            "10分帯（0:00〜2:00）に入るマス: " + midnightText,
            "30分帯（2:00〜6:00）に入るマス: " + earlyText,
            "10分帯（6:00〜7:00）に入るマス: " + morningTenText
        ].join("\n");
    }

    function copyResult() {
        var text;

        try {
            text = buildCopyText();
        } catch (error) {
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                var original = copyButton.textContent;
                copyButton.textContent = "コピーしました";
                window.setTimeout(function () {
                    copyButton.textContent = original;
                }, 1600);
            }).catch(copyWithTextarea);
            return;
        }

        copyWithTextarea();

        function copyWithTextarea() {
            var textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "readonly");
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
        }
    }

    startInput.addEventListener("input", syncStartDisplay);
    startInput.addEventListener("change", function () {
        syncStartDisplay();
        calculate();
    });

    form.addEventListener("submit", calculate);
    nowButton.addEventListener("click", setNow);
    copyButton.addEventListener("click", copyResult);
    addCoordinateButton.addEventListener("click", function () {
        addCoordinatesFromText(coordinateInput.value);
    });
    clearCoordinatesButton.addEventListener("click", clearCoordinates);

    coordinateInput.addEventListener("paste", function (event) {
        var clipboard = event.clipboardData || window.clipboardData;
        if (!clipboard) {
            return;
        }

        event.preventDefault();
        addCoordinatesFromText(clipboard.getData("text"));
    });

    coordinateInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            addCoordinatesFromText(coordinateInput.value);
        }
    });

    var savedStart = null;
    var savedTiles = null;
    var savedRoute = null;

    try {
        savedStart = window.localStorage.getItem("occupationStart");
        savedTiles = window.localStorage.getItem("occupationTiles");
        savedRoute = window.localStorage.getItem("occupationRoutePoints");
    } catch (storageError) {
        // 保存領域を利用できない環境では既定値を使います。
    }

    if (savedStart) {
        startInput.value = savedStart;
        syncStartDisplay();
    } else {
        setNow();
    }

    if (savedTiles) {
        tileInput.value = savedTiles;
    }

    if (savedRoute) {
        try {
            var parsedRoute = JSON.parse(savedRoute);
            if (Array.isArray(parsedRoute)) {
                routePoints = calculator.calculateRoute(parsedRoute).points;
            }
        } catch (routeError) {
            routePoints = [];
        }
    }

    renderCoordinateRoute(false);
    calculate();
}());
