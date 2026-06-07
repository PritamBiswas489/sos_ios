import moment from 'moment-timezone';
import { env } from '../../environment';
import { Platform, Linking } from 'react-native';

export const fileToBase64 = file => {
  return new Promise(resolve => {
    let fileInfo;
    let baseURL = '';
    // Make new FileReader
    let reader = new FileReader();

    // Convert the file to base64 text
    reader.readAsDataURL(file);

    // on reader load somthing...
    reader.onload = () => {
      // Make a fileInfo Object
      baseURL = reader.result;
      // console.log(baseURL);
      resolve(baseURL);
    };
    console.log(fileInfo);
  });
};
export function limitWords(inputString, limit) {
  // Split the input string into an array of words
  const words = inputString.split(/\s+/);

  // If the number of words is already less than or equal to the limit, return the original string
  if (words.length <= limit) {
    return inputString;
  }

  // Select the first 'limit' number of words and join them back into a string
  const limitedWords = words.slice(0, limit);
  return limitedWords.join(' ') + '..';
}
export const getAppUrl = () => {
  const { type, appUrls } = env;
  return appUrls[type].apiUrl;
};
export const getMediaUrl = () => {
  const { type, mediaUrls } = env;
  return mediaUrls[type].apiUrl;
};
export const isValidUrl = str => {
  const pattern = new RegExp(
    '^([a-zA-Z]+:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', // fragment locator
    'i',
  );
  if (!pattern.test(str)) {
    return false;
  }
  return true;
};

function convertImageToBase64(imgUrl, callback) {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = image.naturalHeight;
    canvas.width = image.naturalWidth;
    ctx.drawImage(image, 0, 0);
    const dataUrl = canvas.toDataURL();
    callback && callback(dataUrl);
  };
  image.src = imgUrl;
}
export function imgSrcToBase64(imagUrl) {
  return new Promise(resolve => convertImageToBase64(imagUrl, resolve));
}

export const stringMask = str => {
  return `${str.slice(0, 6)}...${str.slice(-4)}`;
};

export const cardMasking = cardNumber => {
  if (!cardNumber) {
    return cardNumber;
  }
  const cardValue = cardNumber
    .replace(/\D/g, '')
    .match(/(\d{1,4})(\d{0,4})(\d{0,4})(\d{0,4})/);
  console.log('cardValue :>> ', cardValue);
  if (!cardValue) return '';
  const maskedValue = !cardValue[2]
    ? cardValue[1]
    : `${cardValue[1]} ${cardValue[2]}${`${
        cardValue[3] ? ` ${cardValue[3]}` : ''
      }`}${`${cardValue[4] ? ` ${cardValue[4]}` : ''}`}`;
  return maskedValue;
};

