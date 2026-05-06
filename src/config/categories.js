export const categories = [
  {id: 'gp_delivery', name: 'Delivery', icon: 'truck'},
  {
    id: 'apartment',
    name: 'Apartment',
    icon: 'building',
  },

  {
    id: 'car',
    name: 'Car',
    icon: 'car',
  },
  {
    id: 'cloths',
    name: 'Cloths',
    icon: 'shopping-bag',
  },

  {
    id: 'land_sale',
    name: 'Land sale',
    icon: 'tree',
  },

  {id: 'other', name: 'Other', icon: 'question'},
];

import apartment from '../assets/images/category-images/apartment.png';
import car from '../assets/images/category-images/car.png';
import cloths from '../assets/images/category-images/cloths.png';
import gp_delivery from '../assets/images/category-images/gp_delivery.png';
import land_sale from '../assets/images/category-images/land_sale.png';
import favorite from '../assets/images/home/favorite/background.png';


export const  getCategoryDefaultImage = (category) =>{
  if(category === 'apartment'){
    return apartment;
  }else if(category === 'car'){
    return car;
  }else if(category === 'cloths'){
    return cloths;
  }else if(category === 'gp_delivery'){
    return gp_delivery;
  }else if(category === 'land_sale'){
    return land_sale;
  } else{
    return favorite;
  }

}
