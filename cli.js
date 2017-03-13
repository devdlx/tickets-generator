const Canvas = require('canvas');
const Image = Canvas.Image;
const Barc = require('barc');
const barc = new Barc();
const fs = require('fs');
const QRCode = require('qrcode');
const path = require('path');
const writefile = require('writefile');
const readdirp = require('readdirp');

var template_path = path.join(__dirname, '/ga.png');
var barcodes_path = path.join(__dirname, '/tickets/barcodes');
var tickets_path = path.join(__dirname, '/tickets');



var prefix = "GA";
var prefix_delim = "";


var ticket_width = 600;
var ticket_height = 1650;

var items_per_page = 8;


var bulkWidth = (items_per_page / 2) * ticket_width;
var bulkHeight = ticket_height * 2;

// QR
// x 435.00 - 550.00
// y 1037.00 - 1152.00
// stub
// x 448.00 - 563.00
// y 1493.00 - 1608.00


// text
// ticket
// x 242.00 - 419.00 px
// y 1037.00 - 1152.00
// stub
// x 265.00 - 442.00
// y 1493.00 - 1608.00
// 1550.50




const default_options = {
    template_path: template_path,
    barcodes_path: barcodes_path,
    tickets_path: tickets_path
}

var parseArgs = require('minimist')(process.argv.slice(2));


// const options = {
//     template_path: ,
//     barcodes_path: ,
//     tickets_path: ,
//     prefix: ,
//     prefix_delim: ticket_width: ,
//     ticket_height: ,
//     items_per_page: ,
//     output_path:
// }

// console.dir(parseArgs);

const _options = Object.assign({}, parseArgs)
if (_options._.length === 0) {
    runCommand()
} else {
    for (var _index in _options._) {
        if (_options._.hasOwnProperty(_index)) {
            var command = _options._[_index]
            // console.log(command);
            runCommand(command)
        }
    }
}


function runCommand(command = '') {

    switch (command) {
        case 'gen':
            const count = _options.count
            generate({

                amount: count,

                templatePath: template_path,
                ticket_width: 600,
                ticket_height: 1650,

                barcode1X: 492.50,
                barcode1Y: 1094.50 + 48,
                barcode1Width: 435.00 - 550.00,
                barcode1Height: 1037.00 - 1152.00,

                barcode2X: 505.50,
                barcode2Y: 1550.50 + 48,
                barcode2Width: 448.00 - 563.00,
                barcode2Height: 1493.00 - 1608.00,

                bulkWidth: 5100,
                bulkHeight: 3300,

                barcodesPath: barcodes_path,
                ticketsPath: tickets_path,

            });

            break;
        case 'bulk':
            bulk();

            break;
        default:
        
            console.log('-***************-');
            console.log('Ticket Generator');
            console.log('-***************-');

            console.log('-*** Commands ***-');

            console.log(' gen : generate tickets.');

            console.log('  -  Required: ');

            console.log('         --count {number} ');

            console.log('  -  Default: ');

            console.log('         --template_path template.png DEFAULT: "./ticket.png" ');

            console.log('         --ticket_width 600 (in pixels) DEFAULT: "600"');
            console.log('         --ticket_height 1650 (in pixels) DEFAULT: ""');

            console.log('         --barcode1X 200 (in pixels) DEFAULT: "200"');
            console.log('         --barcode1Y 200 (in pixels) DEFAULT: "200"');
            console.log('         --barcode1Width 200 (in pixels) DEFAULT: "200"');
            console.log('         --barcode1Height 200 (in pixels) DEFAULT: "200"');

            console.log('         --tickets_output "./tickets" DEFAULT: "./tickets"');

            console.log('___________________________________');

    }

}


// console.log(options._);


// const walkSync = (dir, filelist = []) => fs.readdirSync(dir)
//     .map(file => fs.statSync(path.join(dir, file)).isDirectory() ?
//         walkSync(path.join(dir, file), filelist) :
//         filelist.concat(path.join(dir, file))[0])
// console.log(walkSync(tickets_path).length);


var images = [];
var tickets = {};


