import { passwordValid } from './passwordPolicy';
export const validatePhoneNumber = (phone) => {
  const regex = /^(\+92|0)?[3][0-9]{9}$/;
  return regex.test(phone);
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateCNIC = (cnic) => {
  const regex = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
  return regex.test(cnic);
};

export const validatePassword = (password) => {
  return passwordValid(password);
};

export const validateName = (name) => {
  return name.length >= 2;
};

export const validateVehicleNumber = (number) => {
  return number.length >= 4;
};

export const validateAmount = (amount) => {
  return !isNaN(amount) && parseFloat(amount) > 0;
};

export const validateDate = (date) => {
  return !isNaN(new Date(date).getTime());
};

export const validateTime = (time) => {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
};

export const validateLatLng = (lat, lng) => {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export const validatePostalCode = (code) => {
  const regex = /^[0-9]{5}$/;
  return regex.test(code);
};

export const validateUrl = (url) => {
  const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return regex.test(url);
};