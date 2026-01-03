const { UPLOADTHING_TOKEN } = process.env;

if (!UPLOADTHING_TOKEN) {
  throw new Error(
    "Missing UploadThing environment variable: UPLOADTHING_TOKEN is required"
  );
}

module.exports = {
  UPLOADTHING_TOKEN,
};

