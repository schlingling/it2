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
    let valueToComulate = ["H-vertikal", "H-horizontal", "V-vertikal", "V-drehen", "V-horizontal"];
    let valueForAmpel = ["Ampel rot", "Ampel orange", "Ampel gruen", "Ampel weiss"];

    let valueOfenBearbeitung = ["B-Motor Drehkranz im Uhrzeigersinn", "B-Motor Drehkranz gegen Uhrzeigersinn"];
    let valueOfenRausRein = ["B-Motor Ofenschieber Einfahren", "B-Motor Ofenschieber Ausfahren"];


    let valueToCountOnTime = ["B-Motor Saege", "B-Motor Sauger zum Ofen", "B-Motor Sauger zum Drehkranz", "B-Motor Foerderband vorwaerts", "S-Motor Foerderband"]; // Bearbeitungsstation motoren sowie fliessbaender


    let countdictionary = {};
    if (error) {
        console.log(error);
    }


    let cumulatedValueOverTime = cumulatedValue(rawData, valueToComulate);

    let cumulatedOfenBearbeitungOverTime = cumulatedValueBoolean(rawData, valueOfenBearbeitung, 19.1);
    let cumulatedOfenSchieberOverTime = cumulatedValueBoolean(rawData, valueOfenRausRein, 5)

    cumulatedOfenBearbeitungOverTime = mergecumulatedValueOfen(cumulatedOfenBearbeitungOverTime, ["B-Motor Drehkranz im Uhrzeigersinn", "B-Motor Drehkranz gegen Uhrzeigersinn"], "B-Motor Drehkranz Bearbeitung");
    cumulatedOfenschieberOverTime = mergecumulatedValueOfen(cumulatedOfenSchieberOverTime, ["B-Motor Ofenschieber Einfahren", "B-Motor Ofenschieber Ausfahren"], "B-Motor Ofenschieber RausRein");

    let bereinigte_cumulatedValueOverTime = bereinigeKumulierteWegstreckenachEinheit(cumulatedValueOverTime, "H-horizontal", 78.6) // in cm// dict, name des sensors, teiler (1cm entspricht teiler), einheit
    bereinigte_cumulatedValueOverTime = bereinigeKumulierteWegstreckenachEinheit(bereinigte_cumulatedValueOverTime, "H-vertikal", 78.8) // in cm
    bereinigte_cumulatedValueOverTime = bereinigeKumulierteWegstreckenachEinheit(bereinigte_cumulatedValueOverTime, "V-vertikal", 78.2) // in cm
    bereinigte_cumulatedValueOverTime = bereinigeKumulierteWegstreckenachEinheit(bereinigte_cumulatedValueOverTime, "V-drehen", 2264) // in Anzahl Umdrehungen
    bereinigte_cumulatedValueOverTime = bereinigeKumulierteWegstreckenachEinheit(bereinigte_cumulatedValueOverTime, "V-horizontal", 67) // in Anzahl Umdrehungen

    bereinigte_cumulatedValueOverTime = d3.merge([bereinigte_cumulatedValueOverTime, cumulatedOfenBearbeitungOverTime]);
    bereinigte_cumulatedValueOverTime = d3.merge([bereinigte_cumulatedValueOverTime, cumulatedOfenschieberOverTime]);

    //console.log(cumulatedValueOverTime)
    //console.log(bereinigte_cumulatedValueOverTime);


    // addiere alle Anzahl der Statusänderungen sowie kumuliere alle wegstrecken um pro sensor ein 
    // key: name des sensors val: wert am ende der zeiteinheit (in Anzahl Statusänderungen oder kumulierte wegstrecke in cm) zu erhalten 
    i = 0;
    rawData[0].forEach(zeitpunkt => {
        for (const [key, val] of Object.entries(zeitpunkt.werte)) {
            if (!countdictionary.hasOwnProperty(key)) {//Initialisierung
                if (valueOfenRausRein.includes(key)) {
                    if (val == " true") {
                        countdictionary["B-Motor Ofenschieber RausRein"] = 5; //in CM

                    } else if (val == " false") {
                        countdictionary["B-Motor Ofenschieber RausRein"] = 0;
                    }
                    countdictionary["B-Motor Ofenschieber Einfahren"] = -1; //verwendet um initialisierung der neuen variable raus rein anzuzeigen
                    countdictionary["B-Motor Ofenschieber Ausfahren"] = -1; //verwendet um initialisierung der neuen variable raus rein anzuzeigen
                } else if (valueOfenBearbeitung.includes(key)) {
                    if (val == " true") {
                        countdictionary["B-Motor Drehkranz Bearbeitung"] = 19.1; //in CM
                    } else if (val == " false") {
                        countdictionary["B-Motor Drehkranz Bearbeitung"] = 0;
                    }
                    countdictionary["B-Motor Drehkranz im Uhrzeigersinn"] = -1;//verwendet um initialisierung der neuen variable raus rein anzuzeigen
                    countdictionary["B-Motor Drehkranz gegen Uhrzeigersinn"] = -1;//verwendet um initialisierung der neuen variable raus rein anzuzeigen

                } else if (valueToCountOnTime.includes(key)) {
                    if (val == " true") {
                        countdictionary[key] = 1
                    } else {
                        countdictionary[key] = 0
                    }
                } else if (val == " true") {
                    countdictionary[key] = 1

                } else if (val == " false") {
                    countdictionary[key] = 0

                }
            } else {
                if (valueForAmpel.includes(key)) {
                    if (val == " true") {
                        countdictionary[key] += 1;
                    }
                } else if (valueOfenRausRein.includes(key)) {// Ofen raus rein
                    if (val == " true") {
                        countdictionary["B-Motor Ofenschieber RausRein"] = Math.round((parseFloat(countdictionary["B-Motor Ofenschieber RausRein"]) + 5), 1); //in CM
                    }
                } else if (valueOfenBearbeitung.includes(key)) {// Ofen Bearbeitung
                    if (val == " true") {
                        countdictionary["B-Motor Drehkranz Bearbeitung"] = Math.round((parseFloat(countdictionary["B-Motor Drehkranz Bearbeitung"]) + 19.1), 1);// in CM
                    }
                } else if (valueToCountOnTime.includes(key)) {
                    if (val == " true") {
                        countdictionary[key] += 1
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

    //Listen von Modul Fischertechnik
    listeHochregalFi = ["Referenztaster horizontal", "Referenztaster vertikal", "Referenztaster Ausleger vorne", "Referenztaster Ausleger hinten", "Lichtschranke innen", "Lichtschranke aussen"];
    listeVerteilstationFi = ["V-Referenzschalter vertikal", "V-Referenzschalter horizontal", "V-Referenzschalter drehen"]
    listeBearbeitungsstationFi = ["B-Leuchte Ofen", "B-Referenzschalter Drehkranz (Pos. Sauger)", "B-Referenzschalter Drehkranz (Pos. Foerderband)", "B-Lichtschranke Ende Foerderband", "B-Referenzschalter Drehkranz (Pos. Saege)", "B-Referenzschalter Sauger (Pos. Drehkranz)", "B-Referenzschalter Ofenschieber Innen", "B-Referenzschalter Ofenschieber Aussen", "B-Referenzschalter Sauger (Pos. Brennofen)", "B-Lichtschranke Brennofen"]
    listeSortierstationFi = ["S-Lichtschranke Eingang", "S-Lichtschranke nach Farbsensor", "S-Lichtschranke weiss", "S-Lichtschranke rot", "S-Lichtschranke blau"]
    //kumulierte wegstrecke
    listeComulateHochregallager = ["H-vertikal", "H-horizontal"];
    listeComulateVerteilstation = ["V-vertikal", "V-horizontal"];
    listeUmdrehungenVerteilstation = ["V-drehen"];

    listeOfenBearbeitungUndRausRein = ["B-Motor Drehkranz Bearbeitung", "B-Motor Ofenschieber RausRein"];

    //Motorenlaufzeit
    listeToCountOnTimeBearbeitungsstation = ["B-Motor Saege", "B-Motor Sauger zum Ofen", "B-Motor Sauger zum Drehkranz", "B-Motor Foerderband vorwaerts"]; // Bearbeitungsstation motoren sowie fliessbaender
    listeToCountOnTimeSortierstation = ["S-Motor Foerderband"];

    //Listen von Modul Festo
    listeFesto = ["Umsetzer Endanschlag 1 (3B1)", "Umsetzer Endanschlag 2 (3B2)"]

    for (const [key, val] of Object.entries(countdictionary)) {
        liste.push({ key, val })
    }

    let mapHochregalFi = mapModule(listeHochregalFi, liste);//Fischertechnik
    let mapVerteilstationFi = mapModule(listeVerteilstationFi, liste);
    let mapBearbeitungsstationFi = mapModule(listeBearbeitungsstationFi, liste);
    let mapSortierstationFi = mapModule(listeSortierstationFi, liste);
    let mapFesto = mapModule(listeFesto, liste);//Festo

    //textuelleaenderungen  anzeigen
    aktualisiereListe(mapHochregalFi, "hochregallager", undefined, true);
    aktualisiereListe(mapVerteilstationFi, "verteilstation", undefined, true);
    aktualisiereListe(mapBearbeitungsstationFi, "bearbeitungsstation", undefined, true);
    aktualisiereListe(mapSortierstationFi, "sortierstation", undefined, true);
    //diagramme anzeigen
    zeigeDiagram(mapHochregalFi, "hochregallagerG");
    zeigeDiagram(mapVerteilstationFi, "verteilstationG");
    zeigeDiagram(mapBearbeitungsstationFi, "bearbeitungsstationG");
    zeigeDiagram(mapSortierstationFi, "sortierstationG");


    let wegstreckenG = bereinigte_cumulatedValueOverTime.filter(function (x) {
        if (x.name == "V-drehen") {
            return false;
        }
        return true;
    })

    //console.log(wegstreckenG);
    zeigeLinePlot(wegstreckenG);



    //console.log(bereinigte_cumulatedValueOverTime)
    //kumulierte wegstrecken und umdrehungen teile die sensoren nach modulen auf
    let mapHochregalWegstrecken = mapModule(listeComulateHochregallager, bereinigte_cumulatedValueOverTime);
    let mapVerteilstationWegstrecken = mapModule(listeComulateVerteilstation, bereinigte_cumulatedValueOverTime);
    let mapVerteilstationUmdrehungen = mapModule(listeUmdrehungenVerteilstation, bereinigte_cumulatedValueOverTime);
    let mapOfenBearbeitungUndRausReinWegstrecke = mapModule(listeOfenBearbeitungUndRausRein, bereinigte_cumulatedValueOverTime);






    //console.log(bereinigte_cumulatedValueOverTime)
    //console.log(mapHochregalWegstrecken)
    //aktualisiere textuelle anzeige der kumulierten wegstrecken und umdrehungen
    aktualisiereListeComulate(mapHochregalWegstrecken, "hochregallager_comulate", "cm")
    aktualisiereListeComulate(mapVerteilstationWegstrecken, "verteilstation_comulate", "cm")
    aktualisiereListeComulate(mapVerteilstationUmdrehungen, "verteilstation_umdrehungen_schwenkarm", "Umdrehungen")
    aktualisiereListeComulate(mapOfenBearbeitungUndRausReinWegstrecke, "bearbeitungsstation_cumulate", " cm")

    //motorenlaufzeit
    let mapBearbeitungsstationMotorenlaufzeit = mapModule(listeToCountOnTimeBearbeitungsstation, liste);
    let mapSortierstationMotorenlaufzeit = mapModule(listeToCountOnTimeSortierstation, liste);

    aktualisiereListe(mapBearbeitungsstationMotorenlaufzeit, "bearbeitungsstation_motorenlaufzeit", " sek", undefined, false)
    aktualisiereListe(mapSortierstationMotorenlaufzeit, "sortierstation_motorenlaufzeit", " sek", undefined, false)

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


function cumulatedValue(rawData, valueToLookAt) {
    //cumulatedDistanceOverTime ist ein dictionary mit key: name des sensors val: wiederum dictionary mit datum: .... wert: kumulierte wegstrecke bis dahin
    let cumulatedValueOverTime = valueToLookAt.map(function (key) { // fuer jeden sensor der zu kumulierende wegstrecken beinhaltet do
        let currentValue = 0;// variable zum zwischenspeicher der bisherigen kumulierten wegstrecke für diesen key
        return {
            name: key,
            werte: rawData[0].map(function (data) {
                currentValue += parseInt(data.werte[key]);
                return { datum: data.datum, wert: currentValue };
            })
        }
    });
    return cumulatedValueOverTime;
}

//gleiche funktion nur für boolean
function cumulatedValueBoolean(rawData, valueToLookAt, Aenderung) {
    //cumulatedDistanceOverTime ist ein dictionary mit key: name des sensors val: wiederum dictionary mit datum: .... wert: kumulierte wegstrecke bis dahin
    let cumulatedValueOverTime = valueToLookAt.map(function (key) { // fuer jeden sensor der zu kumulierende wegstrecken beinhaltet do
        let currentValue = 0;// variable zum zwischenspeicher der bisherigen kumulierten wegstrecke für diesen key
        return {
            name: key,
            werte: rawData[0].map(function (data) {
                if (data.werte[key] == " true") {
                    currentValue = Math.round(currentValue + Aenderung, 1);
                }
                return { datum: data.datum, wert: currentValue };
            })
        }
    });
    return cumulatedValueOverTime;
}

function mergecumulatedValueOfen(cumulatedOfenBearbeitungOverTime, valuesToMerge, finalkey) {
    let mergedcumulatedValueOverTime = [berechne()]

    function berechne() { // fuer jeden sensor der zu kumulierende wegstrecken beinhaltet do
        i = -1;
        return {
            name: finalkey,
            werte: cumulatedOfenBearbeitungOverTime[0].werte.map(function (data) {
                i++;
                return { datum: data.datum, wert: data.wert + cumulatedOfenBearbeitungOverTime[1].werte[i].wert };
            })
        }
    };

    //mergedcumulatedValueOverTime
    return mergedcumulatedValueOverTime;
}



function bereinigeKumulierteWegstreckenachEinheit(cumulatedValueOverTime, nameDesSensors, teiler) {
    let bereinigte_CumulatedValueOverTime = cumulatedValueOverTime.map(function (datarow) {
        if (datarow.name == nameDesSensors) {
            return {
                name: datarow.name,
                werte: datarow.werte.map(function (data) {
                    return { datum: data.datum, wert: Math.round((parseInt(data.wert) / teiler), 1) };// rundet auf 1 nachkommastelle den neuen wert genau
                })
            }
        } else {
            return datarow;
        }
    });
    return bereinigte_CumulatedValueOverTime;
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
        width = 400 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

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
        .style("fill", function (person, iteration) {
            return farben(iteration);//ermittelt die Farbe
        });
    //.style("fill", "rgb(189, 189, 189)");

    //TODO:





    bars.exit().remove();


    //
    var balkenText = svg.selectAll(".balkentext").data(liste);

    balkenText.enter().append("text")
        .attr("class", "balkentext")
        .attr("x", -250)
        .attr("y", function (d) { return x(d.key); })
        .text(function (d) { return d.key; })

        .attr("transform", "rotate(-90)")
        .attr("font-family", "sans-serif")
        .attr("font-size", "12px")
        .style("fill", "white")



    balkenText.exit().remove();

    // add the x Axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xachsenwerte)).style("color", "white");

    // add the y Axis
    svg.append("g")
        .call(d3.axisLeft(y)).style("color", "white");


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

function aktualisiereListeComulate(listeModul, targetID, einheit) {

    let farben = d3.scaleOrdinal(colorscheme); //andere Beispiele: schemePastel2, schemeSet1  

    id = "#" + targetID;
    //Rückgabe der d3.selectAll - Methode in variable p speichern.(Alle Kindelemente von content, die p- Elemente sind.) Am Anfang gibt es noch keine.
    d3.select(id).selectAll("*").remove();
    let d = d3.select(id).selectAll("li").data(listeModul);
    //console.log(d)
    //console.log(countTaster)
    //.enter().append(): Daten hinzufuegen falls es mehr Daten als Elemente im HTML gibt.
    //geschieht hier für jede Zeile von daten.
    d.enter().append("li")
        .text(function (listeModul) {
            return listeModul.name + ": " + listeModul.werte[listeModul.werte.length - 1].wert + " " + einheit;
        })
    //.exit().remove(): Daten löschen, falls es mehr Elemente im HTML als Daten gibt.
    d.exit().remove();
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
            }).append("text").text("<-").style("color", function (person, iteration) {
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



function zeigeLinePlot(sensorDaten) {


    let width;
    let heigh;
    let margin;
    let zeichenflaeche;
    let x;
    let y;
    let farben;
    let linienFunktion;
    let parseTime = d3.timeParse("%d.%m.%Y %H:%M:%S");

    //Inhalt
    d3.select("#kummulierteWegStreckeG").selectAll("*").remove()

    svg = d3.select("#kummulierteWegStreckeG").append("svg")//Auf Webseite
        .attr("width", 400)
        .attr("height", 500)


    //Statische Felder
    //svg = d3.select("svg");
    margin = { top: 20, right: 80, bottom: 30, left: 50 };
    width = svg.attr("width") - margin.left - margin.right;
    height = svg.attr("height") - margin.top - margin.bottom;
    zeichenflaeche = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //Definition der Achstypen und Größe
    x = d3.scaleTime().range([0, width]);
    y = d3.scaleLinear().range([height, 0]);
    farben = d3.scaleOrdinal(colorscheme); //andere Beispiele: schemePastel2, schemeSet1  

    //Linienfunktion
    linienFunktion = d3.line()
        .curve(d3.curveLinear) //andere Beispiele: curveBasis, curveStep, curveNatural
        .x(function (d) {
            return x(parseTime(d.datum));//X-Koordinate
        })
        .y(function (d) {
            return y(d.wert);//Y-Koordinate
        });



    //Wertebereich X-Achse
    x.domain(d3.extent(sensorDaten[0].werte, function (sensorWert) {
        return parseTime(sensorWert.datum);
    }));

    //Wertebereich Y-Achse
    let minimum = d3.min(sensorDaten, function (sensor) {
        return d3.min(sensor.werte, function (sensorWerte) {
            return sensorWerte.wert;
        });
    });
    let maximum = d3.max(sensorDaten, function (sensor) {
        return d3.max(sensor.werte, function (sensorWerte) {
            return sensorWerte.wert;
        });
    });


    //console.log(minimum)
    //console.log(maximum)
    y.domain([minimum, maximum]);


    //Entfernen von alten Graphdaten
    zeichenflaeche.selectAll(".axis").remove();
    zeichenflaeche.selectAll(".person").remove();

    //X-Achse zeichnen
    zeichenflaeche.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x)).style("color", "white")
        .append("text")
        .attr("x", width)
        .attr("dx", "-1em")
        .attr("dy", "-0.21em")
        .attr("fill", "white")
        .text("Zeit");

    //Y-Achse zeichnen
    zeichenflaeche.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y)).style("color", "white")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("fill", "white")
        .text("Wegstrecke in cm");

    //Personen Linien zeichnen
    var personLinien = zeichenflaeche.selectAll(".person")
        .data(sensorDaten).enter().append("g")
        .attr("class", "person");

    personLinien.append("path")
        .attr("class", "line")
        .attr("d", function (person) {
            return linienFunktion(person.werte);
        })
        .attr("fill", "none")
        .attr("stroke-width", "1.5")
        .style("stroke", function (person, iteration) {
            return farben(iteration);//ermittelt die Farbe
        });

    //Liniennamen zeichnen
    personLinien.append("text")
        .datum(function (person) {
            return {
                personenName: person.name,
                personenWert: person.werte[person.werte.length - 1]
            };
        })
        .attr("transform", function (dataVonDatum) { return "translate(" + x(parseTime(dataVonDatum.personenWert.datum)) + "," + y(dataVonDatum.personenWert.wert) + ")"; })
        .attr("x", 3)
        .attr("dy", "0.35em")
        .style("font", "10px sans-serif")
        .style("fill", "white")
        .text(function (dataVonDatum) { return dataVonDatum.personenName; });

}
