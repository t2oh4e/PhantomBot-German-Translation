/*
 * Copyright (C) 2016 phantombot.tv
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

/* 
 * @author IllusionaryOne
 */

/*
 * ranksPanel.js
 * Drives the Ranks Panel
 */
(function() {

    /*
     * onMessage
     * This event is generated by the connection (WebSocket) object.
     */
    function onMessage(message) {
        var msgObject;

        try {
            msgObject = JSON.parse(message.data);
        } catch (ex) {
            return;
        }

        if (panelHasQuery(msgObject)) {
            var customHours = "",
                customCost = "",
                ranksData = [],
                user = "",
                hours = "",
                rank = "",
                html = "";

            if (panelCheckQuery(msgObject, 'ranks_time')) {
                customHours = msgObject['results']['rankEligableTime'];
                $("#customRankTimeInput").attr("placeholder", customHours);
                $("#customRankTimeInput").val('');
            }
            if (panelCheckQuery(msgObject, 'ranks_cost')) {
                customCost = msgObject['results']['rankEligableCost'];
                $("#customRankCostInput").attr("placeholder", customCost);
                $("#customRankCostInput").val('');
            }

            if (panelCheckQuery(msgObject, 'ranks_ranksmapping')) {
                html = "<br><table><th>&nbsp;&nbsp;&nbsp; Stunden &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Rangname</th></tr>";
                ranksData = msgObject['results'];
                ranksData.sort(sortRanks);
                for (idx = 0; idx < ranksData.length; idx++) {
                    hours = ranksData[idx]['key'];
                    rank = ranksData[idx]['value'];
                    html += "<tr class=\"textList\">" +
                            "    <td><form onkeypress=\"return event.keyCode != 13\">" +
                            "        <input type=\"text\" id=\"inlineRankHoursEdit_" + hours + "\"" +
                            "               value=\"" + hours + "\" style=\"width: 10%\"/>" +
                            "        <input type=\"text\" id=\"inlineRankNameEdit_" + hours + "\"" +
                            "               value=\"" + rank + "\" style=\"width: 50%\"/>" +
                            "        <button type=\"button\" class=\"btn btn-default btn-xs\"" + 
                            "                onclick=\"$.updateRank('" + hours + "')\"><i class=\"fa fa-pencil\" />" +
                            "        <button type=\"button\" class=\"btn btn-default btn-xs\" id=\"deleteRank_" + hours + "\"" + 
                            "                onclick=\"$.deleteRank('" + hours + "')\"><i class=\"fa fa-trash\" />" +
                            "        </button>" +
                            "    </form></td>" +
                            "</tr>";
                }
                html += "</table>";
                if (ranksData.length === 0) {
                    html = "<i>Es gibt derzeit keine definierten Ränge.</i>";
                }
                $("#ranksMapping").html(html);
                handleInputFocus();
            }

            if (panelCheckQuery(msgObject, 'ranks_customranks')) {
                html = "<br><table><tr><th /><th>Benutzername</th><th>Rangname</th></tr>";
                ranksData = msgObject['results'];
                ranksData.sort();
                for (idx = 0; idx < ranksData.length; idx++) {
                    user = ranksData[idx]['key'];
                    rank = ranksData[idx]['value'];

                    html += "<tr class=\"textList\">" +
                            "    <td style=\"width: 15px\">" +
                            "        <div id=\"deleteCustomRankIcon_" + user + "\" class=\"button\"" +
                            "             onclick=\"$.deleteCustomRank('" + user + "')\"><i class=\"fa fa-trash\" />" +
                            "        </div>" + 
                            "    </td>" +
                            "    <td style=\"width: 8em\">" + user + "</td>" +
                            "    <td><form onkeypress=\"return event.keyCode != 13\">" +
                            "        <input type=\"text\" id=\"inlineRankCustomEdit_" + user + "\"" +
                            "               value=\"" + rank + "\" style=\"width: 80%\" />" +
                            "        <button type=\"button\" class=\"btn btn-default btn-xs\"" + 
                            "                onclick=\"$.updateCustomRank('" + user + "')\"><i class=\"fa fa-pencil\" />" +
                            "        </button>" +
                            "    </form></td>" +
                            "</tr>";
                }
                html += "</table>";
                if (ranksData.length === 0) {
                    html = "<i>Es gibt keine Nutzer mit benutzerdefinierten Rängen.</i>";
                }
                $("#ranksCustom").html(html);
                handleInputFocus();
            }
        }
    }

    /**
     * @function doQuery
     */
    function doQuery() {
        sendDBKeys("ranks_ranksmapping", "ranksMapping");
        sendDBKeys("ranks_customranks", "viewerRanks");
        sendDBQuery("ranks_time", "settings", "rankEligableTime");
        sendDBQuery("ranks_cost", "settings", "rankEligableCost");
    }

    /**
     * @function sortRanks
     */
    function sortRanks(a, b) {
        var valA = a['key'],
            valB = b['key'];
        return parseInt(valA) - parseInt(valB);
    }

    /**
     * @function updateCustomRankTime
     */
    function updateCustomRankTime() {
        var time = $("#customRankTimeInput").val();

        if (time.length > 0) {
            $("#customRankTimeInput").val(time);
            sendDBUpdate('rank_time', 'settings', 'rankEligableTime', time);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function updateCustomRankCost
     */
    function updateCustomRankCost() {
        var cost = $("#customRankCostInput").val();

        if (cost.length > 0) {
            $("#customRankCostInput").val(cost);
            sendDBUpdate('rank_time', 'settings', 'rankEligableCost', cost);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function addCustomRank
     */
    function addCustomRank() {
        var user = $("#addCustomRankUserInput").val(),
            rank = $("#addCustomRankNameInput").val();

        if (user.length > 0 && rank.length > 0) {
            $("#addCustomRankUserInput").val('');
            $("#addCustomRankNameInput").val('');
            sendDBUpdate("ranks_customAdd", "viewerRanks", user, rank);
            setTimeout(function() { doQuery(); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function updateCustomRank
     * @param {String} rankKey
     */
    function updateCustomRank(rankKey) {
        var rankName = $("#inlineRankCustomEdit_" + rankKey).val();
        sendDBUpdate("ranks_customUpdate", "viewerRanks", rankKey, rankName);
        $("#inlineRankCustomEdit_" + rankKey).val(rankName);
    }

    /**
     * @function deleteCustomRank
     * @param {String} rankKey
     */
    function deleteCustomRank(rankKey) {
        $("#deleteCustomRankIcon_" + rankKey).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("ranks_customDelete", "viewerRanks", rankKey);
        setTimeout(function() { doQuery() }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function addRank
     */
    function addRank() {
        var hours = $("#addRankHoursInput").val(),
            rank = $("#addRankNameInput").val();

        if (hours.length > 0 && rank.length > 0) {
            $("#addRankHoursInput").val('');
            $("#addRankNameInput").val('');
            sendDBUpdate("ranks_ranksAdd", "ranksMapping", hours, rank);
            setTimeout(function() { doQuery(); sendCommand('rankreloadtable'); }, TIMEOUT_WAIT_TIME);
        }
    }

    /**
     * @function updateRank
     * @param {String} rankKey
     */
    function updateRank(rankKey) {
        var rankName = $("#inlineRankNameEdit_" + rankKey).val();
        var rankHours = $("#inlineRankHoursEdit_" + rankKey).val();
        sendDBDelete("ranks_ranksUpdate", "ranksMapping", rankKey);
        sendDBUpdate("ranks_ranksUpdate", "ranksMapping", rankHours, rankName);
        $("#inlineRankNameEdit_" + rankKey).val(rankName);
        $("#inlineRankHoursEdit_" + rankKey).val(rankHours);
        setTimeout(function() { doQuery(); sendCommand('rankreloadtable'); }, TIMEOUT_WAIT_TIME);
    }

    /**
     * @function deleteRank
     * @param {String} rankKey
     */
    function deleteRank(rankKey) {
        $("#deleteRank_" + rankKey).html("<i style=\"color: #6136b1\" class=\"fa fa-spinner fa-spin\" />");
        sendDBDelete("ranks_ranksDelete", "ranksMapping", rankKey);
        setTimeout(function() { doQuery(); sendCommand('rankreloadtable'); }, TIMEOUT_WAIT_TIME);
    }

    // Import the HTML file for this panel.
    $("#ranksPanel").load("/panel/ranks.html");

    // Load the DB items for this panel, wait to ensure that we are connected.
    var interval = setInterval(function() {
        if (isConnected && TABS_INITIALIZED) {
            var active = $("#tabs").tabs("option", "active");
            if (active == 6) {
                doQuery();
                clearInterval(interval);
            }
        }
    }, INITIAL_WAIT_TIME);

    // Query the DB every 30 seconds for updates.
    setInterval(function() {
        var active = $("#tabs").tabs("option", "active");
        if (active == 6 && isConnected && !isInputFocus()) {
            newPanelAlert('Aktualisiere Ränge-Daten...', 'success', 1000);
            doQuery();
        }
    }, 3e4);

    // Export functions - Needed when calling from HTML.
    $.ranksOnMessage = onMessage;
    $.ranksDoQuery = doQuery;
    $.updateCustomRank = updateCustomRank;
    $.deleteCustomRank = deleteCustomRank;
    $.addCustomRank = addCustomRank;
    $.updateRank = updateRank;
    $.deleteRank = deleteRank;
    $.addRank = addRank;
    $.updateCustomRankTime = updateCustomRankTime;
    $.updateCustomRankCost = updateCustomRankCost;
})();
