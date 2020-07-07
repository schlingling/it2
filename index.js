var rawData = []
var countTaster = {}

window.onload = initialisiere();

function initialisiere() {
    rawData.push(d3.json("http://it2wi1.if-lab.de/rest/ft_ablauf"))
}

Promise.all(rawData).then((result) => preprocess_rawData(result), function (error) {
    console.log(error);
});



function preprocess_rawData(rawData, error) {
    if (error) {
        console.log(error);
    } else {
        console.log(rawData);

        i = 0;
        rawData[0].forEach(zeitpunkt => {
            for (const [key, val] of Object.entries(zeitpunkt.werte)) {
                if (!countTaster[key]) {
                    if (val == " true") {
                        countTaster[key] = 1
                    } else {
                        countTaster[key] = 0
                    }
                } else {
                    if ((rawData[0][i - 1].werte[key]) != val) {
                        countTaster[key] += 1
                    }
                }
            }
            i++;
        });


    }
    console.log(countTaster)
}







/*


function aktualisiere() {
    //Daten empfangen
    d3.json("http://it2wi1.if-lab.de/rest/beispiel/Parameter/Person%20B/tag/1").then(function (data, error) {
        empfangeDaten(data, error)
    });
}


function empfangeDaten(datenEmpfangen, error) {
    if (error) {
        console.log(error);
    } else {
        raw_data.push(datenEmpfangen);
    }
}


function zeigeDaten(daten) {
    //Elemente mit id „content“ sammeln und in Variable p speichern
    let p = d3.select("#content").selectAll("p").data(daten);
    //Daten hinzufuegen falls es mehr Daten als Elemente im HTML gibt.
    p.enter().append("p")
        .text(function (daten) {
            return "Uhrzeit: " + daten.datum + " Wert: " + daten.werte["Person B"];
        });
    // Daten löschen, falls es mehr Elemente im HTML als Daten gibt.
    p.exit().remove();
}

*/