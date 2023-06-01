import type JSZip from "jszip";

// Fetch a file from a url, convert it to a blob and add it to a zip
export const fetchAndZipImg = (url: string, zip: JSZip, path: string) => {
  return fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      // Add the image file to the JSZip file
      zip.file(path, blob);
    })
    .catch((error) => {
      console.error(`fetchAndZipImg Error: ${error}`);
    });
};
