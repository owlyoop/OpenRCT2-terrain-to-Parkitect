/// <reference path = "D:\Users\TreyHDD\games\OpenRCT2\OpenRCT2-develop\OpenRCT2-develop\distribution\openrct2.d.ts" />


//parkitect's max terrain height is 32 (64 high in openrct2), but in most scenarios the terrain should fit
//so we might have to offset the terrain up or down depending on the terrain's average height
//UPDATE: i dont think any of the scenarios go above the max height in parkitect
const rct2min = 2;
const rct2max = 142;

const parkitectMax = 66;

var minHeight = rct2min;
var maxHeight = rct2max;

var avgHeight = 0;

var heightData = new Uint8Array((map.size.x - 2) * ( map.size.y - 2) * 4);
var ownershipData = new Uint8Array((map.size.x - 2) * ( map.size.y - 2) * 2);
var terrainTypeData = new Uint8Array((map.size.x - 2) * ( map.size.y - 2));

var allHeights = new Array();
var allSlopes = new Array();

function initialize()
{
    heightData = new Uint8Array((map.size.x - 2) * ( map.size.y - 2) * 4);
    ownershipData = new Uint8Array((map.size.x - 2) * ( map.size.y - 2) * 2);
    terrainTypeData = new Uint8Array((map.size.x - 2) * ( map.size.y - 2));
}

var terrainExport = function() 
{

    initialize();
    var min = rct2max;
    var max = rct2min;

    // Iterate every tile in the map
    for (var x = 0; x < map.size.x - 2; x++) 
    {
        for (var y = 0; y < map.size.y - 2; y++) 
        {
            var tile = map.getTile(x+1, y+1);

            for (var i = 0; i < tile.numElements; i++) 
            {
                var element = tile.getElement(i);

                if (element.type === 'surface') 
                {
                    if (element.baseHeight < min)
                    {
                        min = element.baseHeight;
                    }

                    if (element.baseHeight > max)
                    {
                        max = element.baseHeight;
                    }

                    allHeights.push(element.baseHeight);
                    allSlopes.push(element.slope);

                    //buildParkitectData((x-1 + ((map.size.y - 2) * (y-1))) * 4, element.baseHeight, element.slope);
                    //doing the above makes the map flipped in parkitect, so we have to do this below so it outputs correctly
                    var index = (( ((map.size.x - 3) - (x)) + ((map.size.y - 2) * (y)) ) * 4);
                    var ownershipDataIndex = (( ((map.size.x - 3) - (x)) + ((map.size.y - 2) * (y)) ) * 2);
                    var terrainTypeIndex = ( ((map.size.x - 3) - (x)) + ((map.size.y - 2) * (y)) );

                    buildParkitectHeightData(index, element.baseHeight, element.slope);
                    buildParkitectOwnershipData(ownershipDataIndex, element.ownership);
                    buildParkitectTerrainTypeData(terrainTypeIndex, element.surfaceStyle);
                }
            }
        }
    }

    //console.log("Min terrain height is:" + min + " Max terrain height is:" + max + " Average height is:" + getAverage(allHeights));
    //console.log("data length is " + heightData.length);
    //console.log("ownership data length is " + ownershipData.length);

    var heightDataFinish = base64ArrayBuffer(combinePrefixAndDataBytes((map.size.x - 2) * ( map.size.y - 2) * 4, heightData));
    var ownershipFinish = base64ArrayBuffer(ownershipData);
    var terrainTypeFinish = base64ArrayBuffer(combinePrefixAndDataBytes((map.size.x - 2) * ( map.size.y - 2), terrainTypeData));

    console.log(scenario.name + " map size is " + (map.size.x - 2) + " by " + (map.size.y - 2));
    console.log("**********Height Data**********");
    console.log(heightDataFinish);
    console.log("******************************");

    console.log("**********Land Ownership Data**********");
    console.log(ownershipFinish);
    console.log("******************************");

    console.log("**********Terrain Type Data**********");
    console.log(terrainTypeFinish);
    console.log("******************************");
}

