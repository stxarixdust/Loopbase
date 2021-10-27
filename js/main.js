let query = {
    category:       'loops',
    keys:           '',
    order:          ['date', 'd'],
    tempo:          [0,200],
    page:           1,
    key:            ['c', ''],
    date:           0,
    genre:          0,
    filterByKey:    false
};

var searchSession = {
    tempoRange: true,
    appendContent: false,
    direction: "d"
}

var tempoSlider = new rSlider({
    target: '#tempo-range',
    values: {min: 0, max: 200},
    step: 1,
    range: searchSession.tempoRange,
    tooltip: true,
    scale: false,
    labels: false,
    set: [0, 200]
});

var loadedPreviewContent = {}

var audioPreviewPlayer = new Audio();

search();
feather.replace();

document.querySelector("#direction-toggle").firstElementChild.style.display = "none";

function toggleTempoSliderMode(){
    let min = [parseInt(tempoSlider.getValue().split(/[ ,]+/)[0]), 200];
    
    searchSession.tempoRange = !searchSession.tempoRange;

    document.getElementById("tempo-mode-toggle").innerHTML = searchSession.tempoRange ? "BPM Range" : "Single BPM"

    tempoSlider.destroy();
    tempoSlider = new rSlider({
        target: '#tempo-range',
        values: {min: 0, max: 200},
        step: 1,
        range: searchSession.tempoRange,
        tooltip: true,
        scale: false,
        labels: false,
        set: min
    });
}

function toggleKeyMode(){
    query.key[1] = (query.key[1] == "m") ? "" : "m";
    document.getElementById("key-mode-toggle").innerHTML = (query.key[1] == "m") ? "Minor Key" : "Major Key";
}

function toggleDirection(){
    if(searchSession.direction == "d"){
        searchSession.direction = "a";
        document.querySelector("#direction-toggle .feather-chevrons-down").style.display = "none";
        document.querySelector("#direction-toggle .feather-chevrons-up").style.display = "inline";
    } else {
        searchSession.direction = "d";
        document.querySelector("#direction-toggle .feather-chevrons-down").style.display = "inline";
        document.querySelector("#direction-toggle .feather-chevrons-up").style.display = "none";
    }
}

function appendResults(results){
    resultsContainer = document.querySelector("#results-contents");
    results.forEach(result => {
        html = `
        <div class='audio-result'>
            <div class='fg-layer'>
                <div class='info'>
                    <div class='pp-area' onclick='preview("`+result.mp3_url+`")' id='`+result.mp3_url+`'>
                        <img src='`+result.profile_pic+`' class='profile_picture_sample'>
                        <div class='pp-playbutton'>`+feather.icons[`play`].toSvg()+feather.icons[`pause`].toSvg()+`</div>
                    </div>
                    <div class='sample-info-txt'>
                        <div class='sample-title'>`+result.title+`</div>
                        <div class='sample-author'>`+result.author+` - `+result.tempo+` - Key: `+result.key+`</div>
                    </div>
                </div>
                <div class='actions'>`+feather.icons[`download-cloud`].toSvg()+feather.icons[`more-vertical`].toSvg()+`</div>
            </div>
            <div class='bg-layer'>
                <img src='`+result.waveform+`' class='bg-waveform'></div>
            </div>
        </div>`;
        resultsContainer.innerHTML += html;
    });
}

function search(){
    resultsContainer = document.querySelector("#results-contents");
    resultsContainer.innerHTML = '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';

    let min = parseInt(tempoSlider.getValue().split(/[ ,]+/)[0]);
    let max = searchSession.tempoRange ? parseInt(tempoSlider.getValue().split(/[ ,]+/)[1]) : min;

    query.keys = document.querySelector("#filter-search").value;
    query.tempo = [min,max];
    query.page = 1;
    query.order[0] = document.querySelector("#order").value;
    query.order[1] = searchSession.direction;
    query.date = document.querySelector("#date").value;
    query.genre = document.querySelector("#genre").value;

    ipcRenderer.invoke('search', query).then((results) => {
        resultsContainer.innerHTML = '';
        if(results.length > 0){
            appendResults(results);
            searchSession.appendContent = false;
        }
        else resultsContainer.innerHTML = '<p id="nothing-found">Nothing was found.</p>';
    });
}

function loadNewContent(){
    query.page += 1;

    ipcRenderer.invoke('search', query).then((results) => {
        resultsContainer.lastChild.remove();
        if(results.length > 0){
            searchSession.appendContent = false;
            appendResults(results);
        }
    });
}

function selectkey(key){
    document.querySelectorAll("#keys .key").forEach((el)=>{
        if(el.classList.contains("selected")) el.classList.remove("selected");
    });

    if(query.filterByKey && query.key[0] == key){
        document.querySelector('#keys #'+key).classList.remove("selected");
        query.filterByKey = false;
    } else {
        document.querySelector('#keys #'+key).classList.add("selected");
        query.filterByKey = true;
    }

    query.key[0] = key;
}

function preview(url){
    var oldUrl = audioPreviewPlayer.src;
    if(url != oldUrl){
        audioPreviewPlayer.pause();
        if(oldUrl != ""){
            document.getElementById(oldUrl).querySelector(".feather-pause").style.display = "none";
            document.getElementById(oldUrl).querySelector(".feather-play").style.display = "block";
        }
        document.getElementById(url).querySelector(".feather-pause").style.display = "block";
        document.getElementById(url).querySelector(".feather-play").style.display = "none";
        audioPreviewPlayer = new Audio(url);
        audioPreviewPlayer.play();
        document.getElementById(url);
    }else{
        if(audioPreviewPlayer.paused){
            audioPreviewPlayer.play();
        }else{
            document.getElementById(url).querySelector(".feather-pause").style.display = "none";
            document.getElementById(url).querySelector(".feather-play").style.display = "block";
            audioPreviewPlayer.pause();
        }
    }
}

var r = document.querySelector("#results");

r.onscroll = (ev) => {
    resultsContainer = document.querySelector("#results-contents");
    if (Math.ceil(r.scrollTop + r.clientHeight) >= r.scrollHeight - 200
    && !resultsContainer.lastElementChild.classList.contains("lds-ellipsis")) {
        if(!searchSession.appendContent){
            searchSession.appendContent = true;
            resultsContainer.innerHTML += '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
            loadNewContent();
        }
    }
};