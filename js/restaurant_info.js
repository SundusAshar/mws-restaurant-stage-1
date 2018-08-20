let restaurant;
//let reviews;
var newMap ;

document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  
  //TODO: Timer to trigger map
});

document.addEventListener('DOMContentLoaded', (event) => {
  console.log("Map initialised");
  initMap();
  //TODO: Timer to trigger map
});
/**
 * Initialize Google map, called from HTML.
 */


window.initMap = () => {
  console.log("Map initialised");
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic3VuZHVzYXNoYXIiLCJhIjoiY2psMHRhODluMG40YTNxbnE5YW40cGp3eCJ9.B8mb_uWu1_QYOD8uqwNwfA', {
        mapboxToken: '<your MAPBOX API KEY HERE>',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
  /*
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });*/
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name + ' ' + 'Restaurant';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  //fillReviewsHTML();
  restaurantReviews();

}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}
restaurantReviews = () => {

  var resp = DBHelper.reviewsFromAPI(self.restaurant.id).then(
    resp => {
    
      if (resp) {
        console.log("Found Reviews Online", resp);
        fillReviewsHTML(resp)
      } else {

        return DBHelper.openIdb().then(db => {
          if (!db)
            return;
          const tx = db.transaction('reviews', 'readonly');
          const revStore = tx.objectStore('reviews');
        var index = revStore.index('restaurant_id').getAll(self.restaurant.id);
        index.then(allReviews => {
          console.log("Found Reviews IDB", allReviews);
          let pendingReviews = JSON.parse(localStorage.getItem('OfflineReviews'));
          if (pendingReviews){
            allReviews.concat(pendingReviews);
            console.log("Appending Pending Reviews ", allReviews);
          }
          
          fillReviewsHTML(allReviews);
          
        })
      });
    }
  }
  );
  
}
/*
restaurantReviews = () => {
  return DBHelper.openIdb().then(db => {
    if (!db)
      return;
    const tx = db.transaction('reviews', 'readonly');
    const revStore = tx.objectStore('reviews');
      var resp = DBHelper.reviewsFromAPI(self.restaurant.id).then(
      resp => {
        console.log(resp);
        if (resp) {
          fillReviewsHTML(resp)
        } else {
          var index = revStore.index('restaurant_id').getAll(self.restaurant.id);
          index.then(allReviews => {
            /*if(allReviews == 0){
              
            }* /
            fillReviewsHTML(allReviews)
          })
        }
      }
    );

  });
}*/
    
 

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews,skipTitle) => {
  console.log("fillReviewsHTML with reviews ",reviews," skiptitle", skipTitle);
  const container = document.getElementById('reviews-container');
  if (!skipTitle)
  {
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    title.tabIndex = '0';

   // container.innerHTML="";//RESET Previous reviews
    container.appendChild(title);
  }


  if (!reviews) {
    //DBHelper.fetchReviewsByResturantId(id = self.restaurant.id, (error, reviews));

    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.className = "reviewItem";
  const reviewHeader = document.createElement('span');

  if (review.id){
    reviewHeader.className = "reviewHeader"; 
  } else {
    reviewHeader.className = "reviewHeaderPending";
  }
  

  const name = document.createElement('span');
  name.innerHTML = review.name;
  name.className = "reviewerName";
  name.tabIndex = '0';
  reviewHeader.appendChild(name);

  const date = document.createElement('span');
  date.innerHTML = new Date(review.createdAt?review.createdAt:new Date()).toDateString();
  date.className = "reviewDate";
  date.tabIndex = '0';
  reviewHeader.appendChild(date);
  li.appendChild(reviewHeader);

  const rating = document.createElement('span');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = "reviewRating";
  rating.tabIndex = '0';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.tabIndex = '0';
  li.appendChild(comments);


  return li;
}

document.getElementById("btnSave").addEventListener("click", () => {
  if ((document.getElementById("rname").value != "") || (document.getElementById("rcomments").value != "") || (document.getElementById("rrating").value != ""))
  {
    let newReview = {
      restaurant_id: self.restaurant.id,
      name: document.getElementById("rname").value,
      rating: document.getElementById("rrating").value,
      comments: document.getElementById("rcomments").value
    }
    let newArr = [];
  
    newArr.push(newReview);
    DBHelper.postReview(newReview).then(fillReviewsHTML(newArr,true));
    ;
  } else {
    alert("All fields are required");
  }
  
})




/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.tabIndex = '0';
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null; 9
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Register service worker here 
registerServiceWorker = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('sw.js').then(() =>
      console.log('Service Worker Registered!'));
  }
};