function getAverage(a)
{
    var total = 0;
    for(var i = 0; i < a.length; i++)
    {
        total += a[i];
    }

    var result = total / a.length;
    return result;
}


function combinePrefixAndDataBytes(sizeOfData, data)
{
    var heightPrefix = buildParkitectPrefixBytes(sizeOfData);
    var finished = new Uint8Array(heightPrefix.length + data.length);
    finished.set(heightPrefix);
    finished.set(data, heightPrefix.length);

    return finished;
}

function buildParkitectPrefixBytes(sizeOfData)
{
    var lengthBinary = sizeOfData.toString(2);
    var firstByte = 10;

    //first prefix byte is always 10 (00001010)
    if (sizeOfData < 16384) //if it's greater than this, there's 4 prefix bytes. if not there's 3.
    {
        while(lengthBinary.length < 14)
        {
            lengthBinary = "0" + lengthBinary;
        }
        var thirdByteStr = lengthBinary.substring(0,7);
        var secondByteStr = lengthBinary.substring(7, 14);

        thirdByteStr = "0" + thirdByteStr;
        secondByteStr = "1" + secondByteStr;

        var thirdByte = parseInt(thirdByteStr, 2);
        var secondByte = parseInt(secondByteStr, 2);

        var prefixBytes = new Uint8Array([firstByte, secondByte, thirdByte]);
        return prefixBytes;

    }
    else
    {
        while(lengthBinary.length < 21)
        {
            lengthBinary = "0" + lengthBinary;
        }

        var fourthByteStr = lengthBinary.substring(0,7);
        var thirdByteStr = lengthBinary.substring(7, 14);
        var secondByteStr = lengthBinary.substring(14,21);

        fourthByteStr = "0" + fourthByteStr;
        thirdByteStr = "1" + thirdByteStr;
        secondByteStr = "1" + secondByteStr;

        var fourthByte = parseInt(fourthByteStr, 2);
        var thirdByte = parseInt(thirdByteStr, 2);
        var secondByte = parseInt(secondByteStr, 2);

        var prefixBytes = new Uint8Array([firstByte, secondByte, thirdByte, fourthByte]);
        return prefixBytes;
    }
}

function buildParkitectHeightData(index, height, slope)
{
    var newHeight = (height * 2) - 4;
    
    //Parkitect uses 1 byte for each corner whereas OpenRCT2 uses 2 bytes for each tile. baseHeight byte and slopeByte. the slope byte uses 1 bit per corner

    var parkitectValue = newHeight + (getBit(slope, 0) * 4);
    parkitectValue = clamp(parkitectValue, 0, 128);
    heightData[index + 1] = parkitectValue;

    parkitectValue = newHeight + (getBit(slope, 1) * 4);
    parkitectValue = clamp(parkitectValue, 0, 128);
    heightData[index + 0] = parkitectValue;

    parkitectValue = newHeight + (getBit(slope, 2) * 4);
    parkitectValue = clamp(parkitectValue, 0, 128);
    heightData[index + 3] = parkitectValue;
    
    parkitectValue = newHeight + (getBit(slope, 3) * 4);
    parkitectValue = clamp(parkitectValue, 0, 128);
    heightData[index + 2] = parkitectValue;
}

function getBit(value, position)
{
    if (value == 0)
    {
        return 0;
    }
    else if (value == 29 && position == 3)
    {
        return 2;
    }
    else if (value == 27 && position == 0)
    {
        return 2;
    }
    else if (value == 23 && position == 1)
    {
        return 2;
    }
    else if (value == 30 && position == 2)
    {
        return 2;
    }
    else
    {
        return (value >> position) & 1;
    }
}

function buildParkitectOwnershipData(index, value)
{
    var parkitectValue = 0;

    if (value === 0) //unobtainable land
    {
        parkitectValue = 0;
    }
    else if (value === 16 || value === 64) //construction rights. parkitect doesn't have "construction rights for sale"
    {
        parkitectValue = 3;
    }
    else if (value === 32) //owned land
    {
        parkitectValue = 1;
    }
    else if (value === 128) //land for sale (value is 128)
    {
        parkitectValue = 2;
    }
    else
    {
        parkitectValue = 1;
    }

    ownershipData[index] = 8;
    ownershipData[index + 1] = parkitectValue;
}