function bulk() {
    readdirp({
            root: path.join(tickets_path, prefix),
            fileFilter: '*.png',
            depth: 0
        })
        .on('warn', function(err) {
            console.error('something went wrong when processing an entry', err);
        })
        .on('error', function(err) {
            console.error('something went fatally wrong and the stream was aborted', err);
        })
        .on('data', (entry) => {
            var obj = {}
            obj.number = entry.name.substr(0, entry.name.lastIndexOf('.'))
            obj.id = prefix + prefix_delim + entry.name.substr(0, entry.name.lastIndexOf('.'))
            obj.filename = entry.name
            obj.path = entry.path
            obj.fullPath = entry.fullPath
            images.push(obj)
        })
        .on('end', () => {
            // console.log(images);
            tickets[prefix + prefix_delim] = images
            // console.log(tickets);
            // writefile(path.join(__dirname, 'tickets.json'), JSON.stringify(tickets)).then(() => {
            //     console.log("finished json");
            // });
        })
        .on('end', () => {
            var lastPageItemsCount = (tickets[prefix + prefix_delim].length % items_per_page)
            var pagesCount = ((tickets[prefix + prefix_delim].length / items_per_page) >> 0) + (lastPageItemsCount > 1)
            // console.log(pagesCount, lastPageItemsCount);
            for (var i = 1; i < pagesCount + 1; i++) {
                if (i == pagesCount) {
                    // console.log('max', i);
                    genBulkPages(i, items_per_page, lastPageItemsCount)
                } else {
                    genBulkPages(i, items_per_page)
                }
            }

        })

}



function genBulkPages(pageNumber, itemsPerPage, lastPageItemsCount = 0) {
    var items;

    var sliceIndex = (pageNumber * itemsPerPage) - (itemsPerPage - lastPageItemsCount);
    var sliceEndIndex = itemsPerPage * pageNumber

    if (lastPageItemsCount) {
        items = images.slice(sliceIndex - lastPageItemsCount, sliceIndex)

        // console.log(sliceIndex - lastPageItemsCount, 'sliceIndex');
        // console.log(sliceIndex, 'sliceEndIndex');

        // console.log(items.length, 'items.length');

        genPage(items, pageNumber)


    } else {
        items = images.slice(sliceIndex, sliceEndIndex)

        // console.log(sliceIndex, 'sliceIndex');
        // console.log(sliceEndIndex , 'sliceEndIndex');

        // console.log(items.length, 'items.length');

        genPage(items, pageNumber)


    }


}

function genPage(items = [], pageNumber) {
    if (!items.length) {
        return 0
    }


    var canvas = new Canvas(bulkWidth, bulkHeight);
    var ctx = canvas.getContext('2d');


    var offsetX = 0;
    var offsetY = 0;
    var fitX = Math.floor(bulkWidth / ticket_width);
    var fitY = Math.floor(bulkHeight / ticket_height);

    for (var itemIndex in items) {

        // console.log(items[itemIndex]);

        var img = new Image;
        img.onload = function() {

            // console.log(offsetX);

            ctx.drawImage(img, offsetX, offsetY, ticket_width, ticket_height);

            offsetX += ticket_width;

            if (offsetX / ticket_width == fitX) {
                offsetX = 0;
                offsetY += ticket_height;
            }

        }

        img.src = items[itemIndex].fullPath;


    }

    var page_path = path.join(tickets_path, prefix, 'pages', 'page' + pageNumber + '.png');

    writefile(page_path, canvas.toBuffer()).then(() => {
        console.log("finished", page);
    });


    return 1

}







function genBulks() {
    console.log('geb bulk');
    fs.readdir(tickets_path, function(err, files) {
        if (err) throw err;
        var iterator = 0;
        var bulk = [];
        files.forEach(function(file) {
            bulk.push(file)
            if (bulk.length == fitX * fitY) {
                new Bulk(iterator++, bulk);
                bulk = [];
            }
        });
        if (bulk.length > 0) new Bulk(iterator, bulk);
    });
}


