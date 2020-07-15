let font = "Roboto"

let colorscheme = d3.schemeCategory10 ; //schemeTableau10
//let colorscheme = d3.schemeTableau10;
//let colorscheme = d3.schemeDark2
function initialisiere() {

    // Data Picker Initialization
    let rawData = []
    rawData.push(d3.json("https://it2wi1.if-lab.de/rest/ft_ablauf"));
    Promise.all(rawData).then((data) => preprocess_rawData(data), function (error) {
        console.log(error);
    });


}

function aktualisiereSeite(data) {
    preprocess_rawData([data]);
}


function preprocess_rawData(rawData, error) {
    let valueForAmpel = ["Ampel rot", "Ampel orange", "Ampel gruen", "Ampel weiss"];


    let countdictionary = {};
    if (error) {
        console.log(error);
    }


    // addiere alle Anzahl der Statusänderungen sowie kumuliere alle wegstrecken um pro sensor ein 
    // key: name des sensors val: wert am ende der zeiteinheit (in Anzahl Statusänderungen oder kumulierte wegstrecke in cm) zu erhalten 
    i = 0;
    rawData[0].forEach(zeitpunkt => {
        for (const [key, val] of Object.entries(zeitpunkt.werte)) {
            if (!countdictionary.hasOwnProperty(key)) {//Initialisierung
                if (val == " true") {
                    countdictionary[key] = 1

                } else if (val == " false") {
                    countdictionary[key] = 0

                }
            } else {
                if (valueForAmpel.includes(key)) {
                    if (val == " true") {
                        countdictionary[key] += 1;
                    }
                } else if ((rawData[0][i - 1].werte[key]) != val) {
                    countdictionary[key] += 1
                }
            }
        }
        i++;
    });


    liste = [];

    //Liste Ampel
    listeAmpelrot = ["Ampel rot"]
    listeAmpelorange = ["Ampel orange"]
    listeAmpelgruen = ["Ampel gruen"]
    listeAmpelweiss = ["Ampel weiss"]

    //Listen von Modul Festo
    listeFesto = ["Umsetzer Endanschlag 1 (3B1)", "Umsetzer Endanschlag 2 (3B2)"]

    for (const [key, val] of Object.entries(countdictionary)) {
        liste.push({ key, val })
    }

    let mapFesto = mapModule(listeFesto, liste);//Festo
    aktualisiereListe(mapFesto, "umsetzer", undefined, true)

    //diagramme anzeigen
    zeigeDiagram(mapFesto, "umsetzerG");


    //Ampel
    let mapAmpelrot = mapModule(listeAmpelrot, liste);
    let mapAmpelorange = mapModule(listeAmpelorange, liste);
    let mapAmpelgruen = mapModule(listeAmpelgruen, liste);
    let mapAmpelweiss = mapModule(listeAmpelweiss, liste);
    //ampel anzeigen
    let gesamtAmpelZyklen = rawData[0].length;
    aktualisiereAmpel(mapAmpelrot, "lightred", gesamtAmpelZyklen);
    aktualisiereAmpel(mapAmpelorange, "lightyellow", gesamtAmpelZyklen);
    aktualisiereAmpel(mapAmpelgruen, "lightgreen", gesamtAmpelZyklen);
    aktualisiereAmpel(mapAmpelweiss, "lightwhite", gesamtAmpelZyklen);
}

