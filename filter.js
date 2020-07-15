function test (){
    alert("hallo");
}

function prepareDate() {
    
    let baseUrl = "https://it2wi1.if-lab.de/rest/ft_ablauf";

   
    let datumStringFrom = d3.select("#filterfrom").node().value;
    let datumStringTo = d3.select("#filterto").node().value;

    //Transformation des Inputs - Methode in main.js
    let datumFrom = transformiereDatumInParameter(datumStringFrom);
    let datumTo = transformiereDatumInParameter(datumStringTo);

    //Abfrage-URL vorbereiten
    ////for (parameterKey in datumFrom) {
    //    url += createUrlSubString(parameterKey, datumFrom[parameterKey]);
   // }
    //Abfrage durchführen und Ergebnisse in angegebener Methode "empfangeDaten" (als Callback) verarbeiten
    if (datumStringFrom !== "") {
        d3.json("https://it2wi1.if-lab.de/rest/ft_ablauf").then(function(daten, error){
            empfangeDaten(daten, datumStringFrom, datumStringTo, error)
        })
    }else{
        alert("Bitte ein Datum auswählen.");
    }

}


function empfangeDaten(daten, datumFrom, datumTo, error) {
    if (error) {
        console.error(error);
        return;
    }
    
    let datenTransformiert = transformiereDaten(daten, datumFrom,datumTo);
    aktualisiereSeite(datenTransformiert);
}

function transformiereDaten(datenJson,datumFrom, datumTo) {
    //Es wird nur ein Ergebnis erwartet
    let ergebnis = new Array();


    let secsFrom =Date.parse(datumFrom);
    let secsTo =Date.parse(datumTo);

    datenJson = datenJson.filter(function(row){
        let datumString = row.datum
        let jahr= datumString.slice(6,10);
        let  monat = datumString.slice(3,5);
        let  tag = datumString.slice(0,2);
        let  stunde = datumString.slice(11,13);
        let  min = datumString.slice(14,16);
        let  sec = datumString.slice(17,19);
        
        let newString=jahr+'-'+monat+'-'+tag+'T'+stunde+':'+min;
        let secsAct = Date.parse(newString);
        if (secsAct <= secsTo && secsAct >= secsFrom){
            return true;
        }else{
            return false;
        }
    });


   // gewaehltePerson = d3.select("#personenDropdown").node().value;

   // let gewicht = new Gewicht(gewaehltePerson, parseFloatAusStringMitKomma(datensatz.werte[gewaehltePerson]), datensatz.datum);
   // ergebnis.push(gewicht);
   // return ergebnis;

   return datenJson;
}


function createUrlSubString(parameter, wert) {
    return "/" + parameter + "/" + wert;
}

function transformiereDatumInParameter(datumString) {
    let kurzesDatum = false;
    if (datumString.length <= 10) {
        kurzesDatum = true;
    }
    let parameter = new Object();
    let datum = new Date(datumString.replace(/-/g, '/').replace('T', ' '));//Notwendig, damit lokale Zeitzone genommen wird
    parameter["jahr"] = datum.getFullYear();
    parameter["monat"] = datum.getMonth() + 1;//Monate beginnen bei Date mit 0
    parameter["tag"] = datum.getDate();
    if (!kurzesDatum) {
        parameter["stunde"] = datum.getHours();
        parameter["minute"] = datum.getMinutes();
        parameter["sekunde"] = datum.getSeconds();
    }
    return parameter;
}

function parseFloatAusStringMitKomma(floatStringMitKomma) {
    return parseFloat(floatStringMitKomma.replace(",", "."));
}

function filter(data){

}
