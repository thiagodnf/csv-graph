var data = null;

function showAlert(type, title, content){

	var html = `
		<div class="alert ${type} alert-dismissible fade show">
			<strong>${title}</strong>&nbsp;${content}
			<button type="button" class="close" data-dismiss="alert">
			    <span aria-hidden="true">&times;</span>
			</button>
		</div>
	`;

	$(".message-box").html(html);
}

function showError(content){
	showAlert("alert-danger", "Error! ", content);
}

function chart(id, title, array){

    var frequencies = getFrequency(array);

    var data = [];

    for (var freq in frequencies) {

        data.push({
            name: freq,
            y: frequencies[freq]
        });
    }

    Highcharts.setOptions({ // Apply to all charts
        chart: {
            events: {
                beforePrint: function () {
                    this.oldhasUserSize = this.hasUserSize;
                    this.resetParams = [this.chartWidth, this.chartHeight, false];
                    this.setSize(600, 600, false);
                },
                afterPrint: function () {
                    this.setSize.apply(this, this.resetParams);
                    this.hasUserSize = this.oldhasUserSize;
                }
            }
        }
    });

    var chart = Highcharts.chart(id, {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            useHTML: true,
            style: {
                textAlign: "center",
                width: 500
            },
            text: title
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        accessibility: {
            point: {
                valueSuffix: '%'
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            name: "Series' name",
            colorByPoint: true,
            data: data
        }]
    });

    var beforePrint = function () {
        chart.oldhasUserSize = chart.hasUserSize;
        chart.resetParams = [chart.chartWidth, chart.chartHeight, false];
        chart.setSize(600, 400, false);
    };
    var afterPrint = function () {
        chart.setSize.apply(chart, chart.resetParams);
        chart.hasUserSize = chart.oldhasUserSize;
        chart.reflow();
    };

    if (window.matchMedia) {
        var mediaQueryList = window.matchMedia('print');
        mediaQueryList.addListener(function (mql) {
            if (mql.matches) {
                beforePrint();
            } else {
                afterPrint();
            }
        });
    }

    window.onbeforeprint = beforePrint;
    window.onafterprint = afterPrint;
}

function getFrequency(array = []){

    var keys = {};

    array.forEach( (el, i) => {

        if(keys[el] === undefined){
            keys[el] = 0;
        }

        keys[el]++;
    });

    return keys;
}

function parse(content, separator = ","){

    var parts = content.split("\n");

    var header = parts[0];
    var rows = parts.filter((v, i) => i !== 0);

    header = header.split(separator).map(v => v.trim());
    rows = rows.map(v => v.split(separator))
               .map(v => v.map(el => el.trim()));

    return {
        header: header,
        rows: rows
    }
}

function generate(content, separator){

    data = parse(content, separator);

    var $tableColumns = $('#table-columns').DataTable();

    $tableColumns.clear().draw();

    var html = '';

    data.header.forEach((el, i) => {

        $tableColumns.row.add( [
            el,
            '<input type="checkbox" id="customCheck1" checked/>',
            ''
        ] ).draw( false );

        html += `<th>${el}</th>`;
    });

    // Table Result

    var $tableResult = $('#table-result').DataTable();

    $tableResult.clear().destroy();

    $("#table-result thead").html(`<tr>${html}</tr>`);
    $("#table-result tbody").html("");

    $tableResult = $('#table-result').DataTable();

    data.rows.forEach((row, i) => {
        $tableResult.row.add(row ).draw( false );
    });
}

$(function () {

    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        alert('The File APIs are not fully supported in this browser.');
        return;
    }

    // Add global error handler
    window.onerror = function(msg, url, line, col, error) {

        if (msg) {
            showError(msg);
        }

        console.error("url", url);
        console.error("line", line);
        console.error("col", col);
        console.error(error);

        return true;
    };

    // Add the following code if you want the name of the file appear on select
    $(".custom-file-input").on("change", function() {
        var fileName = $(this).val().split("\\").pop();
        $(this).siblings(".custom-file-label").addClass("selected").html(fileName);
    });

    $("#btn-add-example").click(function() {
        $('#editor').val("Class_1, Class_2, Class_3\nAgree, Disagree, 10\nAgree, Agree, 7");
    });

    $('input[name="input-type"]').change(function(){

        if ($(this).val() === "choose-file") {
            $( "#input-choose-file" ).toggle(400);
            $( "#input-paste-textarea" ).toggle(400);
        }

        if($(this).val() === "paste-textarea"){
            $( "#input-choose-file" ).toggle(400);
            $( "#input-paste-textarea" ).toggle(400);
        }
    });

    $('#file, #encoding').change(function(){

        var encoding = $("#encoding").val();

        if (!encoding) {
            throw new Error("Encoding should not be empty");
        }

        console.log("Selected encoding", encoding);

        if (!this.files) {
            return;
        }

        var file = this.files[0];

        if (file) {

            var reader = new FileReader();

            reader.onload = function (evt) {
                document.getElementById("editor").value = evt.target.result;
            };

            reader.onerror = function (event) {
                showError("An error ocurred reading the file");
                console.log(event)
            };

            reader.readAsText(file, encoding);
        }
    });

    $("#form-input").submit(function(event){
        event.preventDefault();

        var separator = $("#separator").val();

        var content = $("#editor").val().trim();

        if (!content) {
            throw new Error("Content should not be empty");
        }

        if (!separator) {
            throw new Error("Separator should not be empty");
        }

        generate(content, separator);

        $( "#panel-input" ).hide();
        $( "#panel-data" ).show();



        return false;
    });

    $("#btn-back").click(function(){
        $( "#panel-input" ).show();
        $( "#panel-data" ).hide();
    });

    $("#btn-generate-charts").click(function(){

        if (!data) {
            throw new Error("Data should not be empty");
        }



        var columns = {};

        data.header.forEach((el, i) => {
            columns[i] = [];
        });

        data.rows.forEach((row, i) => {
            row.forEach((el, i) => {
                columns[i].push(el);
            });
        });

        $("#charts").empty();

        for (var i in columns) {

            $("#charts").append(`
                <div class="card mb-3">
                    <div class="card-body">
                        <div id="chart-${i}"></div><hr/>
                    </div>
                </div>
            `)

            chart(`chart-${i}`, data.header[i], columns[i]);
        }

        $("#modal-visualize-charts").modal("show");
    });
});
