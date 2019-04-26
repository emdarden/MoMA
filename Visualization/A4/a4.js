
d3.csv("http://localhost:8080/artists.csv")
.then(artists => { 
    d3.csv("http://localhost:8080/artworks.csv")
    .then(artworks => { 
        artworks.forEach(function(artwork) {
            var result = artists.filter(function(artist) {
                return artist["Artist ID"] === artwork["Artist ID"];
            });
            artwork["Nationality"] = (result[0] !== undefined) ? result[0].Nationality : null;
            artwork["Gender"] = (result[0] !== undefined) ? result[0].Gender : null;
        });

        return artworks
    }).then((artworks) => {
        //add onclick method here
        document.getElementById("gobtn").addEventListener("click", function(event){
            
            var natInput = document.getElementById("nationality");
            var selectedNat = natInput.options[natInput.selectedIndex].text;

            var genderInput = document.getElementById("gender");
            var selectedGender = genderInput.options[genderInput.selectedIndex].text;

            var mediumInput = document.getElementById("medium");
            var selectedMedium = mediumInput.options[mediumInput.selectedIndex].text;

            var input = {nationality: selectedNat, gender: selectedGender, medium: selectedMedium};

            var data = filterData(input, artworks);


            createViz(data)
            console.log(data);
            createBar(data)
    
        })

        document.getElementById("wordCloud").addEventListener("click", function(event){
            document.getElementById("svg1").style.visibility = "hidden";

            document.getElementById("svg2").style.visibility = "visible";
        })

        document.getElementById("barChart").addEventListener("click", function(event){
            document.getElementById("svg1").style.visibility = "visible";

            document.getElementById("svg2").style.visibility = "hidden";
        })

        console.log("ready");
    });
 });

function createViz(data){
    var svg = document.getElementById("svg2");

    removeChildren(svg);

    var fill = d3.scaleOrdinal(d3.schemeCategory10);

    var nums = getNums(data);

    var max = Math.max(...nums);
    var min = Math.min(...nums);

    var scaleFont = d3.scaleLog()
    .domain([min, max])
    .range([10, 150])

    var scaleFontLinear = d3.scaleLinear()
    .domain([min, max])
    .range([10, 150])

    var wordCloud = d3.layout.cloud()
        .size([1000, 1000])
        .words(data)
        .fontSize(d => scaleFont(d.num))
        .rotate(() => Math.round(Math.random()) * -90)
        .padding(1)
        .font("Impact")
        //.font("Futura")
        .text(d => getLastName(d.artist))
        .on("end", draw);
    
    wordCloud.start();

    function draw(words){
        //console.log(words)

        d3.select("#svg2").append("g")
            .attr("transform", "translate(" + wordCloud.size()[0] / 2 + "," + wordCloud.size()[1] / 2 + ")")
            .selectAll("text")
            .data(words)
            .enter().append("text")
            .style("font-size", d => d.size)
            .style("font-family", "Impact")
            //.style("font-family", "Futura")
            .style("fill", function(d, i) { return fill(i); })
            .attr("class", "text")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(d => d.text)
            .append("svg2:title")
            .text(function(d) { return d.artist + ": " + d.num; });
    }

   function getLastName(artist){
       var name = artist.split(" ");

       return name[name.length-1]
   }

}

function createBar(data){
    var svg = document.getElementById("svg1");

    removeChildren(svg);
    var nums = getNums(data);

    var max = Math.max(...nums);
    var min = Math.min(...nums);

    var xBand = d3.scaleBand()
                .domain(data.map(d => d.artist))
                .range([100, 1050])
                .paddingInner(0.1);

    var yScale = d3.scaleLinear()
                .domain([0, max])
                .range([900, 50]);
    
    d3.select("#svg1").selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("width", xBand.bandwidth())
      .attr("height", d => 900 - yScale(d.num) + "px")
      .attr("x", d => xBand(d.artist) + "px")
      .attr("y", d => yScale(d.num) + "px")
      .attr("fill", "#3A77AF");
    d3.select("#svg1").append("g")
      .attr("transform", "translate(0, 900)")
      .call(d3.axisBottom(xBand))
      .selectAll("text")
      .attr("y", 0)
      .attr("x", 9)
      .attr("transform", "rotate(90)")
      .style("text-anchor", "start");
    d3.select("#svg1").append("g")
      .attr("transform", "translate(100,0)")
      .call(d3.axisLeft(yScale));
}

function filterData(input, data){
    var nationality = input.nationality;
    var gender = input.gender;
    var medium = input.medium;
    var artists = [];
    var freq_list = [];
    var res = [];

    if(nationality === "All" && gender === "Both" && medium === "All"){
        res = data;
    } else {
        res = data.filter((artwork) => {
        return (filterNationality(artwork, nationality) && filterGender(artwork, gender) && filterMedium(artwork, medium))
            
        })
    }


    res.forEach((artwork) => {
        if(!artists.includes(artwork.Name)){
            artists.push(artwork.Name);
        }
    })

    artists.forEach((artist) => {
        var num = 0;
        res.forEach((artwork) => {
            if(artwork.Name === artist){
                num++;
            }
        })

        freq_list.push({artist, num});

    })

    function compare(a,b){
        if(a.num < b.num){
            return 1;
        } else if(a.num > b.num){
            return -1;
        } else {
            return 0;
        }
    }

    
    return freq_list.sort(compare).slice(0,100);
}
function filterNationality(artwork, nationality){
    if(artwork.Nationality === nationality){
        return true;
    } else if(nationality === "All"){
        return true;
    } else {
        return false;
    }
    
}

function filterGender(artwork, gender){
    if(artwork.Gender === gender){
        return true;
    } else if(gender === "Both"){
        return true;
    } else {
        return false;
    }
}
function filterMedium(artwork, medium){

    if(medium === "video/film"){
        if(artwork.Medium.toLowerCase().includes("video") || artwork.Medium.toLowerCase().includes("film")){
            return true
        }
    } else if(medium === "photography"){
        if(artwork.Medium.toLowerCase().includes("print")){
            return true;
        }
    
    }else if(artwork.Medium.toLowerCase().includes(medium)){
        return true
    } else if(medium === "All") {
        return true;
    } else {
        return false
    }
}

function removeChildren(el) {
    while(el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

function getNums(data){
    return data.map(i => i.num)

}