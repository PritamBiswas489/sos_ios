import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import {Dimensions, PixelRatio} from 'react-native';

export const SCREEN_WIDTH = Dimensions.get('window').width;
export const SCREEN_HEIGHT = Dimensions.get('window').height;
const {height, width} = Dimensions.get('window');

export const SW = dimension => {
  return wp((dimension / 375) * 100 + '%');
};

export const SH = dimension => {
  return hp((dimension / 812) * 100 + '%');
};

export const SF = dimension => {
  return hp((dimension / 812) * 100 + '%');
};

export const heightPercent = percent => {
  return hp(percent);
};

export const widthPercent = percent => {
  return wp(percent);
};

export const fontPercent = percent => {
  return hp(percent);
};

export const windowHeight = height => {
  const tempHeight = typeof height === 'number' ? height : parseFloat(height);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * tempHeight) / 100);
};
export const windowWidth = width => {
  const tempWidth = typeof width === 'number' ? width : parseFloat(width);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * tempWidth) / 100);
};
