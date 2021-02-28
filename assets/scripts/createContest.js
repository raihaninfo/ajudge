console.log("Script linked properly")

let OJ = "All", pNum = "", pName = "";
let problemList = [];

//getting 20 random problem list
getProblemList(OJ, pNum, pName);

function getProblemList(OJ, pNum, pName) {
    $.ajax({
        url: `/problemList?OJ=` + OJ + `&pNum=` + pNum + `&pName=` + pName,
        type: "GET",
        async: false,
        success: function (data) {
            problemList = data;  //assigning to a global variable
            showProblemList();
        },
        error: function () {
            alert('Internal Server Error. Please try again after sometime or send us a feedback.');
        }
    });
};

function showProblemList() {
    $('#loadingGif').css("display", "none");        //hide loading gif image
    $('#loadingGifOJ').css("display", "none");
    $('#loadingGifPNum').css("display", "none");
    $('#loadingGifPName').css("display", "none");

    //removing current existing rows
    let rowSize = $('#problemTable tr').length;
    for (let i = 0; i < rowSize - 1; i++) {
        $('.problemRow' + i).remove();
    }

    if (problemList == null || problemList.length == 0) {
        $('#notFound').text("No Problem Found"); //if no problem found
    } else {
        $('#notFound').text("");                    //otherwise hide this message

        for (let i = 0; i < Math.min(20, problemList.length); i++) {
            let link = "/problemView/" + problemList[i].originOJ + "-" + problemList[i].originProb;

            dataCreate = `<tr class="problemRow` + i + `">
                            <td id="OJ">` + problemList[i].originOJ + `</td>
                            <td id="pNum">`+ problemList[i].originProb + `</td>
                            <td id="pName"><a href="`+ link + `" target="_blank">` + problemList[i].title + `</a></td>
                            <td><button onclick="doSelect(` + i + `)">Select</button></td>
                        </tr>`;

            $('#problemTable').append(dataCreate);
        }
    }
}

//for new query
$("select[name=OJ]").change(function () {
    //displaying mini loading gif image
    $('#loadingGifOJ').css("display", "inline-block");

    //request for new search
    newReq();
})
$("input[name=pNum]").change(function () {
    $('#loadingGifPNum').css("display", "inline-block");
    newReq();
})
$("input[name=pName]").change(function () {
    console.log("Hello1")
    $('#loadingGifPName').css('display', 'inline-block');
    console.log("Hello2")
    newReq();
})
function newReq() {
    OJ = $("select").val();
    pNum = $("input[name=pNum]").val().trim();
    pName = $("input[name=pName]").val().trim();

    getProblemList(OJ, pNum, pName);
}

let classIndex = 0, serialIndex = 65;

function doSelect(index) {
    //removing warning section
    $('div[role="alert"]').removeClass('d-block');
    $('div[role="alert"]').addClass('d-none');

    let selectedOJ = $('.problemRow' + index + ` #OJ`).text();
    let selectedPNum = $('.problemRow' + index + ` #pNum`).text();
    let selectedPName = $('.problemRow' + index + ` #pName`).text();
    let flag = 0;

    let rowSize = $('#contestProbSelectedTable tr').length;

    if (rowSize <= 26) {
        for (let i = 1; i < rowSize; i++) {
            let tempOJ = $("#contestProbSelectedTable tr:eq(" + i + ") #OJ").text();
            let tempPNum = $("#contestProbSelectedTable tr:eq(" + i + ") #pNum").text();

            if (tempOJ == selectedOJ && tempPNum == selectedPNum) {
                alert("This problem already selected!");
                flag = 1;
                break;
            }
        }

        if (flag == 0) {
            let dataCreate = `<tr class="selectedRow` + classIndex + `">
                            <td scope="col" id="serialNum">` + String.fromCharCode(serialIndex) + `</td>
                            <td scope="col" id="OJ"><textarea type="text" name="OJ`+ serialIndex + `" value="" readonly class="cTableInput">` + selectedOJ + `</textarea></td>
                            <td scope="col" id="pNum"><textarea type="text" name="pNum`+ serialIndex + `" value="" readonly class="cTableInput">` + selectedPNum + `</textarea></td>
                            <td scope="col" id="pName"><textarea type="text" name="pName`+ serialIndex + `" value="" readonly class="cTableInput">` + selectedPName + `</textarea></td>
                            <td scope="col" id="customName"><textarea type="text" name="customName`+ serialIndex + `" placeholder="Give a custom name" class="contestCustomInput" style="resize: none;overflow:hidden;"></textarea></td>
                            <td scope="col" ><button onclick="removeSelected(` + classIndex + `)">Remove</button></td>
                        </tr>`;

            $('#contestProbSelectedTable').append(dataCreate);

            classIndex++;
            serialIndex++;
        }
    } else {
        alert("Maximum 26 problem can be added!");
    }
}
function removeSelected(index) {
    // let selectedOJ = $('.selectedRow' + index + ` #OJ`).text();
    // let selectedPNum = $('.selectedRow' + index + ` #pNum`).text();
    // let selectedPName = $('.selectedRow' + index + ` #pName`).text();

    let nextSerial = $('.selectedRow' + index + ' #serialNum').text();  //current serialIndex will be the serialIndex cause current one is being removed
    let nextSerialInt = nextSerial.charCodeAt(0);

    let rowSize = $('#contestProbSelectedTable tr').length;
    let currRowIndex = $('.selectedRow' + index).index();

    //removing current row
    $('.selectedRow' + index).remove();;
    serialIndex--;

    //renaming serial Number
    for (let i = currRowIndex; i < rowSize; i++) {
        $("#contestProbSelectedTable tr:eq(" + i + ") #serialNum").text(nextSerial);
        $("#contestProbSelectedTable tr:eq(" + i + ") #OJ textarea").attr('name', 'OJ' + nextSerialInt);
        $("#contestProbSelectedTable tr:eq(" + i + ") #pNum textarea").attr('name', 'pNum' + nextSerialInt);
        $("#contestProbSelectedTable tr:eq(" + i + ") #pName textarea").attr('name', 'pName' + nextSerialInt);
        $("#contestProbSelectedTable tr:eq(" + i + ") #customName textarea").attr('name', 'customName' + nextSerialInt);

        nextSerialInt++;
        nextSerial = String.fromCharCode(nextSerialInt);
    }
}

