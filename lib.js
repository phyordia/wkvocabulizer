

function refresh_wkkey_cookie(){

    // console.log("need to fix refresh_wkkey_cookie")

    function setCookie(cname, cvalue, exdays) {
        Cookies.set(cname, cvalue, { expires: exdays })
      }

    function getCookie(cname) {
        return Cookies.get(cname)
      }

    let wkkey_cookie = getCookie("wkkey");
    let wkkey_cur = $("#wk-key").val()

    //   console.log(wkkey_cookie, wkkey_cur)

    // There's a new key in the input field
    if(wkkey_cur!=="" && wkkey_cur!==wkkey_cookie){
        // console.log("setting cookie")
        setCookie("wkkey", wkkey_cur, 365); // update cookie
        return wkkey_cur
    }

    // There's a cookie set, get it.
    if (wkkey_cur==="" && wkkey_cookie!==""){
        // console.log("retrieving cookie")
        $("#wk-key").val(wkkey_cookie)  
        return wkkey_cookie 
    }

    return undefined

}

function get_user_info(wkkey){
    $.ajax({
        url: 'https://api.wanikani.com/v2/user',
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer '+wkkey);
        },
        data: {},
        success: function (resp) { 
            // console.log(resp)
            var html = `
            <div class='col-md-12 mt-3'>
                <a target='_blank' href='${resp.data.profile_url}'>${resp.data.username}</a> Level ${resp.data.level}
            </div>
            
            
            <div class='col-md-12 mt-3'>
                <h3>Options</h3>
                    <label for="amount">Level range:</label>
                    <input type="text" id="amount" readonly style="border:0; font-weight:bold;">    
                    
                    <div class='mt-3' id="slider-range"></div>
            
            </div>

            <div class='row col-md-12 mt-3'>
                <div class='col-md-4'>
                    <div class="checkbox">
                    <label>
                    <input type="checkbox" id="shuffle-sentences">Shuffle Sentences
                    </label>
                    </div>
                    
                </div>
                <div class='col-md-4'>
                    <div class="checkbox">
                    <label>
                    <input type="checkbox" id="highlight-exp" checked>Highlight Expressions
                    </label>
                    </div>
                    <div class="checkbox">
                        <label>
                        <input type="checkbox" id="hide-readings">Hide Readings
                        </label>
                    </div>
                </div>
                <div class='col-md-4 row'>
                    <div class='col-md-12'>Hide:</div>
                    <div class='col-md-4'>
                    Japanese
                    </div>
                    <div class='col-md-3'>
                        <div class="tri-state-toggle">
                            <input class="button tri-state-input" type="radio" name="toggle" id="tristate-1" />
                            <input class="button tri-state-input" type="radio" name="toggle" id="tristate-2" />
                            <input class="button tri-state-input" type="radio" name="toggle" id="tristate-3" />
                        </div>
                    </div>
                    <div class='col-md-4'>
                    English
                    </div>
                    
                </div>
            </div>


            <div class='col-md-4'>
                
                
            </div>
            <div class='col-md-12'>
                <button id="get-sentences-btn" class="btn btn-primary">Get Sentences</button>
            </div>
            `

            $("#user-info-area").html(html)

            $("#get-sentences-btn").click(()=>{
                get_sentences(wkkey);
            });

            var buttons = document.getElementsByClassName("tri-state-input");
            var arr = [...buttons];

            arr.forEach((element, index) => {
            element.addEventListener("click", () => {
                element.style.opacity = "1";

                if (index == 0) {
                    // console.log("Hide Japanese")
                    $(".ja-text").addClass('invisible')
                    $(".en-text").removeClass('invisible')
                  } else if (index == 1) {
                    // console.log("show both")
                    $(".ja-text").removeClass('invisible')
                    $(".en-text").removeClass('invisible')
                    
                  } else {
                    // console.log("Hide English")
                    $(".ja-text").removeClass('invisible')
                    $(".en-text").addClass('invisible')
                  }
            
                arr.filter(function (item) {
                    return item != element;
                })
                .forEach((item) => {
                    item.style.opacity = "0";
                });
            });
            });



            $("#hide-readings").change(function() {
                if(this.checked) {
                    $(".vocab-reading").addClass('invisible')
                } else {
                    $(".vocab-reading").removeClass('invisible')
                }
            });



            $("#highlight-exp").change(function() {
                if(this.checked) {
                    $(".vocab-sentence").addClass('highlight-kanji')
                } else {
                    $(".vocab-sentence").removeClass('highlight-kanji')
                }
            });

            $( "#slider-range" ).slider({
                range: true,
                min: 1,
                max: 60,
                values: [ 1, resp.data.level ],
                slide: function( event, ui ) {
                  $( "#amount" ).val( + ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                }
              });
              $( "#amount" ).val( $( "#slider-range" ).slider( "values", 0 ) +
                " - " + $( "#slider-range" ).slider( "values", 1 ) );

            
        },
        error: function () { },
        });
    
}

