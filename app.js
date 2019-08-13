function dataURLToBlob(dataURL) {
    var BASE64_MARKER = ';base64,';
    var parts, contentType, raw;
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        parts = dataURL.split(',');
        contentType = parts[0].split(':')[1];
        raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    parts = dataURL.split(BASE64_MARKER);
    contentType = parts[0].split(':')[1];
    raw = window.atob(parts[1]);
    var rawLength = raw.length;
    var uInt8Array = new Uint8Array(rawLength);
    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
}
function addSoftAlert(msg) {
    $('#softAlerts').append('<p class="text-danger">' + msg + '</p>');
}
var buildPDF = function buildPDF(doc, settings, labels, page, row, col, fontSize) {
    //alert(1);
    var labelIndex = (page * settings.numRows * settings.numColumns) + (row * settings.numColumns) + col;
    var label, labelPosition, barcodeImgEl, barcodeImg, docBlob, tempLink, tempLinkURL, rexelImgKey;
    if (labelIndex === labels.length) {
        $('#printBtn').text('Print');
        docBlob = dataURLToBlob(doc.output('datauristring'));
        // tempLink = document.createElement('object');
        // document.body.appendChild(tempLink);
        // tempLink.style.display = 'none';
        tempLinkURL = window.URL.createObjectURL(docBlob);
        // tempLink.data = tempLinkURL;
        // tempLink.width = 200;
        // tempLink.height = 500;
        window.open(tempLinkURL);
        // tempLink.target = '_blank';
        // tempLink.click();
        // window.URL.revokeObjectURL(tempLinkURL);
        return true;
    }
    $('#printBtn').text('Processing ' + labelIndex + '/' + labels.length);

    label = labels[labelIndex];
    labelPosition = {
        // space between label
        left: settings.marginLeft + (col * (settings.labelWidth + 0.15)),
        top: settings.marginTop + (row * (settings.labelHeight))
    };
    if (settings.template == 'ten-63') {
        doc.setFontStyle("bold");
        doc.text(
            labelPosition.left + settings.desLeft,
            labelPosition.top + 0.55,
            label.description.substring(0, settings.numCharsDesc)
        );
    } else {
        doc.text(
            labelPosition.left + settings.desLeft,
            labelPosition.top + 0.1,
            label.description.substring(0, settings.numCharsDesc)
        );
    }
    doc.setFontStyle("normal");
    var barcodeTopAdjust = 0;
    if (settings.twolineDesc) {
        if (settings.template == 'ten-63') {
            doc.setFontStyle("bold");
            doc.text(
                labelPosition.left + settings.desLeft,
                labelPosition.top + 0.80,
                label.description.substring(settings.numCharsDesc, settings.numCharsDesc * 2)
            );
            doc.setFontStyle("normal");
        } else {
            doc.text(
                labelPosition.left + settings.desLeft,
                labelPosition.top + 0.25,
                label.description.substring(settings.numCharsDesc, settings.numCharsDesc * 2)
            );
        }
        labelPosition.top = labelPosition.top + 0.15;
        barcodeTopAdjust += 0.25;
    }

    if (settings.descLine) {
        for (var i = 1; i < settings.descLine; i++) {
            doc.text(
                labelPosition.left + settings.desLeft,
                labelPosition.top + 0.25,
                label.description.substring(i * settings.numCharsDesc, settings.numCharsDesc * (i + 1))
            );
            labelPosition.top = labelPosition.top + 0.15
            barcodeTopAdjust += 0.25;
        }
    }

    if (settings.template == 'five') {
        doc.text(
            labelPosition.left + settings.desLeft,
            labelPosition.top + 0.25,
            label.description.substring(settings.numCharsDesc, settings.numCharsDesc * 2)
        );
        doc.text(
            labelPosition.left + settings.desLeft,
            labelPosition.top + 0.40,
            label.description.substring(settings.numCharsDesc * 2, settings.numCharsDesc * 3)
        );
        doc.text(
            labelPosition.left + settings.desLeft,
            labelPosition.top + 0.55,
            label.description.substring(settings.numCharsDesc * 2, settings.numCharsDesc * 3)
        );
    }

    var mnu;
    var quantity = (label.quantity && label.quantity != "") ? ' | QTY: ' + label.quantity : ""; //If quantity present or not...
    mnu = label.manufacturer ? label.manufacturer : label.mfgpartnumber;
    if (settings.template == 'herma') {
        mnu = mnu.substring(0, 15)
    }
    if (label.manufacturer && label.mfgpartnumber) {
        mnu = label.manufacturer + ' | ' + label.mfgpartnumber
    }
    mnu += quantity //Add column as quantity...
    if (settings.template != 'five' && !settings.hidemfg) {
        doc.text(
            labelPosition.left + settings.mfgLeft,
            labelPosition.top + 0.25,
            mnu
        );

        if (!settings.hidemin) {
            var lbsize = '';
            if (label.min >= 0 && label.min != '') {
                lbsize = 'Min: ' + label.min;
            }

            if (label.max >= 0 && label.max != '') {
                lbsize += ' | Max: ' + label.max;
            }

            if (label.reference) {
                lbsize += ' | '
            }
            doc.text(
                labelPosition.left + settings.mnxLeft,
                labelPosition.top + 0.4,
                lbsize + label.reference
            );
        }
    }

    var barcodeHeight = settings.barcodeHeight;
    if (settings.barcodeLabelMax && label.id.length >= settings.barcodeLabelMax) {
        barcodeHeight = settings.barcodeMaxHeight
    }

    var topAdjust = settings.twolineDesc ? 0.25 : 0.1;
    if (settings.rexelImgWidth && settings.rexelImgHeight) {
        if (settings.template == 'ten-63') {
            doc.addImage(
                images[settings.banner],
                'JPEG',
                labelPosition.left + 0.3,
                labelPosition.top + settings.labelHeight - topAdjust - settings.rexelImgHeight,
                settings.rexelImgWidth,
                settings.rexelImgHeight
            );
        } else {
            doc.addImage(
                images[settings.banner],
                'JPEG',
                labelPosition.left + 0.1,
                labelPosition.top + settings.labelHeight - topAdjust - settings.rexelImgHeight,
                settings.rexelImgWidth,
                settings.rexelImgHeight
            );
        }
    }
    var barcodeFont = 20;
    if (settings.template == 'thirty') {
        barcodeFont = 19;
    }
    barcodeImgEl = $('<img />').JsBarcode('' + label.id, {
        format: 'CODE39',
        displayValue: true,
        fontSize: barcodeFont
    });

    barcodeImg = new Image();
    barcodeImg.src = barcodeImgEl.attr('src');

    barcodeImg.onload = function () {
        var productImg;
        var barcodeWidth = (barcodeHeight / barcodeImg.naturalHeight) * barcodeImg.naturalWidth;

        if (settings.template === 'five') {
            doc.addImage(
                barcodeImgEl.attr('src'),
                'JPEG',
                labelPosition.left,
                labelPosition.top + settings.labelHeight - 0.1 - barcodeHeight,
                barcodeWidth,
                barcodeHeight
            );
        }
        if (settings.barcodeAlignLeft || settings.barCodeLeft) {
            var leftpos = 0;
            if (settings.barCodeLeft) {
                leftpos = settings.barCodeLeft
            }
            doc.addImage(
                barcodeImgEl.attr('src'),
                'JPEG',
                labelPosition.left + leftpos,
                labelPosition.top + settings.labelHeight - barcodeTopAdjust - barcodeHeight,
                barcodeWidth,
                barcodeHeight
            );
        } else {
            if (settings.template === 'thirty') {
                doc.addImage(
                    barcodeImgEl.attr('src'),
                    'JPEG',
                    labelPosition.left + settings.labelWidth - 0.37 - barcodeWidth,
                    labelPosition.top + settings.labelHeight - topAdjust - barcodeHeight,
                    barcodeWidth + 0.35,
                    barcodeHeight
                );
            } else {
                doc.addImage(
                    barcodeImgEl.attr('src'),
                    'JPEG',
                    labelPosition.left + settings.labelWidth - 0.1 - barcodeWidth,
                    labelPosition.top + settings.labelHeight - topAdjust - barcodeHeight,
                    barcodeWidth + 0.2,
                    barcodeHeight
                );
            }
        }

        if (settings.template && settings.productImgHeight) {
            productImg = new Image();
            productImg.crossOrigin = 'Anonymous';

            productImg.onload = function () {
                var productImgBase64;
                var productImgWidth = (settings.productImgHeight / productImg.naturalHeight) * productImg.naturalWidth;
                var canvas = document.createElement('CANVAS');
                var ctx = canvas.getContext('2d');
                canvas.height = this.height;
                canvas.width = this.width;
                ctx.drawImage(this, 0, 0);
                try {
                    productImgBase64 = canvas.toDataURL('image/jpeg');
                    doc.addImage(
                        productImgBase64,
                        'JPEG',
                        labelPosition.left + 0.1,
                        labelPosition.top + 0.1,
                        productImgWidth,
                        settings.productImgHeight
                    );
                } catch (e) {
                    addSoftAlert('Product image at "' + label.imageurl + '" is not CORS enabled, and so cannot be included in the PDF. Your photo file host may be able to help with this.');
                    return false;
                }
                if (col < settings.numColumns - 1) {
                    buildPDF(doc, settings, labels, page, row, col + 1);
                } else if (row < settings.numRows - 1) {
                    buildPDF(doc, settings, labels, page, row + 1, 0);
                } else {
                    doc.addPage();
                    buildPDF(doc, settings, labels, page + 1, 0, 0);
                }
            };
            productImg.src = label.imageurl;
            productImg.onerror = function () {
                addSoftAlert('There was an error loading product image at "' + label.imageurl + '" and it will not be included in the PDF.');
                if (col < settings.numColumns - 1) {
                    buildPDF(doc, settings, labels, page, row, col + 1);
                } else if (row < settings.numRows - 1) {
                    buildPDF(doc, settings, labels, page, row + 1, 0);
                } else {
                    doc.addPage();
                    buildPDF(doc, settings, labels, page + 1, 0, 0);
                }
            };
        } else {
            if (col < settings.numColumns - 1) {
                buildPDF(doc, settings, labels, page, row, col + 1);
            } else if (row < settings.numRows - 1) {
                buildPDF(doc, settings, labels, page, row + 1, 0);
            } else {
                doc.addPage();
                buildPDF(doc, settings, labels, page + 1, 0, 0);
            }
        }
    };
};
$(function () {
    $('#printBtn').click(function () {
        var config = {}, settings;
        var props = ['template', 'topAdjust', 'leftAdjust', 'csvFile', 'banner'];
        var reader;
        $('#softAlerts').empty();
        props.map(function (prop) {
            config[prop] = $('#' + prop).val();
        });

        if (!config.csvFile) {
            alert('Please choose a CSV file to use as a data source before printing.');
            return false;
        }
        if (!window.FileReader) {
            alert('This browser does not support local file processing. Please update your browser then try again.');
            return false;
        }
        if (isNaN(parseFloat(config.topAdjust))) {
            alert('Error: Top Adjust is not a number.');
            return false;
        }
        if (isNaN(parseFloat(config.leftAdjust))) {
            alert('Error: Left Adjust is not a number.');
            return false;
        }
        if ((parseFloat(config.topAdjust) > 50 || parseFloat(config.topAdjust) < -50) && !confirm('Your top adjust is quite large. Press cancel to edit it or Okay to proceed anyway.')) {
            return false;
        }
        if ((parseFloat(config.leftAdjust) > 50 || parseFloat(config.leftAdjust) < -50) && !confirm('Your left adjust is quite large. Press cancel to edit it or Okay to proceed anyway.')) {
            return false;
        }
        settings = {
            template: config.template,
            marginLeft: 0.15 + parseFloat(config.leftAdjust),
            marginTop: 0.5 + parseFloat(config.topAdjust),
            labelWidth: 4,
            numColumns: 2,
            banner: config.banner
        };
        if (config.template == 'thirty' || config.template == 'can-small') {
            settings.marginTop += 0.05;
            settings.labelWidth = 2.625;
            settings.labelHeight = 1;
            settings.numRows = 10;
            settings.numColumns = 3;
            settings.desLeft = 0.1;
            settings.mfgLeft = 0.1;
            settings.mnxLeft = 0.1;
            settings.rexelImgHeight = 0.3;
            settings.rexelImgWidth = 0.814;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.50;
            if (config.template == 'can-small') {
                settings.productImgHeight = 0.5;
            }

        } else if (config.template == 'fourteen' || config.template == 'can-medium') {
            settings.marginTop += 0.5;
            settings.labelHeight = 1.333;
            settings.numRows = 7;
            settings.desLeft = 1;
            settings.mfgLeft = 1;
            settings.mnxLeft = 1;
            settings.numCharsDesc = 46;
            settings.rexelImgHeight = 0.5;
            settings.rexelImgWidth = 1.356;
            settings.barcodeHeight = 0.5;
            settings.productImgHeight = 0.5;
            settings.barcodeLabelMax = 11;
            settings.barcodeMaxHeight = 0.42;
        }
        if (config.template == 'ten-63') {
            settings.labelHeight = 2;
            settings.numRows = 5;
            settings.desLeft = 1.3;
            settings.mfgLeft = 1.5;
            settings.mnxLeft = 1.5;
            settings.numCharsDesc = 12;
            settings.rexelImgHeight = 0.6;
            settings.rexelImgWidth = 1.627;
            settings.barcodeHeight = 0.7;
            settings.productImgHeight = 1;
            settings.barcodeLabelMax = 8;
            settings.barcodeMaxHeight = 0.30;
            settings.hidemin = true;
            settings.barCodeLeft = 2.0;
            settings.twolineDesc = true;
            settings.hidemfg = true;
        }
        if (config.template == 'ten' || config.template == 'can-large') {
            settings.labelHeight = 2;
            settings.numRows = 5;
            settings.desLeft = 1.5;
            settings.mfgLeft = 1.5;
            settings.mnxLeft = 1.5;
            settings.numCharsDesc = 38;
            settings.rexelImgHeight = 0.6;
            settings.rexelImgWidth = 1.627;
            settings.barcodeHeight = 0.8;
            settings.productImgHeight = 1;
            settings.barcodeLabelMax = 8;
            settings.barcodeMaxHeight = 0.37;
        }
        if (config.template == 'five') {
            settings.marginTop += 0.05;
            settings.labelWidth = 2;
            settings.labelHeight = 1.25;
            settings.numRows = 8;
            settings.numColumns = 4;
            settings.desLeft = 0.05;
            settings.rexelImgHeight = 0;
            settings.rexelImgWidth = 0;
            settings.numCharsDesc = 25;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
        }
        if (config.template == 'lfive') {
            settings.marginTop += 0.05;
            settings.labelWidth = 2.76;
            settings.labelHeight = 1.41;
            settings.numRows = 8;
            settings.numColumns = 3;
            settings.desLeft = 0.1;
            settings.mfgLeft = 0.1;
            settings.mnxLeft = 0.1;
            settings.rexelImgHeight = 0.3;
            settings.rexelImgWidth = 0.814;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
        }

        if (config.template == 'intermedium') {
            settings.marginLeft = -0.06;
            settings.marginTop = 0;
            settings.labelWidth = 4.135;
            settings.labelHeight = 1.67;
            settings.numRows = 7;
            settings.numColumns = 2;
            settings.desLeft = 1;
            settings.mfgLeft = 1;
            settings.mnxLeft = 1;
            settings.rexelImgHeight = 0.5;
            settings.rexelImgWidth = 1.356;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
        }

        if (config.template == 'interlarge') {
            settings.marginTop = 0.18;
            settings.marginLeft = -0.05;
            settings.labelWidth = 4.135;
            settings.labelHeight = 2.267;
            settings.numRows = 5;
            settings.numColumns = 2;
            settings.desLeft = 1;
            settings.mfgLeft = 1;
            settings.mnxLeft = 1;
            settings.rexelImgHeight = 0.6;
            settings.rexelImgWidth = 1.627;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
        }

        if (config.template == 'herma') {
            settings.marginTop = 0.5;
            settings.marginLeft = 0.35;
            settings.labelWidth = 1.8;
            settings.labelHeight = 1.2;
            settings.numRows = 11;
            settings.numColumns = 4;
            settings.desLeft = 0.1;
            settings.mfgLeft = 0.1;
            settings.mnxLeft = 0.1;
            settings.barcodeAlignLeft = true;
            //settings.rexelImgHeight = 0.3;
            //settings.rexelImgWidth = 1.3;
            settings.numCharsDesc = 25;
            settings.twolineDesc = true;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
        }

        if (config.template == 'A3423') {
            settings.marginTop = 0.33;
            settings.marginLeft = 0.1;
            settings.labelWidth = 4.033;
            settings.labelHeight = 1.278;
            settings.numRows = 8;
            settings.numColumns = 2;
            settings.desLeft = 1;
            settings.mfgLeft = 1;
            settings.mnxLeft = 1;
            settings.rexelImgHeight = 0.5;
            settings.rexelImgWidth = 1.3;
            settings.numCharsDesc = 38;
            settings.twolineDesc = true;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
        }

        if (config.template == 'l6031') {
            settings.marginTop = 0.5;
            settings.marginLeft = 0.32;
            settings.labelWidth = 3.68;
            settings.labelHeight = 0.77;
            settings.numRows = 16;
            settings.desLeft = 0.1;
            settings.mfgLeft = 0.1;
            settings.mnxLeft = 0.1;
            settings.rexelImgHeight = 0.3;
            settings.rexelImgWidth = 0.814;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.35;
            settings.hidemin = true;
        }

        if (config.template == 'sweden-custom') {
            settings.marginTop = 0.5;
            settings.marginLeft = 0.32;
            settings.labelWidth = 3.68;
            settings.labelHeight = 1.5;
            settings.numRows = 8;
            settings.numColumns = 2;
            settings.desLeft = 1;
            settings.mfgLeft = 1;
            settings.mnxLeft = 1;
            settings.barCodeLeft = 1;
            // settings.rexelImgHeight = 0.5;
            // settings.rexelImgWidth = 1.356;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
            settings.barcodeLabelMax = 8;
            settings.barcodeMaxHeight = 0.37;
            settings.barcodeAlignLeft = true;
            settings.descLine = 4;
            settings.hidemfg = true;
        }

        if (config.template == 'C23358') {
            settings.marginTop = 0.61;
            settings.marginLeft = 0.32;
            settings.labelWidth = 3.8;
            settings.labelHeight = 1.49;
            settings.numRows = 7;
            settings.numColumns = 2;
            settings.desLeft = 1;
            settings.mfgLeft = 1;
            settings.mnxLeft = 1;
            settings.rexelImgHeight = 0.5;
            settings.rexelImgWidth = 1.356;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.45;
            settings.productImgHeight = 0.5;
            settings.barcodeLabelMax = 8;
            settings.barcodeMaxHeight = 0.37;
            settings.twolineDesc = true;
        }

        if (config.template == 'A3421') {
            settings.marginTop = 0.35;
            settings.marginLeft = 0.1;
            settings.labelWidth = 2.656;
            settings.labelHeight = 0.9;
            settings.numRows = 11;
            settings.numColumns = 3;
            settings.desLeft = 0.1;
            settings.mfgLeft = 0.1;
            settings.mnxLeft = 0.1;
            settings.rexelImgHeight = 0.3;
            settings.rexelImgWidth = 0.814;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.35;
            settings.productImgHeight = 0.5;
            settings.barcodeLabelMax = 8;
            settings.barcodeMaxHeight = 0.37;
        }
        if (config.template == 'A3421') {
            settings.marginTop = 0.35;
            settings.marginLeft = 0.1;
            settings.labelWidth = 2.656;
            settings.labelHeight = 0.9;
            settings.numRows = 11;
            settings.numColumns = 3;
            settings.desLeft = 0.1;
            settings.mfgLeft = 0.1;
            settings.mnxLeft = 0.1;
            settings.rexelImgHeight = 0.3;
            settings.rexelImgWidth = 0.814;
            settings.numCharsDesc = 38;
            settings.barcodeHeight = 0.35;
            settings.productImgHeight = 0.5;
            settings.barcodeLabelMax = 8;
            settings.barcodeMaxHeight = 0.37;
        }


        $('#printBtn').text('Processing...');
        var pagesize = 'A4';
        if (settings.banner == 'nedco' ||
            settings.banner == 'rexelatiantic' ||
            settings.banner == 'westburne') {
            pagesize = 'letter';
        }

        if (config.template == 'lfive' || config.template == 'intermedium' || config.template == 'interlarge' || config.template == 'herma' || config.template == 'l6031') {
            pagesize = 'A4'
        }
        var imageUrls = {
            regro: "https://www.regroshop.at/p/",
            schake: "https://www.schaecke.at/p/",
            rexelatiantic: "https://atlantic.rexel.ca/p/",
            nedco: "https://www.nedco.ca/p/",
            westburne: "https://www.westburne.ca/p/",
            rexelfr: "https://www.rexel.fr/p/",
            hagemeyer: "https://www.hagemeyershop.com/p/",
            rexelnz: "https://www.rexel.nl/p/",
            selga: "https://www.selga.se/p/",
            storel: "https://www.storel.se/p/",
            gexpro: "https://www.gexpro.com/p/",
            rexel: "https://www.rexelusa.com/p/"
        };

        reader = new FileReader();
        reader.onload = function (event) {
            var csvData = event.target.result.replace(/;/g, ',');
            var labels = CSV.parse(csvData, { header: true });
            //Image URL
            /*if (labels && imageUrls[settings.banner]) {
             for (var i = 0; i < labels.length; i++) {
             labels[i].imageurl = imageUrls[settings.banner] + labels[i].id + '/images/default/515Wx515H.jpeg';
             }
             }*/
            var doc = new jsPDF('portrait', 'in', pagesize);
            var fontSize = 8;
            if (config.template == 'can-large' || config.template == 'can-medium') {
                fontSize = 10;
            } else if (config.template == 'ten-63') {
                fontSize = 22;
            }
            doc.setFontSize(fontSize);
            buildPDF(doc, settings, labels, 0, 0, 0, fontSize);
        };
        reader.onerror = function () {
            alert('An error occurred trying to read the file. It may be corrupt or in an unknown format. Try exporting the file again.');
        };
        reader.readAsText($('#csvFile').get(0).files[0]);
    });
});





