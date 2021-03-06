let restaurants,
  neighborhoods,
  cuisines
var newMap;
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  /*
  console.log("Onload called ...");
  setTimeout(() => {
    console.log("Container Updated");
    const name = document.getElementById('map-container');
  name.innerHTML ='<div id="map" role="application" aria-label="Location Map for Restaurants" tabindex="0"></div>';
  }, 1500);
  setTimeout(mapInit(), 3500);*/
  
  fetchNeighborhoods();
  fetchCuisines();
  registerServiceWorker();
  DBHelper.restaurantsFromAPI();
  //DBHelper.reviewsFromAPI();
  
});
document.addEventListener('DOMContentLoaded', (event) => {
  console.log("Map initialised");
  initMap();
  //TODO: Timer to trigger map
});
/*
mapInit = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}*/
/*
*/
/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1Ijoic3VuZHVzYXNoYXIiLCJhIjoiY2psMHRhODluMG40YTNxbnE5YW40cGp3eCJ9.B8mb_uWu1_QYOD8uqwNwfA', {
mapboxToken: 'pk.eyJ1Ijoic3VuZHVzYXNoYXIiLCJhIjoiY2psMHRhODluMG40YTNxbnE5YW40cGp3eCJ9.B8mb_uWu1_QYOD8uqwNwfA',
maxZoom: 18,
attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
  '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
  'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
id: 'mapbox.streets'
}).addTo(newMap);
  
  /*
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });*/
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
setFavIcon = (favIcon)=>{
  if(favIcon.value == `false`){
    favIcon.innerHTML =`♥`;//'☆';// `♡`;
    favIcon.className = 'notFavicon';
    //favIcon.classList.remove('favicon');
    //favIcon.classList.add('notFavicon');
    favIcon.setAttribute('Aria-label', 'Mark as favorite restaurant')
  }
  else {
    favIcon.innerHTML = `♥`;//'★'//`♥`;
    favIcon.className = 'favicon';
    //favIcon.classList.remove('notFavicon');
    //favIcon.classList.add('favicon');
    favIcon.setAttribute('Aria-label', 'Remove from favorite restaurants')
  }
}
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const favIcon = document.createElement('button');
  
  favIcon.value = restaurant.is_favorite;
  
  favIcon.onclick=function(){
    console.log("Fav Button Clicked " + restaurant.is_favorite);
    if (restaurant.is_favorite=='true'){
      restaurant.is_favorite = 'false'  ;
    } else {
      restaurant.is_favorite = 'true'  ;
    }
    favIcon.value= restaurant.is_favorite;
    
    
    setFavIcon(favIcon);
    //const isFav = restaurant.is_favorite;
    DBHelper.updateIsFav(restaurant.id, restaurant.is_favorite);
  }
  setFavIcon(favIcon);
  li.appendChild(favIcon);
  
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = './img/placeholder.webp';
  image.setAttribute("data-src", DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = restaurant.name +' ' + 'Restaurant';
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.tabIndex = '0';
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.tabIndex = '0';
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
  });
  /*restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });*/
}

/**
 * Register Service Worker
 */

 registerServiceWorker = () => {
   if(navigator.serviceWorker){
     navigator.serviceWorker.register('sw.js').then (() => 
    console.log('Service Worker Registered!'));
   }
 };

 

 