export function getLastSeen(timestamp) {
  const now = new Date();
  const lastSeen = new Date(convertUtcToAsiaKolkata(timestamp));
  const timeDiff = now - lastSeen;

  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  // console.log('now :>> ', now, lastSeen);
  if (minutes < 1) {
    return 'Just now';
  } else if (minutes < 60) {
    // return `${minutes}m ago`;
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    // return `${hours}h ago`;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (days < 7) {
    // return `${days}d ago`;
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    const options = {
      //   timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    return lastSeen.toLocaleString('en-US', options);
  }
}

export function getInitialChar(name) {
  const parts = name.trim().split(' ');
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts[parts.length - 1] : '';

  const firstInitial = firstName.charAt(0).toUpperCase();
  const secondInitial = lastName.charAt(0).toUpperCase();

  if (lastName === '') {
    return firstName.slice(0, 2).toUpperCase();
  } else {
    return `${firstInitial}${secondInitial}`;
  }
}
function convertUtcToAsiaKolkata(mstDate) {
  const asiaKolkataDate = moment
    .tz(mstDate, 'America/Denver')
    .tz('Asia/Kolkata');
  return asiaKolkataDate.format('YYYY-MM-DD HH:mm:ss');
}

export const generatePusherChannel = (userId1, userId2) => {
  const ids = [userId1, userId2];
  const sortedId = ids.sort();
  return `presence-channel-${sortedId[0]}-${sortedId[1]}`;
};

export const determineFileType = mimeType => {
  if (mimeType.startsWith('audio/')) {
    return 'AUDIO';
  } else if (mimeType.startsWith('video/')) {
    return 'VIDEO';
  } else if (mimeType.startsWith('image/')) {
    return 'IMAGE';
  } else {
    return 'Unknown';
  }
};

export const formatNumberWithAbbreviation = num => {
  num = num.toString().replace(/[^0-9.]/g, '');
  if (num < 10000) {
    return num;
  }
  let si = [
    { v: 1e3, s: 'K' },
    { v: 1e6, s: 'M' },
    { v: 1e9, s: 'B' },
    { v: 1e12, s: 'T' },
    { v: 1e15, s: 'P' },
    { v: 1e18, s: 'E' },
  ];
  let index;
  for (index = si.length - 1; index > 0; index--) {
    if (num >= si[index].v) {
      break;
    }
  }
  return (
    (num / si[index].v).toFixed(2).replace(/\.0+$|(\.[0-9]*[1-9])0+$/, '$1') +
    si[index].s
  );
};
export const isEmptyObjectOrNull = obj => {
  return obj === null || Object.keys(obj).length === 0;
};

export function bytesToMb(bytes) {
  return bytes / (1024 * 1024); // 1 MB = 1024 KB * 1024 bytes
}

export function getCategory(category, categories) {
  const filteredEntry = categories.find(entry => entry.id === category);
  return filteredEntry;
}
export function getDateString(inputDateString) {
  const inputDate = new Date(inputDateString);
  const options = { day: 'numeric', month: 'long', year: '2-digit' };
  const formattedDate = inputDate.toLocaleDateString('en-GB', options);
  return formattedDate;
}
export function validatePrice(price) {
  // Regular expression to match a valid price format
  const priceRegex =
    /^\$?(\d{1,3}(,\d{3})*(\.\d{1,2})?|\d{1,3}(\.\d{3})*(,\d{1,2})?)$/;

  // Test the input against the regex
  return priceRegex.test(price);
}
export function timeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffInSeconds = Math.floor((now - then) / 1000);

  const secondsInMinute = 60;
  const secondsInHour = 3600;
  const secondsInDay = 86400;
  const secondsInMonth = 2592000; // Roughly 30 days
  const secondsInYear = 31536000;

  if (diffInSeconds < secondsInMinute) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < secondsInHour) {
    const minutes = Math.floor(diffInSeconds / secondsInMinute);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < secondsInDay) {
    const hours = Math.floor(diffInSeconds / secondsInHour);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < secondsInMonth) {
    const days = Math.floor(diffInSeconds / secondsInDay);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < secondsInYear) {
    const months = Math.floor(diffInSeconds / secondsInMonth);
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / secondsInYear);
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
}

export function encodeToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

export function decodeFromBase64(encodedStr) {
  return decodeURIComponent(escape(atob(encodedStr)));
}