//setting a default date (today's date)
let a = new Date();
let year = a.getFullYear();
let month = a.getMonth() + 1;   //months are from 0 to 11, so added 1
let day = a.getDate();

if (month < 10) {
    month = '0' + month;
}
if (day < 10) {
    day = '0' + day;
}

//if it is for update page, then date should be set
let pathname = window.location.pathname;
if (pathname.indexOf("/contestUpdate/") == 0) {
    let cDate = $('#cDate').text().trim();
    $('input[name="contestDate"]').attr('value', cDate);

    //initial set up index variable because already some problem is added if it is update page
    classIndex = 0 + parseInt($('#cProbSetLength').text().trim()), serialIndex = 65 + parseInt($('#cProbSetLength').text().trim());
} else {
    let today = year + '-' + month + '-' + day; //input[type=date] takes this format
    $('input[name="contestDate"]').attr('min', today);
    $('input[name="contestDate"]').attr('value', today);
}

$(document).ready(function () {
    //setting up client side time zone offset. js gives -360 as minute for GMT +06:00
    let offset = new Date().getTimezoneOffset();
    $('input[name="timeZoneOffset"]').val(offset * 60);

    //on form submit
    $('form').on('submit', function () {
        $('form').bind(); //prevent default submitting

        // console.log($('#serialNum').text());
        // console.log($('input[name="contestTitle"]').val());
        // console.log($('input[name="contestDate"]').val());
        // console.log($('input[name="contestTime"]').val());
        // console.log($('input[name="contestDuration"]').val());

        //checking wheather problem set empty or not
        if ($('#serialNum').text() == "") {
            $('div[role="alert"]').text("Problem set empty! Please select at least one problem.");
            $('div[role="alert"]').addClass('d-block');

            return false;
        }
        //checking wheather title empty or not
        if ($('input[name="contestTitle"]').val().trim() == "") {
            //setting up empty if there present spaces
            $('input[name="contestTitle"]').val("");
            $('input[name="contestTitle"]').addClass('alert alert-danger');

            $('div[role="alert"]').text("Contest title cannot be empty!");
            $('div[role="alert"]').addClass('d-block');

            return false;
        }

        //checking wheather start time valid or not
        if (pathname.indexOf("/contestUpdate/") != 0) { //skip time validation for update
            let startTime = new Date($('input[name="contestDate"]').val() + " " + $('input[name="contestTime"]').val());
            let currentTime = new Date();
            // console.log(startTime);
            // console.log(currentTime);
            if (startTime <= currentTime) {
                //setting up empty if there present spaces
                $('input[name="contestTime"]').val("");
                $('input[name="contestTime"]').addClass('alert alert-danger');

                $('div[role="alert"]').text("Start time must be later from now!");
                $('div[role="alert"]').addClass('d-block');

                return false;
            }
        }

        //checking wheather duration valid or not
        let duration = $('input[name="contestDuration"]').val().trim();
        if (duration.length == 5 && duration[0] >= '0' && duration[0] <= '9' && duration[1] >= '0' && duration[1] <= '9' && duration[2] == ':' && duration[3] >= '0' && duration[3] <= '5' && duration[4] >= '0' && duration[4] <= '9') {
            if (duration[0] == '0' && duration[1] == '0' && duration[3] == '0' && duration[4] == '0') {
                //setting up empty if there present spaces
                $('input[name="contestDuration"]').val("");
                $('input[name="contestDuration"]').addClass('alert alert-danger');

                $('div[role="alert"]').text("Give the duration in hh:mm format!");
                $('div[role="alert"]').addClass('d-block');

                return false;
            }
            return true;
        } else {
            //setting up empty if there present spaces
            $('input[name="contestDuration"]').val("");
            $('input[name="contestDuration"]').addClass('alert alert-danger');

            $('div[role="alert"]').text("Give the duration in hh:mm format!");
            $('div[role="alert"]').addClass('d-block');

            return false;
        }
    });
});

$('input[name="contestTitle"]').focus(function () {
    $('input[name="contestTitle"]').removeClass('alert alert-danger');

    $('div[role="alert"]').removeClass('d-block');
    $('div[role="alert"]').addClass('d-none');
});
$('input[name="contestDate"]').focus(function () {
    $('input[name="contestDate"]').removeClass('alert alert-danger');

    $('div[role="alert"]').removeClass('d-block');
    $('div[role="alert"]').addClass('d-none');
});
$('input[name="contestTime"]').focus(function () {
    $('input[name="contestTime"]').removeClass('alert alert-danger');

    $('div[role="alert"]').removeClass('d-block');
    $('div[role="alert"]').addClass('d-none');
});
$('input[name="contestDuration"]').focus(function () {
    $('input[name="contestDuration"]').removeClass('alert alert-danger');

    $('div[role="alert"]').removeClass('d-block');
    $('div[role="alert"]').addClass('d-none');
});