function generate(options) {

    var fitX = Math.floor(options.bulkWidth / options.ticket_width);
    var fitY = Math.floor(options.bulkHeight / options.ticket_height);


    /**
     * Flow.
     */


    var ids = [];
    for (var i = 0; i < options.amount; i++) {
        var idObj = {};
        // idObj.ticket_number = prefix + prefix_delim + s4();
        idObj.ticket_number = s4();
        idObj.id = prefix + prefix_delim + idObj.ticket_number
        ids.push(idObj);
    }


    var json2csv = require('json2csv');
    var fields = ['ticket_number'];

    var csv = json2csv({
        data: ids,
        fields: fields
    });

    // console.log(csv);
    // fs.writeFile('tickets.csv', csv, null, function(err) {
    //     if (err) throw err;
    //     console.log(csv);
    // });


    for (i in ids) {
        var id = ids[i];
        var done = 0;
        new Ticket(id.ticket_number);
    }




    /**
     * Tickets Generation.
     */
    function Ticket(id, callback) {

        var canvas = new Canvas(options.ticket_width, options.ticket_height);
        var ctx = canvas.getContext('2d');
        var barcodeCanvas;
        // var genBarcodePath = path.join(options.barcodesPath, +id + '.png');
        var finalTicketPath = path.join(options.ticketsPath, prefix, id + '.png');


        var templateImage = new Image;
        templateImage.onerror = function(err) {
            throw err
        }
        templateImage.onload = function() {
            ctx.drawImage(templateImage, 0, 0, options.ticket_width, options.ticket_height);
            console.log('loaded Ticket template: ' + id);

            // console.log('addCode: ' + id, barcodeCanvas.toBuffer());
            // saveTicket();
            QRCode.draw(id, null, function(error, barcodeCanvas) {
                var bcImage = new Image;
                bcImage.onload = () => {
                    ctx.drawImage(
                        bcImage,
                        options.barcode1X,
                        options.barcode1Y,
                        options.barcode1Width,
                        options.barcode1Height);
                    ctx.drawImage(
                        bcImage,
                        options.barcode2X,
                        options.barcode2Y,
                        options.barcode2Width,
                        options.barcode2Height);
                    ctx.font = "70px Inconsolata-Regular";
                    ctx.fillText(id, 242 + 16, 1094.5 + 16);
                    ctx.fillText(id, 265 + 16, 1550.50 + 16);

                    writefile(finalTicketPath, canvas.toBuffer()).then(() => {
                        console.log("finished", id);
                    });

                }

                bcImage.src = barcodeCanvas.toBuffer();
            });


        }
        templateImage.src = options.templatePath;



        // fs.writeFile(genBarcodePath, barcodeCanvas.toBuffer(), function(err) {
        //     if (err) {
        //         throw err;
        //     }
        //     console.log('genBarcode: ' + id);
        // });


        // writefile(genBarcodePath, barcodeCanvas.toBuffer()).then(() => {
        // console.log('done fs.writeFile()')
        // var img = new Image;
        // img.onerror = function(err) {
        //     throw err
        // }
        // img.onload = function() {
        //     ctx.drawImage(img, 0, 0, options.ticket_width, options.ticket_height);
        //     console.log('genTicket: ' + id);
        //     addCode();
        // }
        // img.src = options.templatePath;

        // })




        function addCode() {
            var img = new Image;
            img.onload = function() {
                console.log(img);
                ctx.drawImage(
                    img,
                    options.barcodeX,
                    options.barcodeY,
                    options.barcodeWidth,
                    options.barcodeHeight);
                console.log('addCode: ' + id, finalTicketPath);
                // saveTicket();
            }

            img.src = genBarcodePath;
        }

        function saveTicket() {

            canvas.toBuffer(function(err, buffer) {
                if (err) throw err;
                else writefile(finalTicketPath, buffer, function(err) {
                    console.log('saveTicket: ' + id);
                    callback();
                });
            });
        }

    }

    /**
     * Bulks generation.
     */
    function Bulk() {

        var canvas = new Canvas(options.bulkWidth, options.bulkHeight);
        var ctx = canvas.getContext('2d');
        addTickets();

        function addTickets() {
            var offsetX = 0;
            var offsetY = 0;
            addTicket();

            function addTicket() {
                if (images.length == 0) return saveBulk();
                var img = new Image;
                img.onload = function() {
                    ctx.drawImage(img, offsetX, offsetY, options.ticket_width, options.ticket_height);
                    offsetX += options.ticket_width;
                    if (offsetX / options.ticket_width == fitX) {
                        offsetX = 0;
                        offsetY += options.ticket_height;
                    }
                    addTicket();
                }
                console.log(images.pop());

                // img.src = options.singlesPath + '/' + images.pop();
            }
        }

        function saveBulk() {
            canvas.toBuffer(function(err, buffer) {
                if (err) throw err;
                else writeFile(options.bulksPath + '/' + id + '.png', buffer, function(err) {
                    if (err) throw err;
                    console.log('saveBulk: ' + id);
                });
            });
        }

    }

}


function s4(digits) {
    return Math.floor((1 + Math.random()) * 0x1000)
        .toString(16)
        .substring(1);
}
