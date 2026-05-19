import React from 'react';
import { getToken } from '../services/AuthService';

export const formatEvalType = (evalType) => {
  return evalType
    .split('-') // Split the string into an array of words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first letter of each word
    .join(' '); // Join the array back into a single string with spaces
}

export const getCurrentDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

export const getCurrentDateInputString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(today.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

export const statusToLabel = (status) => {
  const badgeClassNames = {
    active: "text-bg-success",
    pending: "text-bg-secondary",
    inactive: "text-bg-warning",
    deleted: "text-bg-danger",
    done: "text-bg-success"
  };

  const badgeClassName = badgeClassNames[status] || "text-bg-dark";

  return (
    <span className={`badge ${badgeClassName}`}>
      {String(status || "unknown").toUpperCase()}
    </span>
  );
}

export const buildHeaders = (args) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

export const buildFileUploadHeaders = (args) => {
  return {
    'Content-Type': 'multipart/form-data',
    'Authorization': `Bearer ${getToken()}`
  }
}

export const hasFormError = (errors, key) => {
  return errors[key] && errors[key].length > 0;
}

export const getInputClassName = (errors, key) => {
  return `form-control ${hasFormError(errors, key) ? 'is-invalid' : ''}`;
}

export const renderInputErrors = (errors, key) => {
  if (hasFormError(errors, key)) {
    return (
      <div className="invalid-feedback">
        {errors[key].join(',')}
      </div>
    );
  } else {
    return (
      <div/>
    );
  }
}

export const generateRandomUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
