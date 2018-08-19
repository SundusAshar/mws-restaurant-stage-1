const port = 1337

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    //const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
    //return `http://localhost:${port}/data/restaurants.json`;
  }

  static get REVIEWS_URL() {
    return `http://localhost:${port}/reviews?restaurant_id=`;
    //return `http://localhost:${port}/reviews`;
  }

  static get POST_REVIEWS_URL() {
    return `http://localhost:${port}/reviews`;
  }
  /**
   * Fetch Restaurants from API and add to IDB
   */
  static restaurantsFromAPI(){
    return fetch(DBHelper.DATABASE_URL)
    .then(resp => resp.json())
    .then(resdata => {
      DBHelper.addRestaurantstoIDB(resdata);
      return resdata;
    });
  }

  /**
   * Fetch Reviews from API and add to IDB
   */

  static reviewsFromAPI(rid){
    return fetch(`${DBHelper.REVIEWS_URL}${rid}`)
    //return fetch(DBHelper.REVIEWS_URL)
    .then(resp => resp.json())
    .then(revdata => {
     // console.log("TX=",DBHelper.addReviewstoIDB(revdata));
      console.log(revdata);
      DBHelper.addReviewstoIDB(revdata)
      return revdata;
    });
  }

  /**
   * Create IDB
   */
 
   static openIdb(){
     return idb.open('mws-restaurant', 1, upgradeDB => {
       if(!upgradeDB.objectStoreNames.contains('restaurants')){
         const store = upgradeDB.createObjectStore('restaurants', {
           keyPath: 'id'
         });
       }
       if(!upgradeDB.objectStoreNames.contains('reviews')) {
         const revStore = upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
         revStore.createIndex('restaurant_id', 'restaurant_id', {unique: false});
       }
     });
   }

   /**
    * Add Restaurants Data to IDB
    */
   static addRestaurantstoIDB(jdata){
    return DBHelper.openIdb().then(db => {
      if(!db)
      return;
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      jdata.forEach(element => store.put(element));
      return tx.complete;
    });
  }
/**
 * Add Reviews to IDB
 */
  static addReviewstoIDB(jdata){
    return DBHelper.openIdb().then(db => {
      if(!db)
      return;
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      jdata.forEach(element => store.put(element));
      console.log("Review stored",jdata);
      return tx.complete;
    });
  }
static updateIsFav(restaurantID, isFav){
  console.log("Updating Restaurant: "+ restaurantID + " for IsFav: "+ isFav );
    return fetch(`${DBHelper.DATABASE_URL}/${restaurantID}/?is_favorite=${isFav}`,{method:'PUT'})
  .then(
    DBHelper.openIdb().then(db => {
      if(!db)
      return;
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      store.get(restaurantID).then(restaurant=>{
        restaurant.is_favorite=isFav;
        store.put(restaurant);
      });

      console.log("isFav stored",restaurantID,isFav);
      return tx.complete;
    })
  );
   
}

static keepReviewOffine(review){
  var allOfflineReview = null;
  allOfflineReview = localStorage.getItem('OfflineReviews');
  if (allOfflineReview==null){
    allOfflineReview=[];
  } else {
    allOfflineReview = JSON.parse(allOfflineReview);
  }
  allOfflineReview.push(review);
  localStorage.setItem('OfflineReviews',JSON.stringify(allOfflineReview));
  window.addEventListener('online',(event)=>{
  console.log("Connectivity restored");
  let pendingReviews = JSON.parse(localStorage.getItem('OfflineReviews'));
  if (pendingReviews!=null){
    localStorage.removeItem('OfflineReviews');
    (pendingReviews).forEach(element => {
      DBHelper.postReview(element);
    });
  }
});
}
static postReview (newReview) {
  console.log("Posting Review Submitted",newReview);
  const header = new Headers({ 'Content-Type': 'application/json' });
  const data = JSON.stringify(newReview);
  if (navigator.onLine){
 
  return fetch(DBHelper.POST_REVIEWS_URL, {
    method: 'POST',
    headers: header,
    body: data
  })
    .then(() => {
      console.log("Review Submitted Online",data);
      
      document.getElementById('rform').reset();
      return Promise.resolve();
    })
    .catch(() => {
      console.log("Not Submitted"); //offline
      return Promise.resolve();
    });
  } else {
    console.log("Review Stored Offline for later submission");
    DBHelper.keepReviewOffine(newReview)
  }
}
  /**
   * Read Restaurant Data from IDB
   */
   static restaurantsFromIDB(){
    return DBHelper.openIdb().then(db => {
      if(!db)
      return;
      const tx = db.transaction('restaurants', 'readonly');
      const store = tx.objectStore('restaurants');
      /*if(store.length == 0){
        DBHelper.restaurantsFromAPI();
      }*/
      return store.getAll();
    });
  }

  /**
   * Read Reviews from IDB
   */

  /*static reviewsFromIDB(){
    return DBHelper.openIdb().then(db => {
      if(!db)
      return;
      const tx = db.transaction('reviews', 'readonly');
      const revStore = tx.objectStore('reviews');
      const index = revStore.index('restaurant_id')
      if(store.length == 0){
        DBHelper.reviewsFromAPI();
      }
      return index.getAll();
    });
  }*/
  
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.restaurantsFromAPI().then(allrestaurants=>{
      return allrestaurants; 
    }).then(restaurants => {
      callback(null, restaurants);
    }).catch(error => {
      console.log(error);
      DBHelper.restaurantsFromIDB().then(allrestaurants => {
        //  console.log(allrestaurants);
            return allrestaurants;
        }).then(restaurants => {
          callback(null, restaurants);
        }).catch(error => {
          console.log(error);
          callback(error, null);
        });
      //callback(error, null);
    });;

  }

  /**
   * Fetch all Reviews
   */

  /*static fetchReviews(callback) {
    DBHelper.reviewsFromIDB().then(allreviews => {
      console.log(allreviews);
        return allreviews;
    }).then(reviews => {
      callback(null, reviews);
    }).catch(error => {
      console.log(error);
      callback(error, null);
    });
  }*/

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch Reviews by ID
   */
  /*static fetchReviewsByResturantId(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.find(r => r.restaurant_id == id);
        if (review) {
          console.log(id);
          console.log(r.restaurant_id) // Got the restaurant
          callback(null, review);
        } else { // Reviews does not exist in the database
          callback('Reviews do not exist', null);
        }
      }
    });
  }
  static fetchReviewsById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        callback(error, null);
      } else {
        const review = reviews.find(r => r.id == id);
        if (review) {console.log(id); // Got the restaurant
          callback(null, review);
        } else { // Reviews does not exist in the database
          callback('Reviews do not exist', null);
        }
      }
    });
  }*/
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(!restaurant.photograph)
    restaurant.photograph = 10;
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }


}