function zeigeDiagram(liste, targetid) {

    let farben = d3.scaleOrdinal(colorscheme); //andere Beispiele: schemePastel2, schemeSet1  

    /*
     liste = liste.filter(function(x){
 
         if (x.val == 0){
             return false;
         }
         return true;
     });
    */
    id = "#" + targetid;
    d3.select(id).selectAll("*").remove();

    //console.log(liste)
    // set the dimensions and margins of the graph
    var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 450 - margin.left - margin.right,
        height = 350 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleBand()
        .range([0, width])
        .padding(0.7);
    var y = d3.scaleLinear()
        .range([height, 0]);
    var xachsenwerte = d3.scaleBand().range([0, width]).padding(0.5)


    let svg = d3.select(id).append("svg")//Auf Webseite
        .attr("width", width + margin.left + margin.right) //+vw
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");


    // Scale the range of the data in the domains
    x.domain(liste.map(function (d) { return d.key; }));
    y.domain([0, d3.max(liste, function (d) { return d.val; })]);

    // append the rectangles for the bar chart
    var bars = svg.selectAll(".bar").data(liste);

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) { return x(d.key); })

        .attr("width", 12)//x.bandwidth()
        .attr("y", function (d) { return y(d.val); })
        .attr("height", function (d) { return height - y(d.val); })
        .style("fill", function (sensor, iteration) {
            return farben(iteration);//ermittelt die Farbe
        });
    //.style("fill", "rgb(189, 189, 189)");

    //TODO:





    bars.exit().remove();


    //
    var balkenText = svg.selectAll(".balkentext").data(liste);

    balkenText.enter().append("text")
        .attr("class", "balkentext")
        .attr("x", -295)
        .attr("y", function (d) { return x(d.key); })
        .text(function (d) { return d.key; })

        .attr("transform", "rotate(-90)")
        .attr("font-family", font)
        .attr("font-size", "12px")
        .style("fill", "white")



    balkenText.exit().remove();

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xachsenwerte)).style("color", "white");

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y)).style("color", "white")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("dy", "0.71em")
        .attr("fill", "white")
        .text("Anzahl Statusänderungen");


}

function mapModule(listeModul, listeGlobal) {
    let filteredListe = listeGlobal.map(function (d) {
        if (listeModul.includes(d.key) || listeModul.includes(d.name)) { //name war noetig weil ich in der zweiten liste comulate name statt key verwendet habe...
            return (d);
        }
    }).filter(function (x) {
        return x !== undefined;
    });
    return filteredListe;
}

function aktualisiereListe(listeModul, targetID, einheit, pfeil) {

    let farben = d3.scaleOrdinal(colorscheme); //andere Beispiele: schemePastel2, schemeSet1  
    
    id = "#" + targetID;
    d3.select(id).selectAll("*").remove();
    //Rückgabe der d3.selectAll - Methode in variable p speichern.(Alle Kindelemente von content, die p- Elemente sind.) Am Anfang gibt es noch keine.
    let d = d3.select(id).selectAll("li").data(listeModul);
    //console.log(d)
    //console.log(countTaster)
    //.enter().append(): Daten hinzufuegen falls es mehr Daten als Elemente im HTML gibt.
    //geschieht hier für jede Zeile von daten.
    if (pfeil == true) {
        d.enter().append("li")
            .text(function (listeModul) {
                if (einheit == undefined) {
                    return listeModul.key + ": " + listeModul.val + " ";
                } else {
                    return listeModul.key + ": " + listeModul.val + einheit + " ";
                }
            }).append("text").text("<-").style("color", function (sensor, iteration) {
                return farben(iteration);//ermittelt die Farbe
            });
    } else {
        d.enter().append("li")
            .text(function (listeModul) {
                if (einheit == undefined) {
                    return listeModul.key + ": " + listeModul.val + " ";
                } else {
                    return listeModul.key + ": " + listeModul.val + einheit + " ";
                }
            })
    }

    //.exit().remove(): Daten löschen, falls es mehr Elemente im HTML als Daten gibt.
    d.exit().remove();
    //console.log(countTaster[0])
}


function aktualisiereAmpel(listeModul, targetID, gesamtAmpelZyklen) {
    id = "#" + targetID;
    d3.select(id).selectAll("*").remove();
    //Rückgabe der d3.selectAll - Methode in variable p speichern.(Alle Kindelemente von content, die p- Elemente sind.) Am Anfang gibt es noch keine.
    let d = d3.select(id).selectAll("p").data(listeModul);

    //.enter().append(): Daten hinzufuegen falls es mehr Daten als Elemente im HTML gibt.
    //geschieht hier für jede Zeile von daten.
    d.enter().append("p")
        .attr("class", "percentage")
        .text(function (listeModul) {
            return Math.round(listeModul.val / gesamtAmpelZyklen * 100) + "%";
        })
    //.exit().remove(): Daten löschen, falls es mehr Elemente im HTML als Daten gibt.
    d.exit().remove();
    //console.log(countTaster[0])
}
