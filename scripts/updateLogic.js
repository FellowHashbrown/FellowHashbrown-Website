function updateSimplified() {
    
    expression = document.forms.simplification_form.expression.value;

    $.ajax({
        url: "https://www.fellowhashbrown.com/api/logic",
        type: "GET",
        data: {
            expression: expression,
            simplify: "true",
            ignoreError: "true"
        }
    }).done(function(data) {
        document.forms.simplification_form.simplified_minterm.value = data.value.minterm;
        document.forms.simplification_form.simplified_maxterm.value = data.value.maxterm;
    }).fail(function() {
        document.forms.simplification_form.simplified_minterm.value = "";
        document.forms.simplification_form.simplified_maxterm.value = "";
    });
}



function updateTruthTable() {
    expression = document.forms.simplification_form.expression.value;

    $.ajax({
        url: "https://www.fellowhashbrown.com/api/logic",
        type: "GET",
        data: {
            expression: expression,
            table: "true",
            ignoreError: "true"
        }
    }).done(function(data) {
        var table = "";
        for (const line of data.value) {
            table += line + "\n";
        }
        document.forms.simplification_form.truth_table.value = table;
    }).fail(function() {
        document.forms.simplification_form.truth_table.value = "";
    });
}