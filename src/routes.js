/* jslint todo: true, node: true, stupid: true, plusplus: true, continue: true, unparam: true */
"use strict";
var routes = {},
    util = require("util"),
    texts = require("./texts"),
    utils = require("./utils");

routes.root = function (req, res, db) {
    db.Pod.projectStats("diaspora", function (diasporaStats) {
        db.Pod.projectStats("friendica", function (friendicaStats) {
            db.Pod.projectStats("hubzilla", function (hubzillaStats) {
                db.Pod.projectStats("ganggo", function (ganggoStats) {
                    db.Pod.projectStats("socialhome", function (socialhomeStats) {
                        db.Pod.globalCharts(function(chartData) {
                            res.render("index.njk", {
                                stats: {
                                    diaspora: diasporaStats[0],
                                    friendica: friendicaStats[0],
                                    hubzilla: hubzillaStats[0],
                                    ganggo: ganggoStats[0],
                                    socialhome: socialhomeStats[0],
                                },
                                texts: texts.networks,
                                globalData: chartData[chartData.length - 1],
                                chartData: chartData,
                            });
                        }, function(err) {
                            console.log(err);
                        });
                    });
                });
            });
        });
    });
};

routes.nodesList = function (req, res, db) {
    db.Pod.allForList("", function (nodesList) {
        res.render("nodes-list.njk", {nodesData: nodesList});
    }, function (err) {
        console.log(err);
    });
};

routes.info = function (req, res, db) {
    res.render("about.njk");
};

routes.renderNetwork = function (network, res, db) {
    db.Pod.projectCharts(network, function (chartData) {
        db.Pod.allForList(network, function (nodesList) {
            res.render("network-page.njk", {
                texts: texts.networks[network],
                globalData: chartData[chartData.length - 1],
                chartData: chartData,
                nodesData: nodesList
            });
        }, function (err) {
            console.log(err);
        });
    }, function (err) {
        console.log(err);
    });
};

routes.renderNode = function (req, res, db) {
    var nodeHost = req.params.host;
    db.Pod.nodeInfo(nodeHost, function (nodeInfo) {
        if (!nodeInfo.length) {
            res.send(404);
            return
        }
        db.Pod.nodeCharts(nodeHost, function (chartData) {
            res.render("node.njk", {
                node: utils.formatNodeInfo(nodeInfo[0]),
                globalData: chartData[chartData.length - 1],
                chartData: chartData
            });
        });
    });
};

/* API routes */
routes.pods = function (req, res, db) {
    db.Pod.allForList("",
        function (pods) {
            res.json({pods: pods});
        },
        function (err, result) {
            if (err) {
                console.log(err);
            }
        }
    );
};

routes.item = function (req, res, db) {
    if (["total_users", "active_users_halfyear", "active_users_monthly", "local_posts", "local_comments"].indexOf(req.params.item) > -1) {
        db.Pod.allPodStats(req.params.item, function (stats) {
            var json = [],
                podids = {},
                i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    if (stats[i].item) {
                        if (podids[stats[i].pod_id] === undefined) {
                            json.push({
                                name: (stats[i].name.toLowerCase() === "diaspora*") ? stats[i].host : stats[i].name,
                                data: [],
                                // following tip from http://stackoverflow.com/a/1152508/1489738
                                color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)
                            });
                            podids[stats[i].pod_id] = json.length - 1;
                        }
                        json[podids[stats[i].pod_id]].data.push({x: stats[i].timestamp, y: stats[i].item});
                    }
                }
            }
            res.json(json);
        }, function (err, result) {
            if (err) {
                console.log(err);
            }
        });
    } else if (req.params.item === "global") {
        db.GlobalStat.getStats(function (stats) {
            var json = [
                    {
                        name: "Active users 1 month",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "stack"
                    },
                    {
                        name: "Active users 6 months",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "stack"
                    },
                    {
                        name: "Total users",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "stack"
                    },
                    {
                        name: "Total posts",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    },
                    {
                        name: "Total comments",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    },
                    {
                        name: "Active pods",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    }
                ], i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    json[0].data.push({x: stats[i].timestamp, y: stats[i].active_users_monthly || 0});
                    json[1].data.push({x: stats[i].timestamp, y: stats[i].active_users_halfyear || 0});
                    json[2].data.push({x: stats[i].timestamp, y: stats[i].total_users || 0});
                    json[3].data.push({x: stats[i].timestamp, y: stats[i].local_posts || 0});
                    json[4].data.push({x: stats[i].timestamp, y: stats[i].local_comments || 0});
                    json[5].data.push({x: stats[i].timestamp, y: stats[i].pod_count || 0});
                }
            }
            res.json(json);
        });
    } else if (req.params.item === "global_users") {
        db.GlobalStat.getStats(function (stats) {
            var json = [
                    {
                        name: "Total users",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    }
                ], i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    json[0].data.push({x: stats[i].timestamp, y: stats[i].total_users || 0});
                }
            }
            res.json(json);
        });
    } else if (req.params.item === "global_posts") {
        db.GlobalStat.getStats(function (stats) {
            var json = [
                    {
                        name: "Total posts",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    }
                ], i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    json[0].data.push({x: stats[i].timestamp, y: stats[i].local_posts || 0});
                }
            }
            res.json(json);
        });
    } else if (req.params.item === "global_comments") {
        db.GlobalStat.getStats(function (stats) {
            var json = [
                    {
                        name: "Total comments",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    }
                ], i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    json[0].data.push({x: stats[i].timestamp, y: stats[i].local_comments || 0});
                }
            }
            res.json(json);
        });
    } else if (req.params.item === "global_active_month") {
        db.GlobalStat.getStats(function (stats) {
            var json = [
                    {
                        name: "Active users 1 month",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    }
                ], i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    json[0].data.push({x: stats[i].timestamp, y: stats[i].active_users_monthly || 0});
                }
            }
            res.json(json);
        });
    } else if (req.params.item === "global_active_halfyear") {
        db.GlobalStat.getStats(function (stats) {
            var json = [
                    {
                        name: "Active users 6 months",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    }
                ], i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    json[0].data.push({x: stats[i].timestamp, y: stats[i].active_users_halfyear || 0});
                }
            }
            res.json(json);
        });
    } else if (req.params.item === "global_pod_count") {
        db.GlobalStat.getStats(function (stats) {
            var json = [
                    {
                        name: "Active pods",
                        data: [],
                        color: "#" + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
                        renderer: "line"
                    }
                ], i = 0;
            if (stats) {
                for (i = 0; i < stats.length; i++) {
                    json[0].data.push({x: stats[i].timestamp, y: stats[i].pod_count || 0});
                }
            }
            res.json(json);
        });
    } else {
        res.json("[]");
    }
};

routes.register = function (req, res, db) {
    req.assert("podhost", "Invalid pod url").isUrl().len(1, 100);
    var errors = req.validationErrors();
    if (errors) {
        res.send("There have been validation errors: " + util.inspect(errors), 400);
        return false;
    }
    res.type("text/html");
    res.send('<html><head></head><body><h1>register received</h1><p>if this is a valid pod with suitable code, it will be visible at <a href="https://the-federation.info">the-federation.info</a> in a few seconds..</p></body></html>');
    return req.params.podhost;
};

module.exports = routes;
