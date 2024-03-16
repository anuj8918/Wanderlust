const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    } catch (err) {
        console.error("Error fetching listings:", err);
        req.flash("error", "Failed to fetch listings");
        res.redirect("/");
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id).populate({path:"reviews",
        populate:{
            path:"author",
        },
    })
    .populate("owner");
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        res.render("listings/show.ejs", { listing });
    } catch (err) {
        console.error("Error fetching listing:", err);
        req.flash("error", "Failed to fetch listing");
        res.redirect("/listings");
    }
};

module.exports.createListing = async (req, res) => {
    try {
        const { title, description, price, location, country } = req.body.listing;

        // Forward geocode request to Mapbox
        let response = await geocodingClient.forwardGeocode({ 
            query: location, 
            limit: 1, 
        }).send(); 

        // Extracting geometry from response
        const geometry = response.body.features[0].geometry; 

        // Creating new listing
        const newListing = new Listing({
            title,
            description,
            price,
            location,
            country,
            geometry, // Adding geometry to the new listing
            image: {
                url: req.file.path, // Assuming the Cloudinary URL is stored here
                filename: req.file.filename
            }
        });
        newListing.owner = req.user._id;

        newListing.geometry = response.body.features[0].geometry;
        let savedListing=await newListing.save();
        console.log(savedListing);
        req.flash("success", "New listing created!");
        res.redirect("/listings");
    } catch (err) {
        // Error handling
        console.error("Error creating listing:", err);
        req.flash("error", "Failed to create listing");
        res.redirect("/listings/new");
    }
};


module.exports.renderEditForm = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }
        let originalImageUrl = listing.image.url;
        originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
        res.render("listings/edit.ejs", { listing, originalImageUrl });
    } catch (err) {
        console.error("Error rendering edit form:", err);
        req.flash("error", "Failed to render edit form");
        res.redirect("/listings");
    }
};

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        let listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        if (req.file) {
            listing.image.url = req.file.path; // Assuming the Cloudinary URL is stored here
            listing.image.filename = req.file.filename;
        }
        
        // Update other properties from the request body
        listing.title = req.body.listing.title;
        listing.description = req.body.listing.description;
        listing.price = req.body.listing.price;
        listing.location = req.body.listing.location;
        listing.country = req.body.listing.country;

        await listing.save();

        req.flash("success", "Listing updated!");
        res.redirect(`/listings/${id}`); // Corrected to use `id`
    } catch (err) {
        console.error("Error updating listing:", err);
        req.flash("error", "Failed to update listing");
        res.redirect(`/listings/${id}/edit`);
    }
};

module.exports.destroyListing = async (req, res) => {
    try {
        const { id } = req.params;
        await Listing.findByIdAndDelete(id);
        req.flash("success", "Listing deleted!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Error deleting listing:", err);
        req.flash("error", "Failed to delete listing");
        res.redirect("/listings");
    }
};