function get_sentences(wkkey){

    range_min = $( "#slider-range" ).slider( "values", 0 )
    range_max =  $( "#slider-range" ).slider( "values", 1 )
    lvl_range = _.join(_.range(range_min, range_max+1));
    // console.log("getting levels ", lvl_range)


    $.ajax({
        url: 'https://api.wanikani.com/v2/subjects/?types=vocabulary&levels='+lvl_range,
        type: 'GET',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer '+wkkey);
        },
        data: {},
        success: function (resp) { 
            var gb_lvl = _.groupBy(resp.data, 'data.level')
            display_sentences(gb_lvl)
        },
        error: function () { },
        });

   
}


function display_sentences(data){

    function format_entries(data){

        sentences = _.map(data, (x) => {
            
            const k = x.data.characters
            const k_html = `<td style="width: 10%">
            <a href='${x.data.document_url}' target='_blank'>${k}</a>
            <p class='vocab-reading'>${ _.join(_.map(x.data.readings, (x)=>x.reading))}</p>
            
            </td>`
            _sentences = _.map(x.data.context_sentences, (c)=>
            {
                const ja_span = `<td><span class='ja-text'> ${_.replace(c.ja, k, `<span class="vocab-sentence highlight-kanji">${k}</span>`)} </span></td>`
                const en_span = `<td><span class='en-text'>${c.en}</span></td>`
                return `<tr>${k_html} ${ja_span} ${en_span}</tr>`
            })

            return _sentences})
        
        sentences = _.flatten(sentences)
        // console.log(sentences)
        
        if($("#shuffle-sentences").is(":checked"))
            sentences = _.shuffle(sentences)

        return _.join(sentences,"")

    }

    // console.log(data)
    var levels = _.keys(data).sort()


    html = '<div class="accordion col-md-12 mt-4" id="levels-accordion">'
    for(let _l = 0; _l < levels.length; _l++) {
        const l= levels[_l]

        html += `<div class="accordion-item">
        <div class="accordion-header">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#panelsStayOpen-collapse${l}" aria-expanded="true" aria-controls="panelsStayOpen-collapse${l}">
                Level ${l}
            </button>
        </div>
        <div id="panelsStayOpen-collapse${l}" class="accordion-collapse ${_l?"collapse":""}">
          <div class="accordion-body">
          <table class="table table-hover">
          <tbody>
          ${format_entries(data[l])}
          </tbody>
          </table>
          </div>
        </div>
      </div>`
    }

    html += '</div>'

     $("#display-area").html(html)

}

$( document ).ready(function() {

    const wkkey = refresh_wkkey_cookie()
        
        if(wkkey!==undefined){      
            $("#wk-key").val(wkkey)
        }

    $("#get-user-info").click(()=>{
        const wkkey = refresh_wkkey_cookie()
        if(wkkey===undefined){
            $("#display-area").html("No WaniKani Key set")    
        }
        get_user_info(wkkey)
    })

});