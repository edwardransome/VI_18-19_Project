const fs = require('fs');

// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray( strData, strDelimiter ) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ),
        "gi"
    );


    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;


    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
        ) {

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }

        var strMatchedValue;

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
            );

        } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[3];

        }


        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}


function parse(filePath) {
    // Need : site_name,site_id,cammlr_region,longitude_epsg_4326,latitude_epsg_4326,common_name,day,season_starting,penguin_count,count_type
    //
    // Available :
    // 0  site_name
    // 1  site_id
    // 2  cammlr_region
    // 3  longitude_epsg_4326
    // 4  latitude_epsg_4326
    // 5  common_name
    // 6  day
    // 7  month
    // 8  year
    // 9  season_starting
    // 10 penguin_count
    // 11 accuracy
    // 12 count_type
    // 13 vantage
    // 14 reference

    let str = fs.readFileSync(filePath, 'utf8');

    let csv = CSVToArray(str, ",");

    let dictionary = {};

    for(let i= 1; i < csv.length-1; i++) {

        // we start from i=1 to skip the header
        let line = csv[i];

        // insert year
        if (!dictionary[line[9]]) {
            dictionary[line[9]] = {};
        }

        // insert common name
        if (!dictionary[line[9]][line[5]]) {
            dictionary[line[9]][line[5]] = {};
        }

        // insert location
        if(!dictionary[line[9]][line[5]][line[1]]) {
            dictionary[line[9]][line[5]][line[1]] = {};
            dictionary[line[9]][line[5]][line[1]]["site_name"] = line[0];
            dictionary[line[9]][line[5]][line[1]]["cammlr_region"] = Number(line[2]);
            dictionary[line[9]][line[5]][line[1]]["longitude"] = Number(line[3]);
            dictionary[line[9]][line[5]][line[1]]["latitude"] = Number(line[4]);
            dictionary[line[9]][line[5]][line[1]]["nests"] = Number(0);
            dictionary[line[9]][line[5]][line[1]]["adults"] = Number(0);
            dictionary[line[9]][line[5]][line[1]]["chicks"] = Number(0);
        }

        // add population
        dictionary[line[9]][line[5]][line[1]][line[12]] += Number(line[10]);
    }

    return dictionary;
}

// test
// console.log(parse("./data/penguins_23_11_18.csv"));