function buildParkitectTerrainTypeData(index, value)
{

    var parkitectValue = 0;
    if (value == 0) //grass
    {
        parkitectValue = 0;
    }
    else if (value == 1) //sand. parkitect 1 is sand and 9 is wavy sand.
    {
        parkitectValue = 9;//TODO: ingame option to switch between sand and wavy sand.
    }
    else if (value == 2) //dirt/mud
    {
        parkitectValue = 14;
    }
    else if (value == 3) //rock
    {
        parkitectValue = 2;
    }
    else if (value == 4) //red rock like on mars. parkitect doesnt have anything close to this other than a reddish dirt. 
    {
        //there seems to be only 1 loopy landscapes scenario and 2 rct2 scenarios that use it. shouldnt be a big deal
        parkitectValue = 2; //TODO: ingame option to choose which to output as. defaulting as rock since its usually paired with the red dirt
    }
    else if (value == 5) // checkerboard. parkitect does not have this
    {
        parkitectValue = 10; //default to black ash i guess
    }
    else if (value == 6) //dirty grass
    {
        parkitectValue = 5;
    }
    else if (value == 7) //snow. parkitect has snow and ice which look VERY similar. ice has a slight blue tint
    {
        parkitectValue = 8; //TODO: ingame option to let the player pick
    }
    else if (value == 8 || value == 9 || value == 10 || value == 11) //red, yellow, pruple, and green grids. parkitect does not have this
    {
        parkitectValue = 11; //defaulting to volcano. i dont know. TODO: add ingame option to let player choose
    }
    else if (value == 12) //red dirt
    {
        parkitectValue = 4;
    }
    else if (value == 13) //tan dirt. closest thing is parkitect's cracked dirt which hasnt been used yet and thematically fits
    {
        parkitectValue = 7;
    }
    else //if for whatever reason the value is none of this, make the ground parkitect leaves since we havent used that yet and rct has nothing similar
    {
        parkitectValue = 6;
    }

    terrainTypeData[index] = parkitectValue;

}

function clamp(num, min, max)
{
    return Math.min(Math.max(num, min), max);
}

//Got this code from here: https://gist.github.com/jonleighton/958841
function base64ArrayBuffer(arrayBuffer) {
    var base64    = ''
    var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  
    var bytes         = new Uint8Array(arrayBuffer)
    var byteLength    = bytes.byteLength
    var byteRemainder = byteLength % 3
    var mainLength    = byteLength - byteRemainder
  
    var a, b, c, d
    var chunk
  
    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
  
      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
      d = chunk & 63               // 63       = 2^6 - 1
  
      // Convert the raw binary segments to the appropriate ASCII encoding
      base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
    }
  
    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength]
  
      a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2
  
      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4 // 3   = 2^2 - 1
  
      base64 += encodings[a] + encodings[b] + '=='
    } else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]
  
      a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4
  
      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2 // 15    = 2^4 - 1
  
      base64 += encodings[a] + encodings[b] + encodings[c] + '='
    }
    
    return base64
  }

var main = function() 
{
    // In JavaScript, the var keyword is used to define a new variable in the current closure. Functions
    // are the only closure in ES5, braces do not create new scope. You can think of var as an equivalent
    // of the local keyword from other scripting languages such as LUA.

    // If we do not use the var keyword then the variable acts as a global shared between all plugins and
    // the console. The following code allows the console and other plugins to use our functions.
    

    // Add a menu item under the map icon on the top toolbar
    ui.registerMenuItem("Write scenario data into console", function() 
    {
        terrainExport();
    });
};

registerPlugin
({
    name: 'TerrainExporter',
    version: '1.0',
    authors: ['owlyoop'],
    type: 'remote',
    main: main
});

