document.getElementById('ranking').innerHTML = `
  <div id="film-1">
  <div class="col-1">
    <div id="name-1">5 star
    </div>
  </div>
  <div class="col-2">
    <div class="bar-container">
      <div class="bar bar-5-star">
      </div>
    </div>
  </div>
  <div class="col-3">
    <div id="rating-1" class="rating-total" data-rating-count="0">
    </div>
  </div>
  </div>

  <div id="film-2">
  <div class="col-1">
  <div id="name-2">4 star</div>
  </div>
  <div class="col-2">
  <div class="bar-container">
    <div class="bar bar-4-star"></div>
  </div>
  </div>
  <div class="col-3">
  <div id="rating-2" class="rating-total" data-rating-count="0"></div>
  </div>
  </div>

  <div id="film-3">
  <div class="col-1">
  <div id="name-3">3 star</div>
  </div>
  <div class="col-2">
  <div class="bar-container">
    <div class="bar bar-3-star"></div>
  </div>
  </div>
  <div class="col-3">
  <div id="rating-3" class="rating-total" data-rating-count="0"></div>
  </div>
  </div>

  <div id="film-4">
  <div class="col-1">
  <div id="name-4">3 star</div>
  </div>
  <div class="col-2">
  <div class="bar-container">
    <div class="bar bar-3-star"></div>
  </div>
  </div>
  <div class="col-3">
  <div id="rating-4" class="rating-total" data-rating-count="0"></div>
  </div>
  </div>

  <div id="film-5">
  <div class="col-1">
  <div id="name-5">3 star</div>
  </div>
  <div class="col-2">
  <div class="bar-container">
    <div class="bar bar-3-star"></div>
  </div>
  </div>
  <div class="col-3">
  <div id="rating-5" class="rating-total" data-rating-count="0"></div>
  </div>
  </div>`;

// TODO: modify this!!!
current_user.uid = 'n1oGlF86UrZNIxbgXQ3QQxSGaV13'
thread_id = "-MtgJgdkWeCwCAn3qczb"


// apply user rating to all displays
// add star ratings to an array
var starRating = document.querySelectorAll(".fa-star"),
ratingTotal = document.querySelectorAll(".rating-total");

// convert ratingTotal HTMLCollection to array and reverse its order (5 star <-> 1 star)
var reverseRatingTotal = Array.from(ratingTotal);//.reverse();

// display initial rating totals
displayTotals(true);

// use event listener to record changes to user rating
// starRating.forEach(function(star) {
//   star.addEventListener("click", recordRating);
// })

// function recordRating(event) {
//   // use indexOf to identify selected user rating
//   var userRating = Array.from(starRating).indexOf(event.target);

//   // define selected rating to adjust display totals
//   var selectedIndex;

//   starRating.forEach(function(item, index) {
//     // add or remove .active class based upon selected user rating
//     if (index < userRating + 1) {
//       starRating[index].classList.add("active");
//       selectedIndex = index;
//     } else {
//       starRating[index].classList.remove("active");
//     }

//     displayTotals(selectedIndex);
//   });
// }


const lookup = {
  'Love Is Blind' : 'https://www.youtube.com/watch?v=s2eBAFt3L_0',
  'The Crown' : 'https://www.youtube.com/watch?v=JWtnJjn6ng0',
  'Falling For Christmas' : 'https://www.youtube.com/watch?v=bsNIJd45jYM',
  'The Good Nurse' : 'https://www.youtube.com/watch?v=e0DQevX-GZs',
  'Manifest' : 'https://www.youtube.com/watch?v=0wkMl-igRio'
}

const colors = {
  'Love Is Blind' : 'red',
  'The Crown' : 'pink',
  'Falling For Christmas' : 'green',
  'The Good Nurse' : 'blue',
  'Manifest' : 'black'
}

function playme() {
  var audio = new Audio('assets/drum.mp3');
  audio.play();
}

// display star rating totals from html custom data-
function displayTotals(init=false, order=undefined) {
  if (init === true) {
    console.log('inside');
    $('#film-1').hide();//.remove("active");
    $('#film-2').hide();//classList.remove("active");
    $('#film-3').hide();//classList.remove("active");
    $('#film-4').hide();//classList.remove("active");
    $('#film-5').hide();//classList.remove("active");
  
  }
  var barChart = document.querySelectorAll(".bar"),
    displaySummary = document.querySelectorAll(".summary"),
    numRatings = 0,
    numRatingsValue = 0;

  // convert barChart HTMLCollection to array and reverse its order (5 star <-> 1 star)
  var reverseBarChart = Array.from(barChart);

  reverseRatingTotal.forEach(function(total, index) {
    let count = total.getAttribute("data-rating-count");
    if (count !== 0) { 
      total.innerHTML = total.getAttribute("data-rating-count");
      // adjust unselected bar widths
      reverseBarChart[index].style.width = ((total.getAttribute("data-rating-count") / 20) * 100) + "%";
      if (order) {
        let len = order.length;
        if (index < len) {
          reverseBarChart[index].style.background = colors[order[index][0]];
        }
      }
    }
      // }
    // count total number and value of ratings
    numRatings += parseInt(total.innerHTML);
    numRatingsValue += (parseInt(total.innerHTML) * (index + 1));
  });

  // display rating average and total
  ratingsAverage = (numRatingsValue / numRatings).toFixed(2);
  // displaySummary[0].innerHTML = ratingsAverage + " average based on " + numRatings + " reviews.";
}

function setWinner(winnerUID, filmRef) {
  console.log(winnerUID);
  console.log(filmRef);
  db.ref("winner").update({
    uid: winnerUID
  }).then(() => {
    window.location.href = filmRef;
  });
}

db.ref(`posts/${thread_id}`).child('responses').on('value', snap => {
  console.log(snap.val());
  let d = {}; 
  for (const [key, value] of Object.entries(snap.val())) {
    let film = value.content;
    console.log(film);
    if (!(film in d)) {
      d[film] = [0, "", 2642494872356];
    }
    // console.log(d);
    // TODO: change to smallest!
    console.log(value.timestamp);
    console.log(d[film][2]);
    if (value.timestamp < d[film][2]) {
      d[film][2] = value.timestamp
      d[film][1] = value.user.uid;
      console.log('ici');
    } else {
      console.log('else');
    }
    // d[film][1] = value.user.uid;
    d[film][0]++;
    // console.log(key, value);
  }

  let input = Object.entries(d);
  input.sort((item1, item2) => {
    // console.log(item1[1][0]);
    // console.log(item1 + " vs " + item2);
		return -(item1[1][0] - item2[1][0])
	});

  // debugger;

  console.log(input);

  let index = 1;
  for (const elem of input) {
    $(`#film-${index}`).show();
    $(`#name-${index}`).html(
      `<a onclick="setWinner('${elem[1][1]}', '${lookup[elem[0]]}')">${elem[0]}</a>`
    );
    $(`#rating-${index}`).attr("data-rating-count", elem[1][0]);
    ++index;
  }

  displayTotals(false, input);
  console.log(d);
});