export function formatNumberProcessing(num) {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function timeformatting(timestamp) {
  // Create a new Date object from the timestamp
  const date = new Date(timestamp);

  // Set options for formatting to IST and for the desired output format
  const options = {
    timeZone: 'Asia/Kolkata', // IST time zone
    year: 'numeric',
    month: 'short', // Short month name, e.g., 'Sep'
    day: '2-digit', // Day with leading zero if needed
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // 12-hour format with AM/PM
  };

  // Use Intl.DateTimeFormat to format the date
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const formattedOutput = formatter.format(date);

  return formattedOutput;
}

export function timeformatting2(timestamp) {
  // Convert to a Date object
  const date = new Date(timestamp.replace(' ', 'T') + 'Z');
  // Extracting day, month, year, hour, and minute
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getUTCFullYear();
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  // Formatting the output
  const formattedOutput = `${day} ${month} ${year} ${hours}:${minutes} ${ampm}`;

  return formattedOutput;
}

export function datetimeArr(timestamp) {
  // Convert to a Date object
  const datet = new Date(timestamp);

  // Use Intl.DateTimeFormat to automatically handle the conversion to IST (Asia/Kolkata)
  const options = {
    timeZone: 'Asia/Kolkata', // India Time Zone (IST)
    year: 'numeric',
    month: 'short', // Short month name, e.g., 'Sep'
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // 12-hour format with AM/PM
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const formattedDateParts = formatter.formatToParts(datet);

  // Extract the parts (day, month, year, hours, minutes, AM/PM)
  const dateObj = {};
  formattedDateParts.forEach(({ type, value }) => {
    if (type !== 'literal') {
      dateObj[type] = value;
    }
  });

  // Format the output to match your desired structure
  return {
    day: dateObj.day,
    month: dateObj.month,
    year: dateObj.year,
    hours: dateObj.hour,
    minutes: dateObj.minute,
    ampm: dateObj.dayPeriod, // 'AM' or 'PM'
  };
}

export function calculateDaysDifference(dateString) {
  const givenDate = new Date(dateString); // Parse the given date
  const currentDate = new Date(); // Get the current date

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = currentDate - givenDate;

  // Convert milliseconds to days
  const millisecondsInOneDay = 1000 * 60 * 60 * 24;
  const differenceInDays = Math.floor(
    differenceInMilliseconds / millisecondsInOneDay,
  );

  return differenceInDays;
}

export function convertTo12Hour(timeString) {
  // Split the time string into components
  const [hours, minutes, seconds] = timeString.split(':');

  // Convert hours from string to number
  let hoursNumber = parseInt(hours);

  // Determine AM or PM
  const amOrPm = hoursNumber >= 12 ? 'PM' : 'AM';

  // Convert hours to 12-hour format
  hoursNumber = hoursNumber % 12 || 12;

  // Return formatted time string
  return `${hoursNumber}:${minutes}  ${amOrPm}`;
}
export function validateTime(fromTime, toTime) {
  let from = new Date(`1970-01-01T${fromTime}Z`);
  let to = new Date(`1970-01-01T${toTime}Z`);

  if (from.getTime() === to.getTime()) {
    return false;
  } else if (to.getTime() <= from.getTime()) {
    return false;
  } else {
    return true;
  }
}
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function convertToScale(value) {
  if (isNaN(value)) {
    return 'Invalid number';
  }
  if (value >= 1e9) {
    // If the value is a billion or more
    return (value / 1e9).toFixed(2) + 'B';
  } else if (value >= 1e6) {
    // If the value is a million or more
    return (value / 1e6).toFixed(2) + 'M';
  } else if (value >= 1e3) {
    // If the value is a thousand or more
    return (value / 1e3).toFixed(2) + 'K';
  } else {
    // If the value is less than a thousand, return as is
    return value.toString();
  }
}

export function paymentSectionData(account_receivable, account_payable) {
  console.log({ account_receivable, account_payable });
  //account_receivable: account receive from admin
  //account payable : account have to pay admin
  let returnData = {};
  if (account_receivable === account_payable) {
    returnData = {
      action: 'ADJUST',
      amount: formatNumberWithAbbreviation(account_receivable),
      text: 'ADJUSTABLE_BALANCE',
      desc: 'ADJUSTABLE_BALANCE_DESC',
    };
  } else if (account_receivable > 0 && account_payable === 0) {
    returnData = {
      action: 'WITHDRAW',
      amount: formatNumberWithAbbreviation(account_receivable),
      text: 'RECEIVABLE_BALANCE',
      desc: 'RECEIVABLE_BALANCE_DESC',
    };
  } else if (account_receivable === 0 && account_payable > 0) {
    returnData = {
      action: 'PAY_NOW',
      amount: formatNumberWithAbbreviation(account_payable),
      text: 'PAYABLE_BALANCE',
      desc: 'PAYABLE_BALANCE_DESC',
    };
  } else if (account_receivable > account_payable) {
    returnData = {
      action: 'ADJUST_WITHDRAW',
      amount: formatNumberWithAbbreviation(
        account_receivable - account_payable,
      ),
      text: 'FINAL_RECEIVABLE_BALANCE',
      desc: 'FINAL_RECEIVABLE_DESC',
    };
  } else if (account_receivable < account_payable) {
    returnData = {
      action: 'ADJUST_PAY',
      amount: formatNumberWithAbbreviation(
        account_payable - account_receivable,
      ),
      text: 'FINAL_PAYABLE_BALANCE',
      desc: 'FINAL_PAYABLE_DESC',
    };
  }

  return returnData;
}

export function utf8ToBase64(str) {
  const utf8Bytes = new TextEncoder().encode(str);
  const binaryString = Array.from(utf8Bytes)
    .map(byte => String.fromCharCode(byte))
    .join('');
  return btoa(binaryString);
}
export function base64ToUtf8(base64) {
  const binaryString = atob(base64);
  const utf8Bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
  return new TextDecoder().decode(utf8Bytes);
}

//compare times

export function compareTimes(t1, t2) {
  const [hours1, minutes1] = t1.split(':').map(Number);
  const [hours2, minutes2] = t2.split(':').map(Number);

  if (hours1 > hours2 || (hours1 === hours2 && minutes1 > minutes2)) {
    return -1; // t1 is greater than t2
  } else if (hours1 < hours2 || (hours1 === hours2 && minutes1 < minutes2)) {
    return 1; // t1 is less than t2
  } else {
    return 0; // t1 is equal to t2
  }
}

export function compareTimeTwelveHours(t1, t2) {
  const parseTime = time => {
    let [hours, minutes] = time.slice(0, -2).split(':').map(Number);
    const period = time.slice(-2); // AM or PM

    // Convert to 24-hour format
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;

    return { hours, minutes };
  };

  const { hours: hours1, minutes: minutes1 } = parseTime(t1);
  const { hours: hours2, minutes: minutes2 } = parseTime(t2);

  if (hours1 > hours2 || (hours1 === hours2 && minutes1 > minutes2)) {
    return -1; // t1 is greater than t2
  } else if (hours1 < hours2 || (hours1 === hours2 && minutes1 < minutes2)) {
    return 1; // t1 is less than t2
  } else {
    return 0; // t1 is equal to t2
  }
}

export function convertTo24Hour(time) {
  let [hours, minutes] = time.slice(0, -3).split(':').map(Number);
  const period = time.slice(-2); // AM or PM

  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
}

export function from24To12Hour(time) {
  let [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert 00:xx (midnight) to 12:xx AM and 12:xx (noon) stays 12:xx PM
  hours = hours % 12 || 12;

  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function parseTime(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isTimeRangeWithin(timeRange, ranges) {
  const [startTime, endTime] = timeRange.split('-').map(parseTime);

  // console.log({startTime,endTime})

  for (const range of ranges) {
    const [rangeStart, rangeEnd] = range.split('-').map(parseTime);

    // console.log({rangeStart,rangeEnd})

    // Check if any part of the timeRange falls within the range
    if (
      (startTime >= rangeStart && startTime <= rangeEnd) ||
      (endTime >= rangeStart && endTime <= rangeEnd) ||
      (startTime <= rangeStart && endTime >= rangeEnd)
    ) {
      return true;
    }
  }

  return false;
}
export function convertToTitleCase(input) {
  return input
    .split('_') // Split the string by underscores
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(' '); // Join the words with a space
}
export function getIndianPriceFormat(price) {
  const formattedPrice = new Intl.NumberFormat('en-IN').format(price);
  return formattedPrice;
}
export function getFileNameFromUrl(url) {
  const matches = url.match(/([^\/?#]+)(?=[^\/]*$)/);

  return matches ? matches[0] : null;
}

export function getProfileImage(rawUrl) {
  const baseUrl = getAppUrl();
  const mediaUrl = rawUrl.includes('http://localhost:4000')
    ? rawUrl.replace('http://localhost:4000', baseUrl)
    : rawUrl;

  return mediaUrl;
}
export function getMediaUrlFromRawUrl(rawUrl) {
  const baseUrl = getAppUrl();
  const mediaUrl = rawUrl.includes('http://localhost:4000')
    ? rawUrl.replace('http://localhost:4000', baseUrl)
    : rawUrl;

  return mediaUrl;
}

export const formatDateSeparator = timestamp => {
  if (!timestamp) return 'Unknown date';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const diffDays = Math.round((startOfToday - startOfMessageDay) / 86400000);

  if (diffDays === 0) return 'TODAY';
  if (diffDays === 1) return 'YESTERDAY';

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
    .format(date)
    .toUpperCase();
};

export const formatMessageTime = timestamp => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export const handleVideoClickProcess = ({
  isMovFile,
  startConversion,
  onOpenVideoModal,
} = {}) => {
  // If the file is a MOV that needs conversion, trigger conversion
  if (isMovFile && Platform.OS === 'android') {
    startConversion &&
      typeof startConversion === 'function' &&
      startConversion();
    return;
  }

  // Prefer the provided modal handler. If not provided, fall back to Linking.
  if (onOpenVideoModal && typeof onOpenVideoModal === 'function') {
    try {
      onOpenVideoModal();
      return true;
    } catch (e) {}
  }

  return false;
};
