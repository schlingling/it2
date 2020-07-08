

function initialisiere() {
    let rawData = []
    rawData.push(d3.json("http://it2wi1.if-lab.de/rest/ft_ablauf"));
    Promise.all(rawData).then((result) => preprocess_rawData(result), function (error) {
        console.log(error);
    });

}


function preprocess_rawData(rawData, error) {

    let countTaster = {};
    if (error) {
        console.log(error);
    } else {
        i = 0;
        rawData[0].forEach(zeitpunkt => {
            for (const [key, val] of Object.entries(zeitpunkt.werte)) {

                if (!countTaster[key]) {
                    if (val == " true") {
                        countTaster[key] = 1
                    } else if (val == " false") {
                        countTaster[key] = 0

                    } 
                } else {
                    if(valueToComulate(key)){
                        //countTaster
                    } else if ((rawData[0][i - 1].werte[key]) != val) {
                        countTaster[key] += 1
                    }
                }
            }
            i++;
        });


    }
    //console.log(countTaster),
    liste = [];

    //Listen von Modul Fischertechnik
    listeHochregalFi = ["H-vertikal", "H-horizontal", "Referenztaster horizontal", "Referenztaster vertikal", "Referenztaster Ausleger vorne", "Referenztaster Ausleger hinten", "Lichtschranke innen", "Lichtschranke aussen"];
    listeVerteilstationFi = ["V-vertikal", "V-drehen", "V-horizontal", "V-Referenzschalter vertikal", "V-Referenzschalter horizontal", "V-Referenzschalter drehen"]
    listeBearbeitungsstationFi = ["B-Motor Drehkranz im Uhrzeigersinn", "B-Motor Drehkranz gegen Uhrzeigersinn", "B-Motor Foerderband vorwaerts", "B-Motor Saege", "B-Motor Ofenschieber Einfahren", "B-Motor Ofenschieber Ausfahren", "B-Motor Sauger zum Ofen", "B-Motor Sauger zum Drehkranz", "B-Leuchte Ofen", "B-Referenzschalter Drehkranz (Pos. Sauger)", "B-Referenzschalter Drehkranz (Pos. Foerderband)", "B-Lichtschranke Ende Foerderband", "B-Referenzschalter Drehkranz (Pos. Saege)", "B-Referenzschalter Sauger (Pos. Drehkranz)", "B-Referenzschalter Ofenschieber Innen", "B-Referenzschalter Ofenschieber Aussen", "B-Referenzschalter Sauger (Pos. Brennofen)", "B-Lichtschranke Brennofen"]
    listeSortierstationFi = ["S-Lichtschranke Eingang", "S-Lichtschranke nach Farbsensor", "S-Lichtschranke weiss", "S-Lichtschranke rot", "S-Lichtschranke blau", "S-Motor Foerderband"]

    //Listen von Modul Festo
    listeFesto = ["Umsetzer Endanschlag 1 (3B1)", "Umsetzer Endanschlag 2 (3B2)"]

    for (const [key, val] of Object.entries(countTaster)) {
        liste.push({ key, val })
    }

    let mapHochregalFi = mapModule(listeHochregalFi, liste);
    let mapVerteilstationFi = mapModule(listeVerteilstationFi, liste);
    let mapBearbeitungsstationFi = mapModule(listeBearbeitungsstationFi, liste);
    let mapSortierstationFi = mapModule(listeSortierstationFi, liste);

    let mapFesto = mapModule(listeFesto, liste);

    aktualisiereListe(mapHochregalFi, "hochregallager");
    aktualisiereListe(mapVerteilstationFi, "verteilstation");
    aktualisiereListe(mapBearbeitungsstationFi, "bearbeitungsstation");
    aktualisiereListe(mapSortierstationFi, "sortierstation");

    aktualisiereListe(mapHochregalFi, "hochregallager");

    zeigeDiagram(mapHochregalFi);

}


function zeigeDiagram(liste) {

    let svg = d3.select("#hochregallagerG").append("svg")//Auf Webseite
        .attr("width", 1000)
        .attr("height", 400)
        .style("background-color", "white");

    var balken = svg.selectAll("rect").data(liste);
    balken.enter().append("rect")
        .attr("x", 100);
    balken.exit().remove();


}

function mapModule(listeModul, listeGlobal) {
    let filteredListe = listeGlobal.map(function (d, i) {
        if (listeModul.includes(d.key)) {
            return (d);
        }
    }).filter(function (x) {
        return x !== undefined;
    });
    return filteredListe;
}

function aktualisiereListe(listeModul, targetID) {

    id = "#" + targetID;

    //Rückgabe der d3.selectAll - Methode in variable p speichern.(Alle Kindelemente von content, die p- Elemente sind.) Am Anfang gibt es noch keine.
    let d = d3.select(id).selectAll("li").data(listeModul);
    //console.log(d)
    //console.log(countTaster)
    //.enter().append(): Daten hinzufuegen falls es mehr Daten als Elemente im HTML gibt.
    //geschieht hier für jede Zeile von daten.
    d.enter().append("li")
        .text(function (listeModul) {
            return listeModul.key + ": " + listeModul.val;
        });
    //.exit().remove(): Daten löschen, falls es mehr Elemente im HTML als Daten gibt.
    d.exit().remove();
    //console.log(countTaster[0])
}

function valueToComulate(key){
    
    if(key === "H-vertikal" || key === "H-horizontal" || key === "V-vertikal" || key === "V-drehen" || key === "V-horizontal"){
        console.log(key) 
        return true;
        
    } else {
           
        return false;
        
    }

}
