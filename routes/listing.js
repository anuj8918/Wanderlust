const express = require("express");
const router = express.Router();
const multer = require("multer");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const { storage } = require("../cloudconfig.js");

const upload = multer({ storage });

router.route("/")
    .get(listingController.index)
    .post(
        isLoggedIn,
        upload.single("listing[image]"), // Updated field name for image upload
        validateListing,
        listingController.createListing
    );

router.get("/new", isLoggedIn, listingController.renderNewForm);

router.route("/:id")
    .get(listingController.showListing)
    .put(
        isLoggedIn,                   //validate listing
        isOwner,
        upload.single("listing[image]"),
        validateListing,
        listingController.updateListing
    )
    .delete(isLoggedIn, isOwner, listingController.destroyListing);

router.get("/:id/edit", isLoggedIn, isOwner, listingController.renderEditForm);

module.exports = router;
