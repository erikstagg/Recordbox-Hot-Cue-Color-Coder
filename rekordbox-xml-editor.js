const fs = require('fs');
const path = require('path');
require('dotenv').config();

var rootDirectory = path.normalize(process.env.ROOTDIRECTORY);
var backupFolder = path.join(rootDirectory, "backup"); // Leave to create backup folder in root directory
var logFolder = path.join(rootDirectory, "logs"); // Leave to create log folder in root directory
var rekordboxFileName = process.env.REKORDBOX_XML_FILENAME; // no file extension
var now = new Date();
var backupID = now.getMonth() + "-" + now.getDate() + "-" + now.getFullYear() + "--" + now.getHours() + "-" + now.getMinutes() + "-" + now.getSeconds() + "-" + now.getMilliseconds();


// ----------- Start Config ----------------- //
// define search terms and the color to match to it
var hotCueColorCodes = [
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "break", // light blue
        color: colorLibrary.aqua
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "build", // dark yellow
        color: colorLibrary.yellow
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "drop", // orange
        color: colorLibrary.orange
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "outro", // blue
        color: colorLibrary.white
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "vox", // light purple
        color: colorLibrary.purple
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "vocal", // light purple
        color: colorLibrary.purple
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "verse", // light purple
        color: colorLibrary.purple
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "chorus", // pink
        color: colorLibrary.pink
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "tempo change", // red
        color: colorLibrary.red
    },
    {
        tag: "POSITION_MARK",
        attribute: "Name",
        termToMatch: "warning", // red
        color: colorLibrary.darkRed
    },
];

// define colors to not overwrite
var colorCodeIgnore = [  
    colorLibrary.red,
    colorLibrary.defaultGreen
]

// ----------- End Config ----------------- //



var originalXML;
var newLineEscapedXML;
var colorCodedXML;

createDirectories();
backupXMLFile();

// Main Program Flow
originalXML = fs.readFileSync(path.join(rootDirectory, rekordboxFileName + '.xml'), "utf-8");
newLineEscapedXML = replaceNewLines(originalXML);
colorCodedXML = colorCodeHotCues(newLineEscapedXML, hotCueColorCodes);
writeFinalXml(colorCodedXML);

function createDirectories() {
    if (!fs.existsSync(backupFolder)){
        fs.mkdirSync(backupFolder);
        console.log("Backup directory created: " + backupFolder);
    } else {
        console.log("Backup directory found: " + backupFolder);
    }
    if (!fs.existsSync(logFolder)){
        fs.mkdirSync(logFolder);
        console.log("Log directory created: " + logFolder)
    } else {
        console.log("Log directory found: " + logFolder)
    }
}

// backup file creation
function backupXMLFile() {
    
    fs.copyFileSync(path.join(rootDirectory, rekordboxFileName + '.xml'), path.join(backupFolder, rekordboxFileName + '-backup-' + backupID + '.xml'), (err) => {
      if (err) throw err;
      console.log('source was copied to destination');
    });
}

function replaceNewLines(xml) {
    var replaceNewLines = /"\s*\n\s*(.*)>/g;
    var thisXML = xml;
    var newLineFound = replaceNewLines.test(thisXML);
    if (newLineFound) {
        thisXML = thisXML.replace(replaceNewLines, "\" $1>");
        console.log("Newline(s) found and fixed.");
    } else {
        fs.writeFileSync(path.join(logFolder, "newLineNotFound" + "-" + backupID + ".xml"), thisXML, (err) => {
            if (err) console.log(err);
            console.log("newLineNotFound" + "-" + backupID + ".xml written");
        });
        console.log("No new lines found. replaceNewLines skipped.")
    }
    return thisXML;
}

function colorCodeHotCues(xml, hotCueColorCodes) {
    var thisXML = xml;
    hotCueColorCodes.forEach(function (item) {
        var mainRegex = new RegExp('(<' + item.tag + '.*' + item.attribute + '="[^"]*' + item.termToMatch + '[^"]*".*Red=")([^"]*)(".*Green=")([^"]*)(".*Blue=")([^"]*)(".*\\/>)', "gi");
        //console.log(mainRegex.toString());
        var mainRegexMatchFound = mainRegex.test(thisXML);
        if (mainRegexMatchFound) {
            thisXML = thisXML.replace(mainRegex,replacer);
            console.log("mainRegex replaced for termToMatch: " + item.termToMatch);
        } else {
            fs.writeFileSync(path.join(logFolder, "nomatch-mainRegex-" + item.termToMatch + "-" + backupID + ".xml"), thisXML, (err) => {
                if (err) console.log(err);
                console.log("test file written");
            });
            console.log("mainRegex not found. nomatch-mainRex-" + item.termToMatch + "-" + backupID + ".xml written");
        }
        var matchHasBeenExcluded = false;
        function replacer(match, p1, p2, p3, p4, p5, p6, p7, offset, string) {
            var excludeMatch = false;
            colorCodeIgnore.forEach(function (colorToIgnore) {
                if (p2 == colorToIgnore.red && p4 == colorToIgnore.green && p6 == colorToIgnore.blue) {
                    excludeMatch = true;
                    if (!matchHasBeenExcluded) {
                        console.log("match excluded during search: " + item.termToMatch);
                        matchHasBeenExcluded = true;
                    }
                }
            });
            return excludeMatch ? match : p1 + item.color.red + p3 + item.color.green + p5 + item.color.blue + p7;
        }
    });
    
    return thisXML;
}

function writeFinalXml(xml) {
    // write xml to xml file
    var thisXML = xml;
    var writingFileError = false;
    fs.writeFileSync(path.join(rootDirectory, rekordboxFileName + '.xml'), thisXML, (err) => {
        if (err) {
            writingFileError = true;
            console.log(err);
        }
    });
    if (!writingFileError) {console.log("Processed file written: " + path.join(rootDirectory, rekordboxFileName + ".xml"));}
}

var colorLibrary = {
    darkRed: {
        red: "117", green: "40", blue: "0"
    },
    red: {
        red: "255", green: "0", blue: "0"
    },
    pink: {
        red: "255", green: "0", blue: "230"
    },
    orange: {
        red: "255", green: "153", blue: "0"
    },
    yellow: {
        red: "255", green: "228", blue: "0"
    },
    darkYellow: {
        red: "195", green: "175", blue: "0"
    },
    purple: {
        red: "162", green: "0", blue: "255"
    },
    darkPurple: {
        red: "89", green: "0", blue: "140"
    },
    aqua: {
        red: "59", green: "231", blue: "255"
    },
    lightBlue: {
        red: "80", green: "180", blue: "255"
    },
    blue: {
        red: "0", green: "0", blue: "255"
    },
    navyBlue: {
        red: "0", green: "0", blue: "105"
    },
    blueGreen: {
        red: "0", green: "255", blue: "222"
    },
    defaultGreen: {  //default marker green color
        red: "40", green: "226", blue: "20"
    },
    darkGreen: {
        red: "0", green: "102", blue: "0"
    },
    white: {
        red: "255", green: "255", blue: "255"
    },
    gray: {
        red: "128", green: "128", blue: "128"
    },
    black: {
        red: "0", green: "0", blue: "0"
    }
}