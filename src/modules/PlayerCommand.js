﻿var Entity = require('../entity');
var Logger = require('./Logger');
var UserRoleEnum = require("../enum/UserRoleEnum");


function PlayerCommand(gameServer, playerTracker) {
    this.gameServer = gameServer;
    this.playerTracker = playerTracker;
}

module.exports = PlayerCommand;

PlayerCommand.prototype.writeLine = function (text) {
    this.gameServer.sendChatMessage(null, this.playerTracker, text);
};

PlayerCommand.prototype.executeCommandLine = function (commandLine) {
    if (!commandLine) return;
    var command = commandLine;
    var args = "";
    var index = commandLine.indexOf(' ');
    if (index >= 0) {
        command = commandLine.slice(0, index);
        args = commandLine.slice(index + 1, commandLine.length);
    }
    command = command.trim().toLowerCase();
    var execute = playerCommands[command];
    if (typeof execute == 'function') {
        execute.bind(this)(args);
    } else {
        this.writeLine("Unknown command, type /help for command list");
    }
};

var playerCommands = {
    help: function (args) {
        this.writeLine("/skin %shark - change skin");
        this.writeLine("/kill - self kill");
        this.writeLine("/help - this command list");
    },
    skin: function (args) {
        if (this.playerTracker.cells.length > 0) {
            this.writeLine("Cannot change skin while player in game!");
            return;
        }
        var skinName = "";
        if (args) skinName = args.trim();
        if (skinName.length > 16)
            skinName = skinName.slice(0, 16);
        this.playerTracker.setSkin(skinName);
        if (skinName == "")
            this.writeLine("Your skin was removed");
        else
            this.writeLine("Your skin set to " + skinName);
    },
    kill: function (args) {
        if (this.playerTracker.cells.length < 1) {
            this.writeLine("You cannot kill yourself, because you're still not joined to the game!");
            return;
        }
        while (this.playerTracker.cells.length > 0) {
            var cell = this.playerTracker.cells[0];
            this.gameServer.removeNode(cell);
            // replace with food
            var food = new Entity.Food(this.gameServer, null, cell.position, this.gameServer.config.playerMinSize);
            food.setColor(this.gameServer.getGrayColor(cell.getColor()));
            this.gameServer.addNode(food);
        }
        this.writeLine("You killed yourself");
    },
    login: function (args) {
        var password = (args || "").trim();
        if (password.length < 1) {
            this.writeLine("ERROR: missing password argument!");
            return;
        }
        var user = this.gameServer.userLogin(this.playerTracker.socket.remoteAddress, password);
        if (!user) {
            this.writeLine("ERROR: login failed!");
            return;
        }
        Logger.write("LOGIN        " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " as \"" + user.name + "\"");
        this.playerTracker.userRole = user.role;
        this.playerTracker.userAuth = user.name;
        this.writeLine("Login done as \"" + user.name + "\"");
        return;
    },
    logout: function (args) {
        if (this.playerTracker.userRole == UserRoleEnum.GUEST) {
            this.writeLine("ERROR: not logged in");
            return;
        }
        Logger.write("LOGOUT       " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " as \"" + this.playerTracker.userAuth + "\"");
        this.playerTracker.userRole = UserRoleEnum.GUEST;
        this.playerTracker.userAuth = null;
        this.writeLine("Logout done");
    }
};


